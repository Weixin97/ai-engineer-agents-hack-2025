// ===============================================
// 📄 Final Dashboard.jsx - Proper Layout + Button Styles
// ===============================================

import React, { useState } from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../Common/LoadingSpinner';
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  ChevronRight,
  RefreshCw,
  Database,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatTimestamp } from '../../utils/helpers';

const Dashboard = () => {
  const [filterStatus, setFilterStatus] = useState('All');
  const navigate = useNavigate();
  
  const { data: incidents = [], isLoading, error, refetch } = useIncidents();

  // Pure API data functions
  const getDisplayTitle = (incident) => {
    if (incident.title) return incident.title;
    if (incident.alert?.title) return incident.alert.title;
    if (incident.alert?.message) return incident.alert.message;
    
    const table = incident.alert?.table || 'System';
    const checkType = incident.alert?.check_type || 'Alert';
    const readable = checkType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return `${table} ${readable}`;
  };

  const getDisplayDescription = (incident) => {
    if (incident.description) return incident.description;
    if (incident.alert?.description) return incident.alert.description;
    if (incident.alert?.error_message) return incident.alert.error_message;
    
    const expected = incident.alert?.expected_value;
    const actual = incident.alert?.actual_value;
    
    if (expected && actual) {
      return `Expected: ${expected}, Got: ${actual}`;
    }
    if (actual) {
      return `Current value: ${actual}`;
    }
    
    return 'System incident detected';
  };

  const getDisplaySource = (incident) => {
    if (incident.source) return incident.source;
    if (incident.alert?.source_file) return incident.alert.source_file;
    if (incident.alert?.log_file) return incident.alert.log_file;
    
    const table = incident.alert?.table || 'system';
    const checkType = incident.alert?.check_type || 'alert';
    return `${table}_${checkType}.log`;
  };

  const getDisplayId = (incident) => {
    const baseId = incident.incident_id || incident.id || 'unknown';
    const shortId = baseId.split('=')[1]?.substring(0, 6) || 
                   baseId.split('-').pop()?.substring(0, 6) || 
                   baseId.substring(0, 6);
    
    return `INC-${new Date().getFullYear()}-${shortId}`;
  };

  const getDisplaySeverity = (incident) => {
    return incident.alert?.severity || 
           incident.alert?.priority || 
           incident.alert?.level || 
           incident.severity || 
           'MEDIUM';
  };

  const getSeverityEmoji = (incident) => {
    const severity = getDisplaySeverity(incident).toUpperCase();
    if (severity.includes('CRITICAL')) return '🔴';
    if (severity.includes('HIGH')) return '🟠';
    if (severity.includes('WARNING')) return '🟡';
    return '🔵';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'waiting_for_human_review') {
      return 'status-requires-action';
    }
    if (status === 'completed') {
      return 'status-completed';
    }
    if (status === 'running') {
      return 'status-processing';
    }
    if (status === 'error') {
      return 'status-error';
    }
    return 'status-processing';
  };

  const getStatusText = (status) => {
    if (status === 'waiting_for_human_review') return 'Requires Action';
    if (status === 'completed') return 'Completed';
    if (status === 'running') return 'Processing';
    if (status === 'error') return 'Error';
    return 'Active';
  };

  const filteredIncidents = filterStatus === 'All' ? incidents : 
    incidents.filter(inc => {
      if (filterStatus === 'Interrupted') return inc.status === 'waiting_for_human_review';
      if (filterStatus === 'Idle') return inc.status === 'completed';
      if (filterStatus === 'Busy') return inc.status === 'running';
      if (filterStatus === 'Error') return inc.status === 'error';
      return true;
    });

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <LoadingSpinner size="lg" />
          <p className="text-gray-600" style={{ marginTop: '1rem', fontSize: '1.125rem' }}>
            Loading AI Agent...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <div className="card" style={{ maxWidth: '28rem', margin: '0 auto', padding: '2rem' }}>
            <AlertTriangle className="h-16 w-16 text-red-500" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>
              Backend Connection Failed
            </h3>
            <p style={{ color: '#b91c1c', marginBottom: '1.5rem' }}>
              Start FastAPI: <code style={{ backgroundColor: '#fee2e2', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                uvicorn app.main:app --reload
              </code>
            </p>
            <button 
              onClick={() => refetch()}
              className="btn-primary"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="space-y-6">
        
        {/* Main Container */}
        <div className="card">
          
          {/* Filter Header */}
          <div style={{ 
            borderBottom: '1px solid #e5e7eb', 
            padding: '1rem 1.5rem', 
            backgroundColor: '#f9fafb' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { key: 'All', emoji: '📋' },
                { key: 'Interrupted', emoji: '⚠️' },
                { key: 'Idle', emoji: '⏸️' },
                { key: 'Busy', emoji: '🔄' },
                { key: 'Error', emoji: '❌' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterStatus(filter.key)}
                  className={`filter-btn ${filterStatus === filter.key ? 'active' : 'inactive'}`}
                >
                  <span style={{ fontSize: '1rem' }}>{filter.emoji}</span>
                  <span>{filter.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Incident List */}
          <div>
            {filteredIncidents.map((incident, index) => (
              <div 
                key={incident.incident_id}
                onClick={() => navigate(`/incidents/${incident.incident_id}`)}
                className="incident-card"
                style={{ 
                  padding: '1.25rem 1.5rem',
                  borderBottom: index < filteredIncidents.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  
                  {/* Left Content */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                    
                    {/* Status Emoji */}
                    <div style={{ flexShrink: 0, fontSize: '1.25rem' }}>
                      {getSeverityEmoji(incident)}
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      
                      {/* Title and ID */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ 
                          fontSize: '1rem', 
                          fontWeight: '600', 
                          color: '#111827',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {getDisplayTitle(incident)}
                        </h3>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: '#6b7280',
                          fontFamily: 'ui-monospace, monospace',
                          flexShrink: 0
                        }}>
                          #{getDisplayId(incident)}
                        </span>
                      </div>
                      
                      {/* Description */}
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: '#6b7280', 
                        margin: '0 0 0.75rem 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {getDisplayDescription(incident)}
                      </p>
                      
                      {/* Metadata */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileText className="h-3 w-3" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getDisplaySource(incident)}
                          </span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(incident.created_at)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Content */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                    <span className={`status-badge ${getStatusBadgeClass(incident.status)}`}>
                      {getStatusText(incident.status)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty State */}
          {filteredIncidents.length === 0 && (
            <div className="text-center" style={{ padding: '4rem 0' }}>
              <AlertTriangle className="w-16 h-16 text-gray-400" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', marginBottom: '0.5rem' }}>
                No incidents found
              </h3>
              <p style={{ color: '#6b7280' }}>
                Create incidents using the API to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;