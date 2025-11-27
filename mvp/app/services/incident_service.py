from typing import Dict, Any, List, Optional, TypedDict, Union
from datetime import datetime
import json
from bson import ObjectId

from app.utils.json_encoder import jsonable_encoder

from app.db.mongodb import (
    get_incidents_collection,
    get_table_metadata_collection,
    get_logs_collection,
    get_llm_analysis_collection,
    get_human_reviews_collection,
    get_recommendations_collection
)
from app.services.llm_service import call_llm_for_analysis
from app.models.incident import IncidentState, FinalRecommendation, RootCauseAnalysis, ImpactAssessment


async def create_incident(incident_data: Dict[str, Any], auto_analyze: bool = False) -> str:
    """Create a new incident in the database and optionally start analysis."""
    # Set initial status
    incident_data["status"] = "new"
    incident_data["created_at"] = datetime.utcnow()
    incident_data["updated_at"] = datetime.utcnow()
    
    # Insert into MongoDB
    result = await get_incidents_collection().insert_one(incident_data)
    incident_id = str(result.inserted_id)
    
    # Automatically start analysis if requested
    if auto_analyze:
        # Run analysis in background without waiting for it to complete
        import asyncio
        asyncio.create_task(analyze_incident(incident_id))
    
    return incident_id


async def get_incident(incident_id: str) -> Optional[Dict[str, Any]]:
    """Get an incident by ID."""
    incident = await get_incidents_collection().find_one({"_id": ObjectId(incident_id)})
    if incident:
        return jsonable_encoder(incident)
    return None


async def update_incident_status(incident_id: str, status: str) -> bool:
    """Update the status of an incident."""
    result = await get_incidents_collection().update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0


async def get_table_context(table_name: str) -> Dict[str, Any]:
    """Get table metadata context for the specified table."""
    # This mimics the get_table_context function from the notebook
    table_metadata = await get_table_metadata_collection().find_one({"table_name": table_name})
    
    if not table_metadata:
        # If not found in DB, return a minimal context
        return {
            "table_name": table_name,
            "database": "unknown",
            "owner": "unknown",
            "description": "No metadata available",
            "upstream_dependencies": [],
            "downstream_consumers": [],
            "sla_requirements": {
                "update_schedule": [],
                "max_delay_tolerance": "unknown",
                "data_freshness_requirement": "unknown",
                "availability_target": "unknown"
            }
        }
    
    # Remove MongoDB ID from the result
    if "_id" in table_metadata:
        table_metadata.pop("_id")
    
    return table_metadata


async def get_related_logs(alert: Dict[str, Any], table_context: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get logs related to the incident."""
    # This mimics the get_related_logs function from the notebook
    table_name = alert.get("table")
    time_period = alert.get("time_period")
    
    # Get logs from the last 24 hours related to this table or its dependencies
    # In a real implementation, you would use a more sophisticated time range
    upstream_sources = [dep.get("source") for dep in table_context.get("upstream_dependencies", [])]
    
    # Query MongoDB for relevant logs
    logs_cursor = get_logs_collection().find({
        "$or": [
            {"metadata.target_table": table_name},
            {"task_id": {"$regex": table_name, "$options": "i"}},
            {"metadata.upstream_source": {"$in": upstream_sources}},
            {"task_id": {"$in": upstream_sources}}
        ]
    }).sort("timestamp", -1).limit(20)  # Get the most recent logs
    
    logs = await logs_cursor.to_list(length=20)
    
    # Remove MongoDB IDs
    for log in logs:
        if "_id" in log:
            log["_id"] = str(log["_id"])
    
    return logs


async def analyze_incident(incident_id: str) -> Dict[str, Any]:
    """
    Run the full incident analysis workflow.
    This implements the workflow from the notebook in an async manner.
    """
    # Get the incident
    incident = await get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident with ID {incident_id} not found")
        
    # Convert ObjectId to string
    incident = jsonable_encoder(incident)
    
    # Update status to analyzing
    await update_incident_status(incident_id, "analyzing")
    
    # Extract alert from incident
    alert = incident.get("alert", {})
    
    # Step 1: Get table context
    table_context = await get_table_context(alert.get("table", ""))
    
    # Update incident with table context
    await get_incidents_collection().update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"table_context": table_context, "updated_at": datetime.utcnow()}}
    )
    
    # Step 2: Get related logs
    related_logs = await get_related_logs(alert, table_context)
    
    # Update incident with related logs
    await get_incidents_collection().update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"related_logs": related_logs, "updated_at": datetime.utcnow()}}
    )
    
    # Step 3: Call LLM for analysis
    try:
        llm_analysis = await call_llm_for_analysis(alert, table_context, related_logs)
        
        # Store LLM analysis in its collection
        llm_analysis["incident_id"] = incident_id
        llm_analysis_id = await get_llm_analysis_collection().insert_one(llm_analysis)
        
        # Update incident with LLM analysis
        await get_incidents_collection().update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {"llm_analysis": llm_analysis, "updated_at": datetime.utcnow()}}
        )
        
        # Update status to human_review
        await update_incident_status(incident_id, "human_review")
        
        # Get the updated incident
        updated_incident = await get_incident(incident_id)
        return updated_incident
    
    except Exception as e:
        print(f"Error during LLM analysis: {e}")
        await update_incident_status(incident_id, "failed")
        raise


async def process_human_review(incident_id: str, human_review: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process human review feedback and continue the workflow.
    This mimics the human_review_node and route_after_human_review functions from the notebook.
    """
    # Get the incident
    incident = await get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident with ID {incident_id} not found")
    
    # Store human review in its collection
    human_review["incident_id"] = incident_id
    human_review["timestamp"] = datetime.utcnow().isoformat()
    await get_human_reviews_collection().insert_one(human_review)
    
    # Update incident with human review
    await get_incidents_collection().update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {"human_review": human_review, "updated_at": datetime.utcnow()}}
    )
    
    # Route based on human action
    action = human_review.get("action", "")
    
    if action == "approve":
        # Generate final recommendation
        final_recommendation = await generate_final_report(incident_id)
        return final_recommendation
    
    elif action == "modify":
        # In a real implementation, you would re-run the LLM analysis with the human feedback
        # For this example, we'll just generate a modified final recommendation
        final_recommendation = await generate_final_report(incident_id, modified=True)
        return final_recommendation
    
    elif action == "escalate":
        # Generate escalated recommendation
        final_recommendation = await generate_final_report(incident_id, escalated=True)
        return final_recommendation
    
    else:
        raise ValueError(f"Invalid human review action: {action}")


async def generate_final_report(
    incident_id: str, 
    modified: bool = False, 
    escalated: bool = False
) -> Dict[str, Any]:
    """
    Generate the final incident report.
    This mimics the finalize_recommendation function from the notebook.
    """
    # Get the incident
    incident = await get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident with ID {incident_id} not found")
    
    alert = incident.get("alert", {})
    human_review = incident.get("human_review", {})
    
    # Create the final recommendation
    final_recommendation = {
        "incident_id": f"INC-{alert.get('table')}-{alert.get('time_period')}",
        "timestamp": alert.get("time_period"),
        "severity": alert.get("severity"),
        "table_affected": alert.get("table"),
        "root_cause_analysis": {
            "primary_cause": human_review.get("root_cause_override", "Based on LLM analysis"),
            "human_validation": human_review.get("action", "approve"),
            "confidence": "High" if human_review.get("action") == "approve" else "Medium"
        },
        "impact_assessment": {
            "technical_impact": human_review.get("impact_override", "Standard pipeline impact"),
            "business_impact": human_review.get("business_impact_override", "Reporting delays"),
            "downstream_systems": incident.get("table_context", {}).get("downstream_consumers", [])
        },
        "recommended_actions": human_review.get("recommendations_override", "Follow LLM recommendations"),
        "status": "analysis_complete",
        "escalation_required": escalated or human_review.get("action") == "escalate",
        "human_feedback": human_review.get("feedback", "")
    }
    
    # Store final recommendation in its collection
    await get_recommendations_collection().insert_one({
        **final_recommendation,
        "incident_id": incident_id
    })
    
    # Update incident with final recommendation
    await get_incidents_collection().update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": {
            "final_recommendation": final_recommendation, 
            "status": "completed",
            "updated_at": datetime.utcnow()
        }}
    )
    
    # Get the updated incident
    updated_incident = await get_incident(incident_id)
    return updated_incident


async def list_incidents(
    status: Optional[str] = None, 
    limit: int = 10, 
    skip: int = 0
) -> List[Dict[str, Any]]:
    """List incidents with optional filtering by status."""
    query = {}
    if status:
        query["status"] = status
    
    cursor = get_incidents_collection().find(query).sort("created_at", -1).skip(skip).limit(limit)
    incidents = await cursor.to_list(length=limit)
    
    # Use jsonable_encoder to handle ObjectId and datetime conversion
    return jsonable_encoder(incidents)
