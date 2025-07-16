import React from 'react';
import { Check, Clock, User, AlertTriangle } from 'lucide-react';

const WorkflowProgress = ({ incident }) => {
  const steps = [
    { key: 'get_table_context', label: 'Table Context', icon: Check },
    { key: 'get_related_logs', label: 'Related Logs', icon: Check },
    { key: 'call_llm_analysis', label: 'LLM Analysis', icon: Check },
    { key: 'human_review_node', label: 'Human Review', icon: User },
    { key: 'generate_final_report', label: 'Final Report', icon: Check }
  ];

  const getStepStatus = (stepKey) => {
    if (incident.workflow_progress) {
      const stepProgress = incident.workflow_progress.find(p => p.step_name === stepKey);
      if (stepProgress) {
        return stepProgress.status;
      }
    }

    // Fallback logic based on incident status
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentStepIndex = steps.findIndex(s => s.key === incident.current_step);
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
      if (incident.status === 'waiting_for_human_review' && stepKey === 'human_review_node') {
        return 'waiting_for_input';
      }
      return 'running';
    }
    return 'pending';
  };

  const getStepIcon = (step, status) => {
    if (status === 'completed') {
      return <Check className="w-4 h-4 text-white" />;
    }
    if (status === 'waiting_for_input') {
      return <User className="w-4 h-4 text-white" />;
    }
    if (status === 'running') {
      return <div className="w-2 h-2 bg-white rounded-full animate-pulse" />;
    }
    if (status === 'failed') {
      return <AlertTriangle className="w-4 h-4 text-white" />;
    }
    return <Clock className="w-4 h-4 text-white" />;
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'waiting_for_input': return 'bg-orange-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Progress</h3>
      
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStepColor(status)} transition-all duration-300 ${
                  status === 'waiting_for_input' ? 'animate-pulse' : ''
                }`}>
                  {getStepIcon(step, status)}
                </div>
                <span className={`text-xs mt-2 text-center max-w-20 ${
                  status === 'waiting_for_input' ? 'text-orange-600 font-medium' :
                  status === 'completed' ? 'text-green-600' :
                  status === 'running' ? 'text-blue-600' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  getStepStatus(steps[index + 1].key) === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowProgress;