def invoke_agent(app, alert, thread_id):
    initial_state = {
        "alert": alert,
        "table_context": {},
        "related_logs": [],
        "llm_analysis": {},
        "human_review": {},
        "final_recommendation": {}
    }
    print("\n🔄 Running agent analysis...")
    config = {"configurable": {"thread_id": thread_id}}
    paused_state = app.invoke(initial_state,config)

    if 'llm_analysis' in paused_state and paused_state['llm_analysis'].get('llm_response'):
        print("\n📊 LLM ANALYSIS COMPLETE")
        analysis = paused_state['llm_analysis']['llm_response']
        # Show just key points for demo
        if len(analysis) > 300:
            # print("Key findings:")
            # print(analysis[:300] + "...")
            # Extract and show key sections
            sections = analysis.split('**')
            for i, section in enumerate(sections):
                if 'ROOT CAUSE ANALYSIS' in section:
                    print("🎯 ROOT CAUSE ANALYSIS:")
                    print(sections[i+1][:200] + "...")
                elif 'RECOMMENDATIONS' in section:
                    print("\n💡 RECOMMENDATIONS:")
                    print(sections[i+1][:150] + "...")
                elif 'CONFIDENCE' in section.upper():
                    print(f"\n📈 {section}")
        else:
            print(analysis)
        
    return paused_state

def debug_tracing(app, thread_id):
    # tracing
    config = {"configurable": {"thread_id": thread_id}}
    state = app.get_state(config)
    print(f"Memory state for {thread_id}:")
    print(f"  Next nodes: {state.next}")
    print(f"Current values keys: {list(state.values.keys()) if state.values else 'None'}")

def handle_workflow_with_interrupts(app, thread_id, initial_human_feedback):
    config = {"configurable": {"thread_id": thread_id}}
    app.update_state(config, {"human_review": initial_human_feedback})
    
    while True:
        final_result = None
        for step in app.stream(None, config):
            node_name = list(step.keys())[0]
            print(f"🔄 Executing: {node_name}")
            
            if node_name == "__interrupt__":
                # Show revised analysis and get feedback
                current_state = app.get_state(config)
                if current_state.values.get('llm_analysis', {}).get('llm_response'):
                    print("🛑 REVISED ANALYSIS READY FOR REVIEW:")
                    print(current_state.values['llm_analysis']['llm_response'])
                
                next_feedback = get_cli_input_auto()
                app.update_state(config, {"human_review": next_feedback})
                
                if next_feedback['action'] != 'modify':
                    # If not modify, continue to completion
                    break
                # If modify again, continue the loop
            else:
                final_result = step[node_name]
        
        # If we exit the inner loop and it wasn't due to another modify, we're done
        if node_name != "__interrupt__":
            break
    
    return final_result


    
