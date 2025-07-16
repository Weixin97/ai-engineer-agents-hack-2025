import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, BarChart3, User } from 'lucide-react';
import { useIncident } from '../../hooks/useIncidents';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatTimestamp } from '../../utils/helpers';

const IncidentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: incident, isLoading, error } = useIncident(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading incident details...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">Incident not found</div>
        <p className="text-gray-600 mt-2">The incident may have been deleted or moved</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const getIncidentTitle = () => {
    const checkType = incident.alert?.check_type || 'unknown';
    const titles = {
      'report_readiness_check': 'Daily Transaction Report Failed',
      'data_recency_anomaly': 'Data Pipeline Delayed',  
      'cross_table_validation': 'Corrupted Payment Checksums',
      'memory_usage_alert': 'Memory Usage Alert'
    };
    return titles[checkType] || 'System Alert';
  };

  const getIncidentDescription = () => {
    const checkType = incident.alert?.check_type || 'unknown';
    const descriptions = {
      'report_readiness_check': 'Airflow DAG failed with NOT_READY status',
      'data_recency_anomaly': 'Data processing 4.5 hours behind schedule',
      'cross_table_validation': 'Data integrity issues in payment transactions', 
      'memory_usage_alert': 'Container memory utilization above threshold'
    };
    return descriptions[checkType] || 'System incident detected';
  };

  const getIncidentId = () => {
    const checkType = incident.alert?.check_type || 'unknown';
    const ids = {
      'report_readiness_check': '#INC-2025-001',
      'data_recency_anomaly': '#INC-2025-002',
      'cross_table_validation': '#INC-2025-003', 
      'memory_usage_alert': '#INC-2025-004'
    };
    return ids[checkType] || `#${incident.incident_id}`;
  };

  const getLogFile = () => {
    const checkType = incident.alert?.check_type || 'unknown';
    const files = {
      'report_readiness_check': 'airflow_logs_timeout.json',
      'data_recency_anomaly': 'dqc_logs_memory.json',
      'cross_table_validation': 'table_metadata_corruption.json',
      'memory_usage_alert': 'container_metrics.json'
    };
    return files[checkType] || 'system.log';
  };

  const getSeverityColor = () => {
    const severity = incident.alert?.severity;
    switch (severity) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'WARNING': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to incidents</span>
      </button>

      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{getIncidentTitle()}</h1>
            <p className="text-gray-600">{getIncidentDescription()}</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
            Requires Action
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{getLogFile()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTimestamp(incident.created_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-blue-600">{getIncidentId()}</span>
          </div>
        </div>
      </div>

      {/* Agent Processing */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Agent Processing</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">Context Gathering</h4>
                <p className="text-sm text-green-700">Analyzing logs and metadata</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-900">LLM Analysis</h4>
                <p className="text-sm text-green-700">Processing with Llama 3.2</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Confidence Assessment</h4>
                <p className="text-sm text-blue-700">Self-evaluation and scoring</p>
              </div>
            </div>
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Assessment */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Confidence Assessment</h3>
          <div className="text-2xl font-bold text-green-600">90/100</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
        </div>
      </div>

      {/* Evidence Found */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Evidence Found</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Database connection timeout errors in airflow logs</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Connection pool utilization at 100%</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Similar pattern identified in historical incident INC-2024-892</span>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">💡</span>
          </div>
          <h3 className="text-lg font-semibold text-blue-900">Recommended Actions</h3>
        </div>
        <p className="text-blue-800">
          Database connection pool exhausted. Restart merchant-db service and increase connection limits.
        </p>
      </div>

      {/* Human Review Required */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Human Review Required</h3>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Feedback (for MODIFY workflow):</p>
          <textarea 
            className="w-full p-3 border border-gray-300 rounded-lg" 
            rows="4" 
            placeholder="Agent missed memory issue - check OOM events..."
          />
        </div>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            ✓ Approve
          </button>
          <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
            🔄 Modify
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            👥 Escalate
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailPage;