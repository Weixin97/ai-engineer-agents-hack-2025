from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
import json

from app.db.mongodb import get_incidents_collection


class EvaluationMetrics:
    """Metrics for evaluating incident analysis performance."""
    
    @staticmethod
    async def evaluate_llm_analysis(incident_id: str) -> Dict[str, Any]:
        """
        Evaluate the quality of the LLM analysis based on human feedback.
        This implements self-evaluation for the LLM component.
        """
        # Get the incident
        incident = await get_incidents_collection().find_one({"_id": ObjectId(incident_id)})
        if not incident:
            raise ValueError(f"Incident with ID {incident_id} not found")
        
        # Extract relevant components
        llm_analysis = incident.get("llm_analysis", {})
        human_review = incident.get("human_review", {})
        
        # Calculate metrics
        metrics = {
            "incident_id": str(incident["_id"]),
            "timestamp": datetime.utcnow().isoformat(),
            "action_taken": human_review.get("action", "unknown"),
            "feedback_provided": bool(human_review.get("feedback")),
            "overrides_applied": any([
                human_review.get("root_cause_override"),
                human_review.get("impact_override"),
                human_review.get("business_impact_override"),
                human_review.get("recommendations_override")
            ]),
            "analysis_acceptance": human_review.get("action") == "approve",
            "analysis_modification": human_review.get("action") == "modify",
            "analysis_escalation": human_review.get("action") == "escalate",
            "confidence_score": None,  # Will be calculated below
            "improvement_areas": []
        }
        
        # Extract confidence score from LLM response
        llm_response = llm_analysis.get("llm_response", "")
        if "Confidence level:" in llm_response:
            try:
                confidence_part = llm_response.split("Confidence level:")[1].split("\n")[0].strip()
                if "/" in confidence_part:
                    numerator, denominator = confidence_part.split("/")
                    metrics["confidence_score"] = float(numerator) / float(denominator)
                else:
                    metrics["confidence_score"] = float(confidence_part) / 10
            except (ValueError, IndexError):
                metrics["confidence_score"] = None
        
        # Identify improvement areas based on human feedback
        if human_review.get("action") == "modify":
            metrics["improvement_areas"].append("Root cause analysis needs improvement")
            
            # Check specific feedback
            feedback = human_review.get("feedback", "").lower()
            if "root" in feedback or "cause" in feedback:
                metrics["improvement_areas"].append("Root cause identification")
            if "impact" in feedback:
                metrics["improvement_areas"].append("Impact assessment")
            if "recommend" in feedback:
                metrics["improvement_areas"].append("Recommendations")
            if "timeline" in feedback:
                metrics["improvement_areas"].append("Timeline reconstruction")
        
        # Calculate overall quality score (0-1)
        if metrics["analysis_acceptance"]:
            metrics["quality_score"] = 1.0
        elif metrics["analysis_modification"]:
            # If modified, score depends on how many overrides were applied
            override_count = sum([
                1 for k, v in human_review.items() 
                if k.endswith("_override") and v is not None
            ])
            metrics["quality_score"] = max(0.0, 1.0 - (override_count * 0.25))
        elif metrics["analysis_escalation"]:
            metrics["quality_score"] = 0.0  # Escalation means the analysis was inadequate
        else:
            metrics["quality_score"] = 0.5  # Default middle score
        
        # Store evaluation metrics in the incident
        await get_incidents_collection().update_one(
            {"_id": ObjectId(incident_id)},
            {"$set": {
                "evaluation_metrics": metrics,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return metrics
    
    @staticmethod
    async def get_aggregate_metrics() -> Dict[str, Any]:
        """
        Get aggregate metrics across all incidents.
        This provides a system-wide view of performance.
        """
        pipeline = [
            {
                "$match": {
                    "evaluation_metrics": {"$exists": True}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_incidents": {"$sum": 1},
                    "approved_count": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$evaluation_metrics.action_taken", "approve"]},
                                1,
                                0
                            ]
                        }
                    },
                    "modified_count": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$evaluation_metrics.action_taken", "modify"]},
                                1,
                                0
                            ]
                        }
                    },
                    "escalated_count": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$evaluation_metrics.action_taken", "escalate"]},
                                1,
                                0
                            ]
                        }
                    },
                    "avg_quality_score": {"$avg": "$evaluation_metrics.quality_score"},
                    "avg_confidence_score": {"$avg": "$evaluation_metrics.confidence_score"},
                    "improvement_areas": {"$push": "$evaluation_metrics.improvement_areas"}
                }
            }
        ]
        
        result = await get_incidents_collection().aggregate(pipeline).to_list(length=1)
        
        if not result:
            return {
                "total_incidents": 0,
                "approved_rate": 0,
                "modified_rate": 0,
                "escalated_rate": 0,
                "avg_quality_score": 0,
                "avg_confidence_score": 0,
                "common_improvement_areas": []
            }
        
        metrics = result[0]
        total = metrics["total_incidents"]
        
        # Flatten improvement areas and count occurrences
        all_areas = [area for sublist in metrics["improvement_areas"] for area in sublist]
        area_counts = {}
        for area in all_areas:
            area_counts[area] = area_counts.get(area, 0) + 1
        
        # Sort by frequency
        common_areas = sorted(
            [{"area": k, "count": v} for k, v in area_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )
        
        return {
            "total_incidents": total,
            "approved_rate": metrics["approved_count"] / total if total > 0 else 0,
            "modified_rate": metrics["modified_count"] / total if total > 0 else 0,
            "escalated_rate": metrics["escalated_count"] / total if total > 0 else 0,
            "avg_quality_score": metrics["avg_quality_score"] or 0,
            "avg_confidence_score": metrics["avg_confidence_score"] or 0,
            "common_improvement_areas": common_areas[:5]  # Top 5 areas
        }
    
    @staticmethod
    async def get_reliability_metrics() -> Dict[str, Any]:
        """
        Calculate reliability metrics for the incident analysis system.
        This addresses the hackathon topic of ensuring reliability.
        """
        # Get all completed incidents
        completed = await get_incidents_collection().count_documents({"status": "completed"})
        failed = await get_incidents_collection().count_documents({"status": "failed"})
        total = completed + failed
        
        # Calculate time to completion for each incident
        pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "created_at": {"$exists": True},
                    "updated_at": {"$exists": True}
                }
            },
            {
                "$project": {
                    "duration_seconds": {
                        "$divide": [
                            {"$subtract": ["$updated_at", "$created_at"]},
                            1000
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_duration": {"$avg": "$duration_seconds"},
                    "max_duration": {"$max": "$duration_seconds"},
                    "min_duration": {"$min": "$duration_seconds"}
                }
            }
        ]
        
        duration_results = await get_incidents_collection().aggregate(pipeline).to_list(length=1)
        
        # Default values if no completed incidents
        avg_duration = 0
        max_duration = 0
        min_duration = 0
        
        if duration_results:
            avg_duration = duration_results[0]["avg_duration"]
            max_duration = duration_results[0]["max_duration"]
            min_duration = duration_results[0]["min_duration"]
        
        return {
            "total_incidents": total,
            "completion_rate": completed / total if total > 0 else 0,
            "failure_rate": failed / total if total > 0 else 0,
            "avg_processing_time_seconds": avg_duration,
            "max_processing_time_seconds": max_duration,
            "min_processing_time_seconds": min_duration,
            "reliability_score": completed / total if total > 0 else 0
        }
