def test_three_scenarios():
    """Test all three scenarios: approve, modify, escalate"""
    
    print("\n" + "="*70)
    print("SCENARIO 1: APPROVE")
    print("="*70)
    
    scenario1_feedback = {
        'action': 'approve',
        'feedback': 'LLM analysis is accurate and comprehensive',
        'root_cause_override': 'Confirmed: Merchant database connection timeout',
        'impact_override': 'Daily transaction report marked NOT_READY',
        'business_impact_override': 'Customer dashboards show stale data',
        'recommendations_override': 'Execute LLM recommended database connectivity checks'
    }
    
    result1 = continue_with_routing(paused_state.copy(), scenario1_feedback)
    
    print("\n" + "="*70)
    print("SCENARIO 2: MODIFY") 
    print("="*70)
    
    scenario2_feedback = {
        'action': 'modify',
        'feedback': 'LLM missed memory issues',
        'root_cause_override': 'Memory exhaustion + database timeout',
        'impact_override': 'Complete pipeline failure',
        'business_impact_override': 'All downstream systems affected',
        'recommendations_override': 'Increase memory + fix connectivity'
    }
    
    result2 = continue_with_routing(paused_state.copy(), scenario2_feedback)
    
    print("\n" + "="*70)
    print("SCENARIO 3: ESCALATE")
    print("="*70)
    
    scenario3_feedback = {
        'action': 'escalate',
        'feedback': 'Issue too complex for current analysis',
        'root_cause_override': 'Systematic infrastructure issue',
        'impact_override': 'Multiple pipeline risk',
        'business_impact_override': 'Potential widespread outage',
        'recommendations_override': 'Escalate to senior engineering team'
    }
    
    result3 = continue_with_routing(paused_state.copy(), scenario3_feedback)
    
    print(f"\n🎯 RESULTS SUMMARY:")
    print(f"Approve - Escalation: {result1.get('final_recommendation', {}).get('escalation_required', False)}")
    print(f"Modify - Root Cause: {result2.get('final_recommendation', {}).get('root_cause_analysis', {}).get('primary_cause', 'N/A')[:40]}...")
    print(f"Escalate - Escalation: {result3.get('final_recommendation', {}).get('escalation_required', False)}")
    
    return result1, result2, result3