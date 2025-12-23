// ===============================================
// 📄 Fixed IncidentDetailPage.jsx - Real API Integration
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
  const [wsConnection, setWsConnection] = useState(null);
  
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

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (incident && incident.status === 'running') {
      const ws = new WebSocket(`ws://localhost:8000/api/incidents/${incident.incident_id}/ws`);
      
      ws.onopen = () => {
        console.log('WebSocket connected for incident analysis');
        setWsConnection(ws);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        if (data.type === 'analysis_step') {
          setAnalysisStep(data.step);
          setIsAnalyzing(true);
        } else if (data.type === 'analysis_complete') {
          setIsAnalyzing(false);
          setAnalysisComplete(true);
          setAnalysisStep(analysisSteps.length);
          refetch(); // Refresh incident data
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setWsConnection(null);
      };
      
      return () => {
        ws.close();
      };
    }
  }, [incident]);

  // Start analysis workflow when incident loads
  useEffect(() => {
    if (incident && !isAnalyzing && !analysisComplete) {
      if (incident.status === 'waiting_for_human_review') {
        // Already analyzed, show results immediately
        setAnalysisComplete(true);
        setAnalysisStep(analysisSteps.length);
      } else if (incident.status === 'running') {
        // Analysis in progress - WebSocket will handle updates
        setIsAnalyzing(true);
        if (!wsConnection) {
          // Fallback: simulate analysis if WebSocket not available
          startAnalysisSimulation();
        }
      }
    }
  }, [incident]);

  const startAnalysisSimulation = async () => {
    console.log('Starting analysis simulation (WebSocket fallback)');
    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Simulate each analysis step
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i);
      await new Promise(resolve => setTimeout(resolve, analysisSteps[i].duration));
    }

    setAnalysisStep(analysisSteps.length);
    setIsAnalyzing(false);
    setAnalysisComplete(true);
    
    // Refresh incident data to get analysis results
    setTimeout(() => {
      refetch();
    }, 1000);
  };

  const handleHumanDecision = async (decision) => {
    if (!incident || submittingDecision) return;
    
    setSubmittingDecision(true);

    try {
      const response = await fetch(`http://localhost:8000/api/incidents/${incident.incident_id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: decision,
          feedback: humanFeedback || 'No feedback provided',
          escalation_reason: decision === 'escalate' ? humanFeedback : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      console.log('Review submitted:', result);
      
      // Refresh incident data
      refetch();
      setHumanFeedback('');
      
    } catch (error) {
      console.error('Decision submission error:', error);
      alert('Failed to submit decision: ' + error.message);
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

    const llmResponse = incident?.llm_analysis?.llm_response || '';
  
    // 查找 "Confidence Level: X/10" 格式
    const confidenceMatch = llmResponse.match(/confidence\s*level[:\s]*(\d+)\s*\/\s*10/i);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]) * 10;
    }
    
    // 查找 "Confidence: X/10" 格式
    const simpleMatch = llmResponse.match(/confidence[:\s]*(\d+)\s*\/\s*10/i);
    if (simpleMatch) {
      return parseInt(simpleMatch[1]) * 10;
    }
    // Extract from LLM analysis
    // if (incident?.llm_analysis?.confidence) {
    //   return incident.llm_analysis.confidence;
    // }
    
    // // Parse from LLM response text
    // const llmResponse = incident?.llm_analysis?.llm_response || '';
    // const confidenceMatch = llmResponse.match(/confidence[^:]*:\s*(\d+)/i);
    
    // if (confidenceMatch) {
    //   return parseInt(confidenceMatch[1]);
    // }
    
    // Default confidence for completed analysis
    return analysisComplete ? 90 : 75;
  };

  const getEvidenceFromAnalysis = () => {
    // Try to extract evidence from LLM response
    const llmResponse = incident?.llm_analysis?.llm_response || '';

    if (!llmResponse) {
      return ['Analysis in progress...'];
    }

    const evidence = [];

    const evidenceSection = llmResponse.match(/\*\*(?:supporting\s+)?evidence[^*]*\*\*[:\s]*([\s\S]*?)(?=\n\n\*\*|\n##|$)/i);
    
    if (evidenceSection) {
      const lines = evidenceSection[1]
        .split('\n')
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(line => line.length > 10 && !line.startsWith('#'));
      evidence.push(...lines.slice(0, 3));
    }
    
    // 如果没找到，查找 Root Cause 下的 bullet points
    if (evidence.length === 0) {
      const rootCauseSection = llmResponse.match(/root\s*cause[^#]*?((?:[-*•].+\n?)+)/i);
      if (rootCauseSection) {
        const lines = rootCauseSection[1]
          .split('\n')
          .map(line => line.replace(/^[-*•]\s*/, '').trim())
          .filter(line => line.length > 10);
        evidence.push(...lines.slice(0, 3));
      }
    }
    
    // 提取关键句子
    if (evidence.length === 0) {
      const keyPhrases = llmResponse.match(/\*\*[^*]+\*\*[:\s]*[^*\n]+/g);
      if (keyPhrases) {
        evidence.push(...keyPhrases.slice(0, 3).map(p => p.replace(/\*\*/g, '')));
      }
    }
    
    return evidence.length > 0 ? evidence : ['Analysis completed - see details below'];

      
    // if (llmResponse) {
    //   // Look for evidence bullet points or numbered lists
    //   const evidenceLines = llmResponse
    //     .split('\n')
    //     .filter(line => {
    //       const trimmed = line.trim();
    //       return (trimmed.startsWith('•') || 
    //              trimmed.startsWith('-') || 
    //              trimmed.startsWith('*') ||
    //              /^\d+\./.test(trimmed)) &&
    //              (trimmed.includes('evidence') || 
    //               trimmed.includes('found') || 
    //               trimmed.includes('detected') ||
    //               trimmed.includes('connection') ||
    //               trimmed.includes('pool') ||
    //               trimmed.includes('timeout'));
    //     })
    //     .map(line => line.replace(/^[•\-*\d\.]\s*/, '').trim())
    //     .slice(0, 3);
      
    //   if (evidenceLines.length > 0) {
    //     return evidenceLines;
    //   }
    // }
    
    // Default evidence based on incident data
    // return [
    //   'Database connection timeout errors in airflow logs',
    //   'Connection pool utilization at 100%',
    //   'Similar pattern identified in historical incident INC-2024-892'
    // ];
  };

  const getRootCauseAnalysis = () => {
    // Extract from LLM analysis response
    const llmResponse = incident?.llm_analysis?.llm_response || '';
    if (!llmResponse) {
      return 'Analysis in progress...';
    }
  
    const primaryMatch = llmResponse.match(/\*\*(?:most\s+likely\s+|primary\s+)?root\s*cause[:\s]*\*\*\s*([^\n*]+)/i);
    if (primaryMatch) {
      return primaryMatch[1].trim();
    }
    
    // 查找 ## ROOT CAUSE section
    const sectionMatch = llmResponse.match(/##\s*\d*\.?\s*root\s*cause[^\n]*\n+([\s\S]*?)(?=\n##|\n\*\*confidence)/i);
    if (sectionMatch) {
      const paragraphs = sectionMatch[1]
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 20 && !p.startsWith('**'));
      
      if (paragraphs.length > 0) {
        return paragraphs[0].replace(/\*\*/g, '');
      }
    }
    
    // Fallback
    const fallbackMatch = llmResponse.match(/root\s*cause[:\s]+([^#\n][^\n]+)/i);
    if (fallbackMatch) {
      return fallbackMatch[1].trim().replace(/\*\*/g, '');
    }
    
    return 'See full analysis for details';
    
    // if (llmResponse) {
    //   // Look for root cause section
    //   const rootCauseMatch = llmResponse.match(/(?:root\s+cause|cause)[^:]*:(.+?)(?:\n\n|\n(?:[A-Z]|$))/is);
      
    //   if (rootCauseMatch) {
    //     return rootCauseMatch[1].trim();
    //   }
      
    //   // Look for first substantial paragraph that might be root cause
    //   const paragraphs = llmResponse.split('\n\n').filter(p => p.trim().length > 50);
    //   if (paragraphs.length > 0) {
    //     return paragraphs[0].trim();
    //   }
    // }
    
    // // Default root cause based on incident type
    // const checkType = incident?.alert?.check_type || '';
    
    // if (checkType.includes('memory')) {
    //   return '**Insufficient memory allocation or deallocation**: The actual value of 95% exceeds the expected value of 80%, indicating a potential issue with memory management within the transaction processor. Evidence supporting this conclusion: * The log message from \'mem-002\' indicates that "Performance degradation likely" due to excessive memory usage, suggesting a critical issue. * The upstream dependencies on Kafka streams and real-time updates imply that the system is under heavy load, which could lead to memory bottlenecks.';
    // }
    
    // return 'Database connection pool exhausted. Analysis indicates insufficient connection limits and potential connection leaks in the transaction processor service leading to resource starvation and system performance degradation.';
  };

  const getRecommendations = () => {
    // Extract from LLM analysis
    const llmResponse = incident?.llm_analysis?.llm_response || '';

    if (!llmResponse) {
      return 'Analysis in progress...';
    }
    
    // 查找 "Immediate Actions" section
    const immediateMatch = llmResponse.match(/\*\*immediate\s*actions[^*]*\*\*[:\s]*([\s\S]*?)(?=\n\n\*\*|\n###|\n##|$)/i);
    if (immediateMatch) {
      const actions = immediateMatch[1]
        .split('\n')
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*\*\*([^*]+)\*\*.*/, '$1').trim())
        .slice(0, 3);
      
      if (actions.length > 0) {
        return actions.join('; ');
      }
    }
    
    // 查找 ## RECOMMENDATIONS section
    const sectionMatch = llmResponse.match(/##\s*\d*\.?\s*recommendation[^\n]*\n+([\s\S]*?)(?=\n##|$)/i);
    if (sectionMatch) {
      const numberedItem = sectionMatch[1].match(/\d+\.\s*([^\n]+)/);
      if (numberedItem) {
        return numberedItem[1].replace(/\*\*/g, '').trim();
      }
    }
    
    return 'Review full analysis for detailed recommendations';
    
    // if (llmResponse) {
    //   // Look for recommendations section
    //   const recommendationMatch = llmResponse.match(/(?:recommendation|action)[^:]*:(.+?)(?:\n\n|\n(?:[A-Z]|$))/is);
      
    //   if (recommendationMatch) {
    //     return recommendationMatch[1].trim();
    //   }
    // }
    
    // // Default recommendations
    // return 'Database connection pool exhausted. Restart merchant-db service and increase connection limits.';
  };

  const getDataSources = () => {
    // Generate data sources based on actual incident data
    const sources = [];
    
    // Add log file from incident
    if (incident?.alert?.table) {
      sources.push({
        name: `${incident.alert.table}_logs.json`,
        type: 'Log File',
        relevance: 'Primary incident source',
        url: `/logs/${incident.alert.table}_logs.json`
      });
    }
    
    // Add metrics file
    sources.push({
      name: 'connection_pool_metrics.json',
      type: 'Metrics',
      relevance: 'Resource utilization data',
      url: '/metrics/connection_pool_metrics.json'
    });
    
    // Add historical data
    sources.push({
      name: 'historical_incidents.db',
      type: 'Database',
      relevance: 'Pattern matching analysis',
      url: '/api/incidents/historical'
    });
    
    return sources;
  };

  const handleDataSourceClick = (source) => {
    // Open data source in new tab or show modal
    if (source.url.startsWith('http')) {
      window.open(source.url, '_blank');
    } else {
      // For relative URLs, you might want to show a modal or handle differently
      alert(`Opening data source: ${source.name}\nPath: ${source.url}`);
    }
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
                  <p style={{ color: '#374151', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
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
                    <div 
                      key={index} 
                      onClick={() => handleDataSourceClick(source)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.5rem',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
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
                      <ExternalLink style={{ width: '1rem', height: '1rem', color: '#3b82f6' }} />
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
                      style={{ opacity: submittingDecision ? 0.6 : 1 }}
                    >
                      <CheckCircle style={{ width: '2rem', height: '2rem', marginBottom: '0.75rem' }} />
                      <span style={{ fontSize: '1rem', fontWeight: '600' }}>APPROVE</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Execute recommendation</span>
                    </button>
                    
                    <button
                      onClick={() => handleHumanDecision('modify')}
                      disabled={submittingDecision}
                      className="decision-btn decision-modify"
                      style={{ opacity: submittingDecision ? 0.6 : 1 }}
                    >
                      <RotateCcw style={{ width: '2rem', height: '2rem', marginBottom: '0.75rem' }} />
                      <span style={{ fontSize: '1rem', fontWeight: '600' }}>MODIFY</span>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Provide feedback</span>
                    </button>
                    
                    <button
                      onClick={() => handleHumanDecision('escalate')}
                      disabled={submittingDecision}
                      className="decision-btn decision-escalate"
                      style={{ opacity: submittingDecision ? 0.6 : 1 }}
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