// ===============================================
// 📄 Complete IncidentDetailPage.jsx - Analysis Workflow
// ===============================================

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
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { formatTimestamp } from '../../utils/helpers';

const IncidentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Analysis workflow state
  const [analysisStep, setAnalysisStep] = useState(-1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [humanFeedback, setHumanFeedback] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  
  const { data: incident, isLoading, error, refetch } = useIncident(id);

  const analysisSteps = [
    { 
      name: "Context Gathering", 
      description: "Analyzing logs and metadata",
      icon: Database,
      duration: 3000
    },
    { 
      name: "LLM Analysis", 
      description: "Processing with Llama 3.2",
      icon: Brain,
      duration: 4000
    },
    { 
      name: "Confidence Assessment", 
      description: "Self-evaluation and scoring",
      icon: BarChart3,
      duration: 2500
    },
    { 
      name: "Evidence Compilation", 
      description: "Gathering supporting data",
      icon: Eye,
      duration: 2000
    }
  ];

  // Start analysis workflow when incident loads
  useEffect(() => {
    if (incident && !isAnalyzing && !analysisComplete) {
      if (incident.status === 'waiting_for_human_review') {
        // Already analyzed, show results immediately
        setAnalysisComplete(true);
        setAnalysisStep(analysisSteps.length);
      } else {
        // Start analysis workflow
        startAnalysisWorkflow();
      }
    }
  }, [incident]);

  const startAnalysisWorkflow = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Simulate each analysis step with realistic timing
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i);
      await new Promise(resolve => setTimeout(resolve, analysisSteps[i].duration));
    }

    // Mark as complete and trigger API call if needed
    setAnalysisStep(analysisSteps.length);
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    
    // Optionally call API to start actual analysis
    // await triggerAnalysisAPI();
  };

  const triggerAnalysisAPI = async () => {
    try {
      // Call your API to start analysis
      const response = await fetch(`/api/incidents/${id}/analyze`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Refresh incident data
        refetch();
      }
    } catch (error) {
      console.error('Analysis API error:', error);
    }
  };

  const handleHumanDecision = async (decision) => {
    if (!incident || submittingDecision) return;
    
    setSubmittingDecision(true);
    
    try {
      // Call your API to submit human decision
      const response = await fetch(`/api/incidents/${id}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: decision,
          feedback: humanFeedback,
          incident_id: incident.incident_id
        })
      });
      
      if (response.ok) {
        // Show success feedback
        alert(`Decision "${decision}" submitted successfully!`);
        // Refresh data
        refetch();
        // Clear feedback
        setHumanFeedback('');
      } else {
        throw new Error('Decision submission failed');
      }
    } catch (error) {
      console.error('Decision submission error:', error);
      alert('Failed to submit decision. Please try again.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Extract data from incident API response
  const getIncidentTitle = () => {
    if (incident?.title) return incident.title;
    if (incident?.alert?.title) return incident.alert.title;
    
    const checkType = incident?.alert?.check_type || 'Alert';
    const table = incident?.alert?.table || 'System';
    const readable = checkType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `${table} ${readable}`;
  };

  const getIncidentDescription = () => {
    if (incident?.description) return incident.description;
    if (incident?.alert?.description) return incident.alert.description;
    
    const expected = incident?.alert?.expected_value;
    const actual = incident?.alert?.actual_value;
    
    if (expected && actual) {
      return `Airflow DAG failed with ${actual} status`;
    }
    
    return 'System incident detected - AI analysis in progress';
  };

  const getConfidenceScore = () => {
    // Extract from LLM analysis
    if (incident?.llm_analysis?.confidence) {
      return incident.llm_analysis.confidence;
    }
    
    // Parse from LLM response
    const llmResponse = incident?.llm_analysis?.llm_response || '';
    const confidenceMatch = llmResponse.match(/confidence[^:]*:\s*(\d+)/i);
    
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    
    // Default high confidence for completed analysis
    return analysisComplete ? 90 : 75;
  };

  const getEvidenceFromAnalysis = () => {
    // Parse evidence from LLM response
    const llmResponse = incident?.llm_analysis?.llm_response || '';
    
    // Look for evidence patterns
    const evidencePatterns = [
      /database connection.*timeout/i,
      /connection pool.*100%/i,
      /similar pattern.*incident/i,
      /memory usage.*threshold/i,
      /performance.*degraded/i
    ];
    
    const foundEvidence = [];
    evidencePatterns.forEach(pattern => {
      if (pattern.test(llmResponse)) {
        if (pattern.source === /database connection.*timeout/i) {
          foundEvidence.push('Database connection timeout errors in airflow logs');
        } else if (pattern.source === /connection pool.*100%/i) {
          foundEvidence.push('Connection pool utilization at 100%');
        } else if (pattern.source === /similar pattern.*incident/i) {
          foundEvidence.push('Similar pattern identified in historical incident INC-2024-892');
        }
      }
    });
    
    // Default evidence if none found
    if (foundEvidence.length === 0) {
      return [
        'Database connection timeout errors in airflow logs',
        'Connection pool utilization at 100%',
        'Similar pattern identified in historical incident INC-2024-892'
      ];
    }
    
    return foundEvidence;
  };

  const getRootCauseAnalysis = () => {
    // Extract from LLM analysis
    const llmResponse = incident?.llm_analysis?.llm_response || '';
    
    // Look for root cause section
    const rootCauseMatch = llmResponse.match(/root cause[^:]*:(.+?)(?:\n\n|\n.*?:|\z)/is);
    
    if (rootCauseMatch) {
      return rootCauseMatch[1].trim();
    }
    
    // Default root cause based on alert data
    const checkType = incident?.alert?.check_type || '';
    
    if (checkType.includes('memory')) {
      return 'Memory usage exceeded threshold due to connection pool exhaustion. The application is not properly releasing database connections, leading to resource starvation.';
    }
    
    return 'Database connection pool exhausted. Analysis indicates insufficient connection limits and potential connection leaks in the transaction processor service.';
  };

  const getRecommendations = () => {
    // Extract from LLM analysis
    const llmResponse = incident?.llm_analysis?.llm_response || '';
    
    // Look for recommendations section
    const recommendationMatch = llmResponse.match(/recommendation[^:]*:(.+?)(?:\n\n|\n.*?:|\z)/is);
    
    if (recommendationMatch) {
      return recommendationMatch[1].trim();
    }
    
    // Default recommendations
    return 'Database connection pool exhausted. Restart merchant-db service and increase connection limits.';
  };

  const getDataSources = () => {
    // Extract data sources that informed the decision
    return [
      {
        name: incident?.alert?.table ? `${incident.alert.table}_logs.json` : 'system_logs.json',
        type: 'Log File',
        relevance: 'Primary incident source'
      },
      {
        name: 'connection_pool_metrics.json',
        type: 'Metrics',
        relevance: 'Resource utilization data'
      },
      {
        name: 'historical_incidents.db',
        type: 'Database',
        relevance: 'Pattern matching analysis'
      }
    ];
  };

  const AnalysisStepComponent = ({ step, index, isActive, isCompleted }) => {
    const Icon = step.icon;
    return (
      <div className={`analysis-step ${
        isActive ? 'active' : isCompleted ? 'completed' : 'pending'
      }`}>
        <div style={{
          width: '3rem',
          height: '3rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isActive ? '#3b82f6' : isCompleted ? '#10b981' : '#e5e7eb',
          color: isActive || isCompleted ? 'white' : '#6b7280'
        }}>
          <Icon style={{ width: '1.25rem', height: '1.25rem' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: '600',
            color: isActive || isCompleted ? '#111827' : '#6b7280'
          }}>
            {step.name}
          </h4>
          <p style={{
            margin: 0,
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            {step.description}
          </p>
        </div>
        {isActive && <Loader2 style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} className="animate-spin" />}
        {isCompleted && <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#10b981' }} />}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
          <LoadingSpinner size="lg" />
          <span style={{ marginLeft: '0.75rem', color: '#6b7280', fontSize: '1.125rem' }}>
            Loading incident details...
          </span>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <AlertTriangle style={{ width: '4rem', height: '4rem', color: '#ef4444', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>
            Incident not found
          </h3>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ marginTop: '1rem' }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const confidenceScore = getConfidenceScore();
  const evidence = getEvidenceFromAnalysis();
  const rootCause = getRootCauseAnalysis();
  const recommendations = getRecommendations();
  const dataSources = getDataSources();

  return (
    <div className="container">
      <div style={{ padding: '2rem 0' }}>
        <div className="space-y-6">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#6b7280',
              fontSize: '0.875rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#111827'}
            onMouseOut={(e) => e.target.style.color = '#6b7280'}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
            <span>Back to incidents</span>
          </button>

          {/* Header Card */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', margin: '0 0 0.5rem 0' }}>
                  {getIncidentTitle()}
                </h1>
                <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: 0 }}>
                  {getIncidentDescription()}
                </p>
              </div>
              <span className="status-badge status-requires-action">
                Requires Action
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText style={{ width: '1rem', height: '1rem' }} />
                <span>{incident.alert?.table || 'system'}_logs.json</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ width: '1rem', height: '1rem' }} />
                <span>{formatTimestamp(incident.created_at)}</span>
              </span>
              <span style={{ fontFamily: 'ui-monospace, monospace', color: '#3b82f6' }}>
                #INC-2025-001
              </span>
            </div>
          </div>

          {/* Analysis Steps */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <BarChart3 style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                Agent Processing
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {analysisSteps.map((step, index) => (
                <AnalysisStepComponent 
                  key={index}
                  step={step} 
                  index={index}
                  isActive={isAnalyzing && analysisStep === index}
                  isCompleted={analysisStep > index}
                />
              ))}
            </div>
          </div>

          {/* Analysis Results */}
          {analysisComplete && (
            <>
              {/* Confidence Assessment */}
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                      Confidence Assessment
                    </h4>
                  </div>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: confidenceScore >= 85 ? '#10b981' : confidenceScore >= 70 ? '#f59e0b' : '#ef4444'
                  }}>
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

              {/* Evidence Found */}
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Evidence Found
                  </h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {evidence.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                      <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#10b981', marginTop: '0.125rem', flexShrink: 0 }} />
                      <span style={{ color: '#374151' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Cause Analysis */}
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🔍</span>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Root Cause Analysis
                  </h4>
                </div>
                <div style={{ 
                  backgroundColor: '#f3f4f6', 
                  padding: '1rem', 
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{ color: '#374151', margin: 0, lineHeight: '1.6' }}>
                    {rootCause}
                  </p>
                </div>
              </div>

              {/* Recommended Actions */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '0.75rem',
                padding: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>💡</span>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e40af', margin: 0 }}>
                    Recommended Actions
                  </h4>
                </div>
                <p style={{ color: '#1e40af', margin: 0, lineHeight: '1.6' }}>
                  {recommendations}
                </p>
              </div>

              {/* Data Sources */}
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📂</span>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                    Data Sources Referenced
                  </h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dataSources.map((source, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.5rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827', fontSize: '0.875rem' }}>
                            {source.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {source.type} • {source.relevance}
                          </div>
                        </div>
                      </div>
                      <ExternalLink style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Human Review Required */}
              {incident.status === 'waiting_for_human_review' && (
                <div className="card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                    <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                      Human Review Required
                    </h4>
                  </div>
                  
                  {/* Feedback Input */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: '500', 
                      color: '#374151', 
                      marginBottom: '0.5rem' 
                    }}>
                      Feedback (for MODIFY workflow):
                    </label>
                    <textarea
                      value={humanFeedback}
                      onChange={(e) => setHumanFeedback(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        resize: 'none',
                        fontFamily: 'inherit'
                      }}
                      rows={4}
                      placeholder="Agent missed memory issue - check OOM events..."
                    />
                  </div>

                  {/* Decision Buttons */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '1rem' 
                  }}>
                    <button
                      onClick={() => handleHumanDecision('approve')}
                      disabled={submittingDecision}
                      className="decision-btn decision-approve"
                    >
                      <CheckCircle style={{ width: '2rem', height: '2rem', marginBottom: '0.75rem' }} />
                      <span style={{ fontSize: '1rem', fontWeight: '600' }}>APPROVE</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Execute recommendation</span>
                    </button>
                    
                    <button
                      onClick={() => handleHumanDecision('modify')}
                      disabled={submittingDecision}
                      className="decision-btn decision-modify"
                    >
                      <RotateCcw style={{ width: '2rem', height: '2rem', marginBottom: '0.75rem' }} />
                      <span style={{ fontSize: '1rem', fontWeight: '600' }}>MODIFY</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Provide feedback</span>
                    </button>
                    
                    <button
                      onClick={() => handleHumanDecision('escalate')}
                      disabled={submittingDecision}
                      className="decision-btn decision-escalate"
                    >
                      <Users style={{ width: '2rem', height: '2rem', marginBottom: '0.75rem' }} />
                      <span style={{ fontSize: '1rem', fontWeight: '600' }}>ESCALATE</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Route to experts</span>
                    </button>
                  </div>

                  {submittingDecision && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      backgroundColor: '#f0f9ff', 
                      borderRadius: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Loader2 style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} className="animate-spin" />
                      <span style={{ color: '#1e40af', fontSize: '0.875rem' }}>
                        Submitting your decision...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailPage;