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
            print("Key findings:")
            print(analysis[:300] + "...")
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

    
