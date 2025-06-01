# DEMO SCENARIO 1: APPROVE - Clear database timeout
def demo_scenario_1_approve():
    """Database timeout - LLM gets it right, human approves"""
    
    alert = {
        "severity": "CRITICAL",
        "check_type": "report_readiness_check",
        "table": "daily_transaction_report", 
        "time_period": "2025-06-01T02:53:32.136584",
        "expected_value": "READY",
        "actual_value": "NOT_READY"
    }
    
    print("🎯 SCENARIO 1: APPROVE (Database Timeout)")
    print("=" * 50)
    print("Alert: Daily transaction report failed")
    print("Expected LLM to identify: Database connection timeout")
    
    return alert

def demo_scenario_2_modify():
    """Memory exhaustion - LLM focuses on wrong thing, human corrects"""
    
    # Create a scenario where LLM might miss memory pattern
    alert = {
        "severity": "WARNING", 
        "check_type": "data_recency_anomaly",
        "table": "daily_summary_report",
        "time_period": "2025-06-01T00:53:32.136584", 
        "expected_value": "0",
        "actual_value": "4.5"
    }
    
    print("🎯 SCENARIO 2: MODIFY (Memory Issue Missed)")
    print("=" * 50)
    print("Alert: Data 4.5 hours behind schedule")
    print("LLM might miss: Memory exhaustion caused the delay")
    print("Human will correct: Add memory constraints to analysis")
    
    return alert

def demo_scenario_3_escalate():
    """Complex issue requiring senior engineering"""
    
    # Add a new complex alert to your data
    complex_alert = {
        "severity": "CRITICAL",
        "check_type": "data_corruption_detected", 
        "table": "payment_transactions",
        "time_period": "2025-06-01T05:30:00.000000",
        "expected_value": "VALID_DATA",
        "actual_value": "CORRUPTED_CHECKSUMS"
    }
    
    print("🎯 SCENARIO 3: ESCALATE (Complex Infrastructure)")
    print("=" * 50)
    print("Alert: Data corruption detected in payment transactions")
    print("Too complex: Potential security breach or hardware failure")
    print("Requires: Senior engineering + security team")
    
    return complex_alert
