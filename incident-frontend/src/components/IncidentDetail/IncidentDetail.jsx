import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncident } from '../../hooks/useIncidents';
import LoadingSpinner from '../Common/LoadingSpinner';
import { 
  ArrowLeft, 
  CheckCircle, 
  Brain, 
  Database, 
  BarChart3, 
  Eye,
  Loader2,
  Clock,
  FileText,
  AlertTriangle,
  Users,
  RotateCcw
} from 'lucide-react';
import { formatTimestamp } from '../../utils/helpers';

const IncidentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [humanFeedback, setHumanFeedback] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const { data: incident, isLoading, error } = useIncident(id);

  const analysisSteps = [
    { name: "Context Gathering", description: "Analyzing logs and metadata", icon: Database },
    { name: "LLM Analysis", description: "Processing with Llama 3.2", icon: Brain },
    { name: "Confidence Assessment", description: "Self-evaluation and scoring", icon: BarChart3 },
    { name: "Evidence Compilation", description: "Gathering supporting data", icon: Eye }
  ];

  useEffect(() => {
    if (incident) {
      if (incident.status === 'waiting_for_human_review') {
        // Already analyzed, show results
        setShowResults(true);
        setAnalysisStep(analysisSteps.length);
      } else if (incident.status === 'running') {
        // Start analysis simulation
        startAnalysis();
      }
    }
  }, [incident]);

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsAnalyzing(false);
    setShowResults(true);
    setAnalysisStep(analysisSteps.length);
  };

  // Pure API data functions
  const getIncidentTitle = () => {
    if (incident.title) return incident.title;
    if (incident.alert?.title) return incident.alert.title;
    
    const table = incident.alert?.table || 'System';
    const checkType = incident.alert?.check_type || 'Alert';
    const readable = checkType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `${table} ${readable}`;
  };

  const getIncidentDescription = () => {
    if (incident.description) return incident.description;
    if (incident.alert?.description) return incident.alert.description;
    
    const expected = incident.alert?.expected_value;
    const actual = incident.alert?.actual_value;
    
    if (expected && actual) {
      return `Expected: ${expected}, Got: ${actual}`;
    }
    
    return 'System incident detected - investigating...';
  };

  const getConfidenceScore = () => {
    // Extract from LLM analysis if available
    if (incident.llm_analysis?.confidence) {
      return incident.llm_analysis.confidence;
    }
    
    const llmResponse = incident.llm_analysis?.llm_response || '';
    const confidenceMatch = llmResponse.match(/confidence[^:]*:\s*(\d+)/i);
    
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    
    // Default based on status and data available
    if (incident.status === 'waiting_for_human_review') return 88;
    if (incident.llm_analysis) return 75;
    return 60;
  };

  const getEvidenceFromAPI = () => {
    // Extract evidence from LLM analysis if available
    if (incident.llm_analysis?.evidence) {
      return incident.llm_analysis.evidence;
    }
    
    // Parse from LLM response
    const llmResponse = incident.llm_analysis?.llm_response || '';
    const evidenceLines = llmResponse.split('\n').filter(line => 
      line.includes('evidence') || line.includes('found') || line.includes('detected')
    );
    
    if (evidenceLines.length > 0) {
      return evidenceLines.slice(0, 3);
    }
    
    // Generate based on actual API data
    const evidence = [];
    if (incident.alert?.actual_value) {
      evidence.push(`Alert threshold exceeded: ${incident.alert.actual_value}`);
    }
    if (incident.alert?.table) {
      evidence.push(`System anomaly detected in ${incident.alert.table}`);
    }
    if (incident.created_at) {
      evidence.push(`Incident occurred at ${formatTimestamp(incident.created_at)}`);
    }
    
    return evidence.length > 0 ? evidence : ['System monitoring detected anomaly'];
  };

  const getRecommendationFromAPI = () => {
    // Use recommendation from LLM analysis if available
    if (incident.llm_analysis?.recommendation) {
      return incident.llm_analysis.recommendation;
    }
    
    // Parse from LLM response
    const llmResponse = incident.llm_analysis?.llm_response || '';
    const recommendationMatch = llmResponse.match(/recommendation[^:]*:(.+?)(?:\n|$)/i);
    
    if (recommendationMatch) {
      return recommendationMatch[1].trim();
    }
    
    // Generate based on alert data
    const checkType = incident.alert?.check_type || '';
    const table = incident.alert?.table || 'system';
    
    if (checkType.includes('memory')) {
      return `Memory usage threshold exceeded. Scale ${table} resources and investigate memory leaks.`;
    }
    if (checkType.includes('readiness')) {
      return `Service readiness check failed. Restart ${table} service and verify dependencies.`;
    }
    
    return `System issue detected in ${table}. Review logs and metrics for resolution.`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600 text-lg">Loading incident details...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-900 mb-2">Incident not found</h3>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const confidenceScore = getConfidenceScore();
  const evidence = getEvidenceFromAPI();
  const recommendation = getRecommendationFromAPI();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Back Button */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to incidents</span>
          </button>

          {/* Analysis Panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{getIncidentTitle()}</h2>
                  <p className="text-gray-600 text-lg">{getIncidentDescription()}</p>
                </div>
                <span className="status-badge status-requires-action">
                  Requires Action
                </span>
              </div>
              <div className="flex items-center gap-8 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{incident.alert?.table || 'system'}_logs.json</span>
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatTimestamp(incident.created_at)}</span>
                </span>
                <span className="font-mono text-blue-600">
                  #INC-{new Date().getFullYear()}-{incident.incident_id.substring(0, 6)}
                </span>
              </div>
            </div>
            
            <div className="p-8">
              {/* Analysis Steps */}
              {isAnalyzing && (
                <div className="space-y-4 mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">🔄 Agent Processing</h4>
                  {analysisSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = analysisStep === index;
                    const isCompleted = analysisStep > index;
                    
                    return (
                      <div key={index} className={`analysis-step ${isActive ? 'active' : isCompleted ? 'completed' : 'pending'}`}>
                        <div className={`p-3 rounded-full ${
                          isActive ? 'bg-blue-500 text-white' :
                          isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{step.name}</p>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                        {isActive && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                        {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Analysis Results */}
              {showResults && (
                <div className="space-y-8">
                  
                  {/* Confidence Score */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        <span className="text-lg font-semibold text-gray-900">Confidence Assessment</span>
                      </div>
                      <span className={`text-2xl font-bold ${
                        confidenceScore >= 85 ? 'text-green-600' :
                        confidenceScore >= 70 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {confidenceScore}/100
                      </span>
                    </div>
                    <div className="confidence-bar">
                      <div 
                        className={`confidence-fill ${
                          confidenceScore >= 85 ? 'confidence-high' :
                          confidenceScore >= 70 ? 'confidence-medium' : 'confidence-low'
                        }`}
                        style={{ width: `${confidenceScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Evidence */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">📊</span>
                      <h4 className="text-lg font-semibold text-gray-900">Evidence Found</h4>
                    </div>
                    <ul className="space-y-3">
                      {evidence.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendation */}
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">💡</span>
                      <h4 className="text-lg font-semibold text-blue-900">Recommended Actions</h4>
                    </div>
                    <p className="text-blue-800">{recommendation}</p>
                  </div>

                  {/* Human Decision Panel */}
                  {incident.status === 'waiting_for_human_review' && (
                    <div className="border-t border-gray-200 pt-8">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-2xl">👤</span>
                        <h4 className="text-lg font-semibold text-gray-900">Human Review Required</h4>
                      </div>
                      
                      {/* Feedback Input */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Feedback (for MODIFY workflow):
                        </label>
                        <textarea
                          value={humanFeedback}
                          onChange={(e) => setHumanFeedback(e.target.value)}
                          className="w-full p-4 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={3}
                          placeholder="Agent missed memory issue - check OOM events..."
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <button className="decision-btn decision-approve">
                          <CheckCircle className="h-8 w-8 mb-3" />
                          <span className="text-base font-semibold">APPROVE</span>
                          <span className="text-xs mt-1">Execute recommendation</span>
                        </button>
                        
                        <button className="decision-btn decision-modify">
                          <RotateCcw className="h-8 w-8 mb-3" />
                          <span className="text-base font-semibold">MODIFY</span>
                          <span className="text-xs mt-1">Provide feedback</span>
                        </button>
                        
                        <button className="decision-btn decision-escalate">
                          <Users className="h-8 w-8 mb-3" />
                          <span className="text-base font-semibold">ESCALATE</span>
                          <span className="text-xs mt-1">Route to experts</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailPage;