from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any

from app.services.evaluation_service import EvaluationMetrics

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.post("/incidents/{incident_id}")
async def evaluate_incident(incident_id: str) -> Dict[str, Any]:
    """
    Evaluate an incident analysis based on human feedback.
    This endpoint implements self-evaluation for the agent.
    """
    try:
        metrics = await EvaluationMetrics.evaluate_llm_analysis(incident_id)
        return metrics
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )


@router.get("/aggregate")
async def get_aggregate_metrics() -> Dict[str, Any]:
    """
    Get aggregate evaluation metrics across all incidents.
    This provides a system-wide view of agent performance.
    """
    try:
        metrics = await EvaluationMetrics.get_aggregate_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve aggregate metrics: {str(e)}"
        )


@router.get("/reliability")
async def get_reliability_metrics() -> Dict[str, Any]:
    """
    Get reliability metrics for the incident analysis system.
    This addresses the hackathon topic of ensuring reliability.
    """
    try:
        metrics = await EvaluationMetrics.get_reliability_metrics()
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reliability metrics: {str(e)}"
        )
