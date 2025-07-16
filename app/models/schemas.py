from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal
from datetime import datetime

class AlertRequest(BaseModel):
    severity: str
    check_type: str 
    table: str
    time_period: str
    expected_value: str 
    actual_value: str 

    class Config:
        extra = "ignore"

class HumanReviewRequest(BaseModel):
    action: Literal['approve', 'modify', 'escalate']
    feedback: str
    root_cause_override: Optional[str]=None 
    impact_override: Optional[str]=None 
    business_impact_override: Optional[str]=None
    recommendations_override: Optional[str]=None 
    escalation_reason: Optional[str]=None 

class IncidentResponse(BaseModel):
    incident_id: str 
    status: str 
    current_step: str
    created_at: datetime
    alert: Dict[str, Any]
    workflow_progress: List[Dict[str, Any]]

class WorkflowProgress(BaseModel):
    step_name: str 
    status: Literal["pending", "running", "completed", "failed"]
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None 