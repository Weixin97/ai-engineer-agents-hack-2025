def get_cli_input() -> dict[str, any]:
    """Get human feedback from CLI input"""
    print("\n" + "="*60)
    print("🤖 HUMAN REVIEW REQUIRED")
    print("="*60)
    
    print("\nAvailable actions:")
    print("1. approve - Analysis looks good, proceed")
    print("2. modify - Analysis needs changes")
    print("3. escalate - Send to senior engineers")
    
    # Get action
    while True:
        action = input("\nEnter your decision (approve/modify/escalate): ").strip().lower()
        if action in ['approve', 'modify', 'escalate']:
            break
        print("❌ Invalid action. Please enter: approve, modify, or escalate")
    
    # Get feedback
    feedback = input("Enter your feedback/comments: ").strip()
    
    # Get additional details based on action
    human_input = {
        'action': action,
        'feedback': feedback
    }
    
    if action in ['approve', 'modify']:
        print("\n📝 Provide additional details (press Enter to skip):")
        
        root_cause = input("Root cause override: ").strip()
        if root_cause:
            human_input['root_cause_override'] = root_cause
            
        impact = input("Technical impact: ").strip()
        if impact:
            human_input['impact_override'] = impact
            
        business_impact = input("Business impact: ").strip()
        if business_impact:
            human_input['business_impact_override'] = business_impact
            
        recommendations = input("Recommendations: ").strip()
        if recommendations:
            human_input['recommendations_override'] = recommendations
    
    elif action == 'escalate':
        print("\n🚨 Escalation details:")
        escalation_reason = input("Escalation reason (optional): ").strip()
        if escalation_reason:
            human_input['escalation_reason'] = escalation_reason
    
    return human_input

def get_cli_input_auto(scenario_num=None, demo_mode=False) -> dict[str, any]:
    """Get human feedback from CLI input with optional demo mode"""
    
    # Demo responses for each scenario
    demo_responses = {
        1: {
            'action': 'approve',
            'feedback': 'LLM correctly identified database timeout issue',
            'root_cause_override': 'Merchant database connection timeout after 300 seconds',
            'impact_override': 'Daily transaction report marked NOT_READY',
            'business_impact_override': 'Customer dashboards show stale data',
            'recommendations_override': 'Restart merchant DB connection + add connection monitoring'
        },
        2: {
            'action': 'modify',
            'feedback': 'LLM missed the memory exhaustion root cause',
            'root_cause_override': 'Memory exhaustion (1.8Gi/2.0Gi) caused processing delay, not just data recency',
            'impact_override': 'Pipeline delayed by 4.5 hours due to OOM failures',
            'business_impact_override': 'All downstream reporting systems affected',
            'recommendations_override': 'Increase memory allocation to 4Gi + optimize aggregation queries'
        },
        3: {
            'action': 'escalate',
            'feedback': 'Data corruption indicates potential security breach or hardware failure',
            'escalation_reason': 'unclear root cause'
        }
    }
    
    print("\n" + "="*60)
    print("🤖 HUMAN REVIEW REQUIRED")
    print("="*60)
    
    print("\nAvailable actions:")
    print("1. approve - Analysis looks good, proceed")
    print("2. modify - Analysis needs changes")
    print("3. escalate - Send to senior engineers")
    
    # Demo mode - auto-populate
    if demo_mode and scenario_num in demo_responses:
        print(f"\n🎬 DEMO MODE: Auto-filling Scenario {scenario_num} response")
        response = demo_responses[scenario_num]
        
        print(f"✅ Action: {response['action']}")
        print(f"💬 Feedback: {response['feedback']}")
        
        # Show what would be filled
        if 'root_cause_override' in response:
            print(f"🔧 Root Cause: {response['root_cause_override']}")
        if 'impact_override' in response:
            print(f"📊 Impact: {response['impact_override']}")
            
        return response
    
    # Manual mode (your existing logic)
    while True:
        action = input("\nEnter your decision (approve/modify/escalate): ").strip().lower()
        if action in ['approve', 'modify', 'escalate']:
            break
        print("❌ Invalid action. Please enter: approve, modify, or escalate")
    
    feedback = input("Enter your feedback/comments: ").strip()
    
    human_input = {
        'action': action,
        'feedback': feedback
    }
    
    if action in ['approve', 'modify']:
        print("\n📝 Provide additional details (press Enter to skip):")
        
        root_cause = input("Root cause override: ").strip()
        if root_cause:
            human_input['root_cause_override'] = root_cause
            
        impact = input("Technical impact: ").strip()
        if impact:
            human_input['impact_override'] = impact
            
        business_impact = input("Business impact: ").strip()
        if business_impact:
            human_input['business_impact_override'] = business_impact
            
        recommendations = input("Recommendations: ").strip()
        if recommendations:
            human_input['recommendations_override'] = recommendations
    
    elif action == 'escalate':
        print("\n🚨 Escalation details:")
        escalation_reason = input("Escalation reason (optional): ").strip()
        if escalation_reason:
            human_input['escalation_reason'] = escalation_reason
    
    return human_input