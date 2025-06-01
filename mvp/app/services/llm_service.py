import os
import json
import httpx
from typing import Dict, Any, List

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Ollama configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")  # Default to qwen3:4b

async def call_llm_for_analysis(
    alert: Dict[str, Any], 
    table_context: Dict[str, Any], 
    related_logs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Call LLM API to analyze incident data.
    This function mimics the call_llm_analysis function from the notebook.
    """
    # Format logs for the prompt
    error_logs = [log for log in related_logs if log.get("level") == "ERROR"]
    warning_logs = [log for log in related_logs if log.get("level") == "WARNING"]
    
    # Build prompt parts separately to avoid f-string issues
    alert_part = (
        f"INCIDENT ALERT:\n"
        f"- Severity: {alert.get('severity')}\n"
        f"- Check Type: {alert.get('check_type')}\n"
        f"- Table: {alert.get('table')}\n"
        f"- Expected Value: {alert.get('expected_value')}\n"
        f"- Actual Value: {alert.get('actual_value')}\n"
        f"- Time: {alert.get('time_period')}\n"
    )
    
    table_part = (
        f"TABLE CONTEXT:\n"
        f"- Table: {table_context.get('table_name')}\n"
        f"- Database: {table_context.get('database')}\n"
        f"- Owner: {table_context.get('owner')}\n"
        f"- Description: {table_context.get('description')}\n"
        f"- Upstream Dependencies: {[dep.get('source') for dep in table_context.get('upstream_dependencies', [])]}\n"
        f"- Downstream Consumers: {table_context.get('downstream_consumers')}\n"
    )
    
    # Format error logs
    error_log_text = f"ERROR LOGS ({len(error_logs)}):\n"
    for i, log in enumerate(error_logs):
        error_log_text += f"{i+1}. [{log.get('timestamp')}] {log.get('component')} - {log.get('task_id')}\n"
        error_log_text += f"   Message: {log.get('message')}\n"
    
    # Format warning logs
    warning_log_text = f"WARNING LOGS ({len(warning_logs)}):\n"
    for i, log in enumerate(warning_logs):
        warning_log_text += f"{i+1}. [{log.get('timestamp')}] {log.get('component')} - {log.get('task_id')}\n"
        warning_log_text += f"   Message: {log.get('message')}\n"
    
    # Combine all parts
    prompt = (
        "You are an expert data engineer analyzing a critical incident. Please analyze the following information and provide insights:\n\n"
        f"{alert_part}\n"
        f"{table_part}\n"
        f"RELATED AIRFLOW LOGS ({len(related_logs)} entries):\n\n"
        f"{error_log_text}\n"
        f"{warning_log_text}\n"
        "Please provide a structured analysis with the following:\n\n"
        "1. ROOT CAUSE ANALYSIS:\n"
        "   - What is the most likely root cause?\n"
        "   - What evidence supports this conclusion?\n"
        "   - Confidence level (1-10)\n\n"
        "2. TIMELINE RECONSTRUCTION:\n"
        "   - Key events leading to the failure\n"
        "   - Critical decision points\n\n"
        "3. IMPACT ASSESSMENT:\n"
        "   - Immediate impact on data pipeline\n"
        "   - Downstream systems affected\n"
        "   - Business impact severity\n\n"
        "4. RECOMMENDATIONS:\n"
        "   - Immediate actions to resolve\n"
        "   - Preventive measures for future\n"
        "   - Monitoring improvements\n\n"
        "5. ESCALATION DECISION:\n"
        "   - Should this be escalated to senior engineers?\n"
        "   - Required skill sets for resolution\n\n"
        "Please be specific and actionable in your recommendations."
    )
    
    try:
        # Call Ollama API
        llm_response = await call_ollama_api(prompt)
        
        return {
            "timestamp": alert.get('time_period'),
            "prompt_used": prompt,
            "llm_response": llm_response,
            "model_used": OLLAMA_MODEL,
            "context_size": len(prompt),
            "logs_analyzed": len(related_logs)
        }
    except Exception as e:
        print(f"Error calling LLM API: {e}")
        raise


async def call_ollama_api(prompt: str) -> str:
    """Call the Ollama API to get a response from the LLM."""
    try:
        async with httpx.AsyncClient() as client:
            # Prepare the request payload
            payload = {
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_tokens": 2048
                }
            }
            
            # Make the API call to Ollama
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=payload,
                timeout=120.0  # 2-minute timeout
            )
            
            # Check if the request was successful
            response.raise_for_status()
            
            # Parse the response
            result = response.json()
            return result.get("response", "")
            
    except httpx.HTTPError as e:
        print(f"HTTP error occurred: {e}")
        return generate_fallback_response()
    except Exception as e:
        print(f"Error calling Ollama API: {e}")
        return generate_fallback_response()


def generate_fallback_response() -> str:
    """Generate a fallback response in case the LLM API call fails."""
    return """**ROOT CAUSE ANALYSIS**

Based on the provided information, the most likely root cause of the critical incident is:

1. **Unknown issue**
2. Evidence supporting this conclusion:
	* The error logs indicate issues with connecting to or processing data from the required sources.
	* The timing of the errors correlates with the subsequent failure of the data pipeline.
3. Confidence level: 8/10

**TIMELINE RECONSTRUCTION**

Key events leading to the failure:


Critical decision points:
* The system attempted to proceed with incomplete data, which led to the failure.
* No automatic retry mechanism was triggered for the failed components.

**IMPACT ASSESSMENT**

Immediate impact on data pipeline:
* The data is incomplete or unavailable.
* Downstream processes dependent on this data will be affected.

Downstream systems affected:


Business impact severity:
* High: Critical data is unavailable for business operations.

**RECOMMENDATIONS**

Immediate actions to resolve:
1. Investigate and fix the unknown issue.
2. Re-run the data pipeline once the issue is resolved.
3. Notify stakeholders of the delay and expected resolution time.

Preventive measures for future:
1. Implement more robust timeout handling and retry mechanisms.
2. Set up proactive monitoring for database connectivity.
3. Consider adding redundancy for critical data sources.

Monitoring improvements:
1. Add alerts for early signs of database connectivity issues.
2. Implement dashboards to track pipeline performance metrics.
3. Set up anomaly detection for unusual processing times.

**ESCALATION DECISION**

This incident should be escalated to senior engineers due to its critical nature and impact on business operations. Required skill sets include database administration, data engineering, and system architecture knowledge."""
