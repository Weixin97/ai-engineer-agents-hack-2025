from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class UpstreamDependency(BaseModel):
    source: str
    database: str
    update_frequency: str
    critical: bool


class SLARequirements(BaseModel):
    update_schedule: List[str]
    max_delay_tolerance: str
    data_freshness_requirement: str
    availability_target: str


class TableContext(BaseModel):
    table_name: str
    database: str
    owner: str
    description: str
    upstream_dependencies: List[UpstreamDependency]
    downstream_consumers: List[str]
    sla_requirements: SLARequirements


class LogMetadata(BaseModel):
    try_number: Optional[int] = None
    max_tries: Optional[int] = None
    executor: Optional[str] = None
    pod_name: Optional[str] = None
    error_code: Optional[str] = None
    upstream_source: Optional[str] = None
    incomplete_data_sources: Optional[List[str]] = None
    impact: Optional[str] = None
    check_execution_id: Optional[str] = None
    target_table: Optional[str] = None
    severity: Optional[str] = None
    check_result_id: Optional[str] = None
    downstream_impact: Optional[List[str]] = None


class LogEntry(BaseModel):
    log_id: str
    timestamp: str
    level: str
    dag_id: str
    run_id: str
    task_id: str
    component: str
    message: str
    log_type: str
    metadata: LogMetadata


class Alert(BaseModel):
    severity: str
    check_type: str
    table: str
    time_period: str
    expected_value: str
    actual_value: str


class LLMAnalysis(BaseModel):
    timestamp: str
    prompt_used: str
    llm_response: str
    model_used: str
    context_size: int
    logs_analyzed: int


class HumanReview(BaseModel):
    action: str = Field(..., description="One of: approve, modify, escalate")
    feedback: str = Field("", description="Optional feedback text")
    root_cause_override: Optional[str] = None
    impact_override: Optional[str] = None
    business_impact_override: Optional[str] = None
    recommendations_override: Optional[str] = None


class RootCauseAnalysis(BaseModel):
    primary_cause: str
    human_validation: str
    confidence: str


class ImpactAssessment(BaseModel):
    technical_impact: str
    business_impact: str
    downstream_systems: List[str]


class FinalRecommendation(BaseModel):
    incident_id: str
    timestamp: str
    severity: str
    table_affected: str
    root_cause_analysis: RootCauseAnalysis
    impact_assessment: ImpactAssessment
    recommended_actions: str
    status: str
    escalation_required: bool
    human_feedback: str


class IncidentState(BaseModel):
    """Full incident state model that combines all components."""
    alert: Alert
    table_context: TableContext
    related_logs: List[LogEntry]
    llm_analysis: Optional[LLMAnalysis] = None
    human_review: Optional[HumanReview] = None
    final_recommendation: Optional[FinalRecommendation] = None
    
    # Additional fields for MongoDB
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="new", description="Status of the incident: new, analyzing, human_review, completed, failed")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
