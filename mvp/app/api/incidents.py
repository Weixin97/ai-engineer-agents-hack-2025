from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional, Dict, Any
from bson import ObjectId

from app.models.incident import IncidentState, HumanReview
from app.services.incident_service import (
    create_incident,
    get_incident,
    analyze_incident,
    process_human_review,
    list_incidents
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_new_incident(incident: IncidentState, auto_analyze: bool = Query(True, description="Automatically analyze the incident after creation")) -> Dict[str, str]:
    """Create a new incident for analysis."""
    try:
        # Convert Pydantic model to dict
        incident_dict = incident.model_dump(exclude={"id", "created_at", "updated_at"})
        incident_id = await create_incident(incident_dict, auto_analyze=auto_analyze)
        
        message = "Incident created successfully"
        if auto_analyze:
            message += " and analysis started"
            
        return {"incident_id": incident_id, "message": message}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create incident: {str(e)}"
        )


@router.get("/")
async def get_all_incidents(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0)
) -> List[Dict[str, Any]]:
    """Get all incidents with optional filtering."""
    try:
        incidents = await list_incidents(status=status, limit=limit, skip=skip)
        return incidents
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incidents: {str(e)}"
        )


@router.get("/{incident_id}")
async def get_incident_by_id(incident_id: str) -> Dict[str, Any]:
    """Get an incident by ID."""
    try:
        incident = await get_incident(incident_id)
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident with ID {incident_id} not found"
            )
        return incident
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid incident ID format: {incident_id}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve incident: {str(e)}"
        )


@router.post("/{incident_id}/analyze")
async def start_incident_analysis(incident_id: str) -> Dict[str, Any]:
    """Start the incident analysis workflow."""
    try:
        result = await analyze_incident(incident_id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/{incident_id}/human-review")
async def submit_human_review(incident_id: str, review: HumanReview) -> Dict[str, Any]:
    """Submit human review for an incident."""
    try:
        # Convert Pydantic model to dict
        review_dict = review.model_dump()
        result = await process_human_review(incident_id, review_dict)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process human review: {str(e)}"
        )
