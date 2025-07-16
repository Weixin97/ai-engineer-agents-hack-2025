import json
import os
import csv
import uuid
import pandas as pd
from datetime import datetime
from typing import TypedDict, Dict, Any, List, Optional
from typing_extensions import Literal
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
from app.core.database import DataManager
from app.api.websocket import websocket_manager

data_manager = DataManager()
model = ChatOllama(
    model="llama3.2:latest",
    temperature=0.1,
    base_url= "http://localhost:11434" # os.getenv("OLLAMA_BASE_URL"),
)

class IncidentState(TypedDict):
    incident_id: str
    alert: Dict[str, Any]
    table_context: Dict[str, Any] 
    related_logs: List[Dict[str, Any]]
    llm_analysis: Dict[str, Any]
    human_review: Dict[str, Any]
    final_recommendation: Dict[str, Any]
    workflow_progress: List[Dict[str, Any]]

async def broadcast_progress(
    incident_id: str, 
    step_name: str,
    status: str,
    details: Optional[Dict]=None
):
    """Broadcast workflow progress to WebSocket clients"""
    progress_update = {
        "step_name": step_name,
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "details": details or {}
    }

    await websocket_manager.broadcast_to_incident(incident_id,{
        "type": "workflow_progress",
        "data": progress_update
    })

def get_table_context(state: IncidentState) -> IncidentState:
    """Node 1: Get table context and data lineage"""
    incident_id = state["incident_id"]

    # broadcast start 
    import asyncio
    asyncio.create_task(
        broadcast_progress(
            incident_id,
            "get_table_context", 
            "running"
        )
    )
    print("*** NODE 1: Getting table context and data lineage...""")

    alert = state["alert"]
    table_name = alert.get("table")
    
    table_metadata = data_manager.table_metadata
    
    if table_name not in table_metadata:
        print(f"!! Table {table_name} not found in metadata")
        context = {"error": f"Table {table_name} not found"}
        state["table_context"] = context
        asyncio.create_task(
            broadcast_progress(
                incident_id,
                "get_table_context",
                "failed",
                context
            )
        )
        return state 
    table_info = table_metadata[table_name]

    
    context = {
        "table_name": table_name,
        "database": table_info['table_info']['database'],
        "owner": table_info['table_info']['owner'],
        "description": table_info['table_info']['description'],
        "upstream_dependencies": table_info['data_lineage']['upstream_dependencies'],
        "downstream_consumers": table_info['data_lineage']['downstream_consumers'],
        "sla_requirements": table_info['sla_requirements'],
    }

    print(f"   ✅ Found metadata for table: {table_name}")
    state["table_context"] = context
    
    # add to worflow progress
    progress_entry = {
        "step_name": "get_table_context",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "details": {"table_name": table_name, "dependencies_found": len(context['upstream_dependencies'])}
    }
    state["workflow_progress"].append(progress_entry)
    
    # Broadcast completion
    asyncio.create_task(broadcast_progress(incident_id, "get_table_context", "completed", progress_entry["details"]))
    
    return state

def get_related_logs(state: IncidentState) -> IncidentState:
    """Node 2: Get related Airflow logs"""
    incident_id = state["incident_id"]
    
    import asyncio
    asyncio.create_task(broadcast_progress(incident_id, "get_related_logs", "running"))
    
    print("\n📋 NODE 2: Getting related Airflow logs...")

    alert = state["alert"]
    table_context = state["table_context"]

    if "error" in table_context:
        state["related_logs"] = []
        asyncio.create_task(broadcast_progress(incident_id, "get_related_logs", "completed", {"logs_found": 0}))
        return state

    table_name = alert.get('table')
    alert_time = alert.get('time_period', '')
    alert_date = alert_time.split('T')[0] if alert_time else '2025-06-01'

    upstream_sources = [dep['source'] for dep in table_context.get('upstream_dependencies', [])]
    airflow_logs = data_manager.airflow_logs

    related_logs = []
    for log in airflow_logs:
        log_time = log.get('timestamp', '')
        dag_id = log.get('dag_id', '')
        message = log.get('message', '')
        task_id = log.get('task_id', '')

        if alert_date in log_time:
            if (table_name.replace('_', '-') in dag_id or
                'transaction' in dag_id or
                any(source in message.lower() for source in upstream_sources) or
                any(source in task_id.lower() for source in upstream_sources)):
                related_logs.append(log)

    related_logs.sort(key=lambda x: x.get('timestamp', ''))
    print(f"   ✅ Found {len(related_logs)} related logs")
    
    state["related_logs"] = related_logs
    
    # Add to workflow progress
    progress_entry = {
        "step_name": "get_related_logs",
        "status": "completed", 
        "timestamp": datetime.now().isoformat(),
        "details": {"logs_found": len(related_logs)}
    }
    state["workflow_progress"].append(progress_entry)
    
    asyncio.create_task(broadcast_progress(incident_id, "get_related_logs", "completed", progress_entry["details"]))
    
    return state

def call_llm_analysis(state: IncidentState) -> IncidentState:
    """Node 3: LLM Analysis"""
    incident_id = state["incident_id"]
    
    import asyncio
    asyncio.create_task(broadcast_progress(incident_id, "call_llm_analysis", "running"))
    
    print("\n🤖 NODE 3: LLM Analysis and Reasoning...")

    alert = state["alert"]
    table_context = state["table_context"]
    related_logs = state["related_logs"]
    human_review = state.get("human_review", {})
    
    is_rerun = bool(human_review.get("action") == "modify")

    if is_rerun:
        print("   🔄 Re-running analysis with human feedback...")
    else:
        print("   🆕 Initial analysis...")

    # Prepare context for LLM (same as your original)
    context_prompt = f"""
You are an expert data engineer analyzing a critical incident. Please analyze the following information and provide insights:

INCIDENT ALERT:
- Severity: {alert.get('severity')}
- Check Type: {alert.get('check_type')}
- Table: {alert.get('table')}
- Expected Value: {alert.get('expected_value')}
- Actual Value: {alert.get('actual_value')}
- Time: {alert.get('time_period')}

TABLE CONTEXT: {table_context}

RELATED LOGS: {related_logs}
"""

    if is_rerun:
        context_prompt += f"""
HUMAN FEEDBACK FROM PREVIOUS ANALYSIS:
- Action: {human_review.get('action')}
- Feedback: {human_review.get('feedback', 'No specific feedback')}
- Root Cause Override: {human_review.get('root_cause_override', 'None')}
- Technical Impact Override: {human_review.get('impact_override', 'None')}
- Business Impact Override: {human_review.get('business_impact_override', 'None')}
- Additional Recommendations: {human_review.get('recommendations_override', 'None')}

IMPORTANT: Please incorporate the human feedback above into your analysis.
"""

    analysis_prompt = context_prompt + """
Please provide a structured analysis with the following:

1. ROOT CAUSE ANALYSIS:
   - What is the most likely root cause?
   - What evidence supports this conclusion?
   - Confidence level (1-10)

2. TIMELINE RECONSTRUCTION:
   - Key events leading to the failure
   - Critical decision points

3. IMPACT ASSESSMENT:
   - Immediate impact on data pipeline
   - Downstream systems affected
   - Business impact severity

4. RECOMMENDATIONS:
   - Immediate actions to resolve
   - Preventive measures for future
   - Monitoring improvements

5. ESCALATION DECISION:
   - Should this be escalated to senior engineers?
   - Required skill sets for resolution

Please be specific and actionable in your recommendations.
"""

    try:
        print("   🔄 Sending context to LLM...")
        response = model.invoke(analysis_prompt)

        llm_analysis = {
            "timestamp": datetime.now().isoformat(),
            "prompt_used": analysis_prompt,
            "llm_response": response.content,
            "model_used": "llama3.2:latest",
            "context_size": len(analysis_prompt),
            "logs_analyzed": len(related_logs),
            "is_rerun": is_rerun
        }

        print(f"   ✅ LLM analysis completed")
        
        # Add to workflow progress
        progress_entry = {
            "step_name": "call_llm_analysis",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "details": {
                "response_length": len(response.content),
                "logs_analyzed": len(related_logs),
                "is_rerun": is_rerun
            }
        }
        state["workflow_progress"].append(progress_entry)
        
        asyncio.create_task(broadcast_progress(incident_id, "call_llm_analysis", "completed", progress_entry["details"]))

    except Exception as e:
        print(f"   ❌ LLM analysis failed: {str(e)}")
        llm_analysis = {
            "error": str(e),
            "fallback_message": "LLM analysis unavailable - using rule-based analysis"
        }
        
        asyncio.create_task(broadcast_progress(incident_id, "call_llm_analysis", "failed", {"error": str(e)}))

    state["llm_analysis"] = llm_analysis
    return state

def human_review_node(state: IncidentState) -> IncidentState:
    """Node 4: Human Review - This will pause for API input"""
    incident_id = state["incident_id"]
    
    import asyncio
    asyncio.create_task(broadcast_progress(incident_id, "human_review_node", "waiting_for_input"))
    
    print("\n👤 NODE 4: Human Review (Waiting for API input)...")
    
    # Add to workflow progress
    progress_entry = {
        "step_name": "human_review_node", 
        "status": "waiting_for_input",
        "timestamp": datetime.now().isoformat(),
        "details": {"requires_human_input": True}
    }
    state["workflow_progress"].append(progress_entry)
    
    return state

def generate_final_report(state: IncidentState) -> IncidentState:
    """Node 5: Generate final report"""
    incident_id = state["incident_id"]
    
    import asyncio
    asyncio.create_task(broadcast_progress(incident_id, "generate_final_report", "running"))
    
    print("\n📋 NODE 5: Generating Final Report...")
    alert = state.get("alert", {})
    llm_analysis = state.get("llm_analysis", {})
    human_review = state.get("human_review", {})
    table_context = state.get("table_context", {})

    # Create comprehensive final report
    final_report = {
        "incident_id": incident_id,
        "timestamp": datetime.now().isoformat(),
        "status": "resolved",
        "incident_summary": {
            "table": alert.get('table','Unknown'),
            "severity": alert.get('severity','Unknown'),
            "check_type": alert.get('check_type','Unknown')
        },
        "technical_analysis": {
            "root_cause": human_review.get('root_cause_override', '') or llm_analysis.get('llm_response', ''),
            "impact": human_review.get('impact_override', '') or "Analysis provided by LLM",
            "confidence_level": "Human validated" if human_review.get('action', '') == 'approve' else "Modified by human"
        },
        "resolution": {
            "human_validation": human_review,
            "recommendations": human_review.get('recommendations_override','') or "See LLM analysis",
            "next_steps": [
                "Implement recommended fixes",
                "Monitor system stability", 
                "Update runbooks based on learnings"
            ]
        },
        "metadata": {
            "agent_version": "v1.0-fastapi",
            "model_used": llm_analysis.get('model_used', 'Unknown'),
            "logs_analyzed": len(state.get("related_logs", [])),
            "human_reviewed": True
        }
    }

    print(f"   ✅ Final report generated: {incident_id}")
    
    # Add to workflow progress
    progress_entry = {
        "step_name": "generate_final_report",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "details": {"report_generated": True}
    }

    if "workflow_progress" not in state:
        state["workflow_progress"] = []
    state["workflow_progress"].append(progress_entry)
    
    state["final_recommendation"] = final_report
    
    print(f"Report generated!")
    asyncio.create_task(broadcast_progress(incident_id, "generate_final_report", "completed", final_report))
    
    return state

def escalate_to_experts(state: IncidentState) -> IncidentState:
    """Node 6: Escalate to experts"""
    incident_id = state["incident_id"]
    
    import asyncio
    asyncio.create_task(broadcast_progress(incident_id, "escalate_to_experts", "running"))
    
    print("\n🚨 NODE 6: Escalating to Expert Team...")

    alert = state["alert"]
    human_review = state["human_review"]

    escalation_report = {
        "incident_id": incident_id,
        "timestamp": datetime.now().isoformat(),
        "severity": "ESCALATED",
        "escalation_reason": human_review.get('escalation_reason', 'Complex issue requiring expert analysis'),
        "assigned_team": "Senior Data Engineering",
        "priority": "HIGH",
        "estimated_resolution": "2-4 hours with expert involvement",
        "escalation_required": True,
        "status": "escalated_to_experts",
        "next_steps": [
            "Senior engineer to review within 30 minutes",
            "Incident commander assigned",
            "Regular updates every hour"
        ]
    }

    print(f"   ✅ Escalated: {escalation_report['incident_id']}")
    
    # Add to workflow progress
    progress_entry = {
        "step_name": "escalate_to_experts",
        "status": "completed",
        "timestamp": datetime.now().isoformat(),
        "details": {"escalated": True, "assigned_team": escalation_report["assigned_team"]}
    }
    state["workflow_progress"].append(progress_entry)

    state["final_recommendation"] = escalation_report
    
    asyncio.create_task(broadcast_progress(incident_id, "escalate_to_experts", "completed", escalation_report))
    
    return state

def route_after_human_review(state: IncidentState) -> Literal["call_llm_analysis", "generate_final_report", "escalate_to_experts"]:
    """Route based on human decision"""
    human_action = state["human_review"].get("action", "approve")

    if human_action == "modify":
        print("   🔄 Routing to: Re-run LLM analysis")
        return "call_llm_analysis"
    elif human_action == "approve":
        print("   ✅ Routing to: Generate final report")
        return "generate_final_report"
    elif human_action == "escalate":
        print("   🚨 Routing to: Escalate to experts")
        return "escalate_to_experts"
    else:
        print("   ⚠️ Unknown action, defaulting to: Generate final report")
        return "generate_final_report"



# Create the workflow
def create_agent_workflow():
    """Create and compile the agent workflow"""
    workflow = StateGraph(IncidentState)
    
    # Add nodes
    workflow.add_node("get_table_context", get_table_context)
    workflow.add_node("get_related_logs", get_related_logs)
    workflow.add_node("call_llm_analysis", call_llm_analysis)
    workflow.add_node("human_review_node", human_review_node)
    workflow.add_node("generate_final_report", generate_final_report)
    workflow.add_node("escalate_to_experts", escalate_to_experts)
    
    # Set up edges
    workflow.set_entry_point("get_table_context")
    workflow.add_edge("get_table_context", "get_related_logs")
    workflow.add_edge("get_related_logs", "call_llm_analysis")
    workflow.add_edge("call_llm_analysis", "human_review_node")
    workflow.add_conditional_edges(
        "human_review_node",
        route_after_human_review,
        {
            "call_llm_analysis": "call_llm_analysis",
            "generate_final_report": "generate_final_report",
            "escalate_to_experts": "escalate_to_experts"
        }
    )
    workflow.add_edge("generate_final_report", END)
    workflow.add_edge("escalate_to_experts", END)
    
    # Compile with memory and interrupt
    memory = MemorySaver()
    return workflow.compile(interrupt_before=["human_review_node"], checkpointer=memory)

# Create global app instance
agent_app = create_agent_workflow()