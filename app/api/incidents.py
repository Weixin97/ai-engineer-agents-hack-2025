from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from app.models.schemas import AlertRequest, HumanReviewRequest, IncidentResponse
from app.core.agent import agent_app, IncidentState
from app.api.websocket import websocket_manager
from datetime import datetime
from typing import Dict
import uuid 
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# in-memory storage for demo
active_incidents: Dict[str, dict] = {}

@router.post("/incidents") #, response_model=IncidentResponse
async def create_incident(
    alert: AlertRequest,
    background_tasks: BackgroundTasks
):
    """Create a new incident and start the agent workflow"""

    incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}={str(uuid.uuid4())[:8]}"

    # initial incident state
    initial_state = {
        "incident_id": incident_id,
        "alert": alert.dict(),
        "table_context": {},
        "related_logs": [],
        "llm_analysis": {},
        "human_review": {},
        "final_recommendation": {},
        "workflow_progress": []
    }

    # store in mem
    active_incidents[incident_id] = {
        "incident_id": incident_id,
        "status": "running",
        "current_step": "get_table_context",
        "created_at": datetime.now(),
        "alert": alert.dict(),
        "workflow_progress": []
    }

    # start wf 
    background_tasks.add_task(run_agent_workflow, incident_id, initial_state)
    return {
            "incident_id": incident_id,
            "status": "running",
            "current_step": "get_table_context",
            "created_at": datetime.now().isoformat(),
            "alert": alert.dict(),
            "workflow_progress": []
        }
    # return IncidentResponse(
    #     incident_id=incident_id,
    #     status="running",
    #     current_step="get_table_context",
    #     created_at=datetime.now(),
    #     alert=alert.dict(),
    #     workflow_progress=[]
    # )

async def run_agent_workflow(
    incident_id: str, 
    initial_state: IncidentState
):
    """Run the agent workflow until it hits the human review interrupt"""
    try:
        config = {"configurable": {
            "thread_id": incident_id
        }}

        result = agent_app.invoke(initial_state, config)

        # update incident status
        if incident_id in active_incidents:
            active_incidents[incident_id]["status"] = "waiting_for_human_review"
            active_incidents[incident_id]["current_step"] = "human_review_node"
            active_incidents[incident_id]["llm_analysis"] = result.get("llm_analysis", {})
            active_incidents[incident_id]["workflow_progress"] = result.get("workflow_progress", [])
            
        await websocket_manager.broadcast_to_incident(
            incident_id, {
                "type": "human_review_required",
                "data": {
                    "incident_id": incident_id,
                    "llm_analysis": result.get("llm_analysis", {}),
                    "status": "waiting_for_huamn_review"
                }
            }
        )

        logger.info(f"Workflow paused for human review: {incident_id}")
    
    except Exception as e:
        logger.error(f"Error in agent workflow for {incident_id}: {str(e)}")

        # update incident with error
        if incident_id in active_incidents:
            active_incidents[incident_id]['status'] = 'error'
            active_incidents[incident_id]['error'] = str(e)

        await websocket_manager.broadcast_to_incident(
            incident_id, {
                "type": "workflow_error",
                "data": {
                    "error": str(e)
                }
            }
        )

@router.get("/incidents")
async def list_incidents():
    """Get all incidents"""
    try:
        incidents_list = []
        for incident in active_incidents.values():
            # Convert datetime to string for JSON serialization
            incident_copy = incident.copy()
            if isinstance(incident_copy.get('created_at'), datetime):
                incident_copy['created_at'] = incident_copy['created_at'].isoformat()
            incidents_list.append(incident_copy)
        
        return {"incidents": incidents_list}
    except Exception as e:
        logger.error(f"ERROR listing incidents: {e}")
        return {"incidents": []}

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get specific incident details"""
    if incident_id not in active_incidents:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return active_incidents[incident_id]

@router.post("/incidents/{incident_id}/review")
async def submit_human_review(incident_id: str, review: HumanReviewRequest, background_tasks: BackgroundTasks):
    """Submit human review and continue workflow"""

    if incident_id not in active_incidents:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    config = {"configurable": {
        "thread_id": incident_id
    }}
    agent_app.update_state(
        config, {"human_review": review.dict()}
    )

    # cont wf in background
    background_tasks.add_task(continue_agent_workflow, incident_id, review.dict())

    # update incident status
    active_incidents[incident_id]['status'] = 'processing_review'
    active_incidents[incident_id]['human_review'] = review.dict()

    return {
        "message": "Human review submitted",
        "action": review.action
    }

async def continue_agent_workflow(
    incident_id: str,
    human_review: dict 
):
    try:
        config = {
            "configurable": {
                "thread_id": incident_id
            }
        }

        while True:
            result = None
            has_more_steps = False

            for step in agent_app.stream(None, config):
                has_more_steps = True
                step_name = list(step.keys())[0]
                result = step[step_name]

                logger.info(f"Executing step: {step_name} for incident {incident_id}")
                if result is None:
                    logger.warning(f"Step {step_name} returned None result, skipping update")
                    continue

                # update incident with latest state
                if incident_id in active_incidents:
                    active_incidents[incident_id]["current_step"] = step_name
                    if isinstance(result, dict):
                        if "workflow_progress" in result:
                            active_incidents[incident_id]["workflow_progress"] = result["workflow_progress"]

                        if "final_recommendation" in result:
                            active_incidents[incident_id]["final_recommendation"] = result["final_recommendation"]
                # if we hit another interrupt (modify action), break and wait 
                if step_name == "__interrupt__":
                    active_incidents[incident_id]["status"] = "waiting_for_human_review"
                    await websocket_manager.broadcast_to_incident(
                        incident_id, {
                            "type": "human_review_required",
                            "data": {
                                "incident_id": incident_id,
                                "llm_analysis": result.get("llm_analysis", {}) if isinstance(result, dict) else {},
                                "status": "waiting_for_human_review"
                            }
                        }
                    )   
                    return 
            
            if not has_more_steps:
                break 

        final_status = "escalated" if human_review.get("action") == "escalate" else "completed"
        active_incidents[incident_id]["status"] = final_status
        if isinstance(result, dict) and "final_recommendation" in result:
            active_incidents[incident_id]["final_recommendation"] = result["final_recommendation"]

        # notify completion
        await websocket_manager.broadcast_to_incident(
            incident_id, {
                "type": "workflow_completed",
                "data": {
                    "incident_id": incident_id,
                    "status": final_status,
                    "final_recommendation": result.get("final_recommendation", {}) if isinstance(result, dict) else {}
                }
            }
        )

        logger.info(f"Workflow completed for incident {incident_id} with status: {final_status}")
    
    except Exception as e:
        logger.error(
            f"ERROR continuing workflow for {incident_id}: {str(e)}"
        )

        if incident_id in active_incidents:
            active_incidents[incident_id]['status'] = 'error'
            active_incidents[incident_id]['error'] = str(e)

        await websocket_manager.broadcast_to_incident(
            incident_id, {
                "type": "workflow_error",
                "data": {"error": str(e)}
            }
        )

@router.websocket("/incidents/{incident_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket, incident_id: str
):
    await websocket_manager.connect(websocket, incident_id)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket_manager.send_personal_message(
                f"Echo: {data}", websocket
            )
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, incident_id)

