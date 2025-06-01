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