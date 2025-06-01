def run_scenario_demo(scenario_num):
    """Run a specific scenario demo"""
    
    if scenario_num == 1:
        alert = demo_scenario_1_approve()
        expected_human_response = {
            'action': 'approve',
            'feedback': 'LLM correctly identified database timeout issue',
            'root_cause_override': 'Merchant database connection timeout after 300 seconds',
            'impact_override': 'Daily transaction report marked NOT_READY',
            'business_impact_override': 'Customer dashboards show stale data',
            'recommendations_override': 'Restart merchant DB connection + add connection monitoring'
        }
        
    elif scenario_num == 2:
        alert = demo_scenario_2_modify()
        expected_human_response = {
            'action': 'modify',
            'feedback': 'LLM missed the memory exhaustion root cause',
            'root_cause_override': 'Memory exhaustion (1.8Gi/2.0Gi) caused processing delay, not just data recency',
            'impact_override': 'Pipeline delayed by 4.5 hours due to OOM failures',
            'business_impact_override': 'All downstream reporting systems affected',
            'recommendations_override': 'Increase memory allocation to 4Gi + optimize aggregation queries'
        }
        
    elif scenario_num == 3:
        alert = demo_scenario_3_escalate()
        expected_human_response = {
            'action': 'escalate',
            'feedback': 'Data corruption indicates potential security breach or hardware failure',
            'root_cause_override': 'Systematic data corruption - requires expert investigation',
            'impact_override': 'Critical payment data integrity compromised',
            'business_impact_override': 'Potential financial loss and compliance violations',
            'recommendations_override': 'IMMEDIATE: Stop all payment processing + escalate to security team'
        }