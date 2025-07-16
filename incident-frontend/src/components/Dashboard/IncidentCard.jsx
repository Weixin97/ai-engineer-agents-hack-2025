import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Clock } from 'lucide-react';
import { formatTimestamp } from '../../utils/helpers';

const IncidentCard = ({ incident }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/incidents/${incident.incident_id}`);
  };

  // Completely dynamic title generation
  const getIncidentTitle = () => {
    // Check if incident has a custom title field
    if (incident.title) {
      return incident.title;
    }
    
    // Check if alert has a custom title or message
    if (incident.alert?.title) {
      return incident.alert.title;
    }
    
    if (incident.alert?.message) {
      return incident.alert.message;
    }
    
    // Generate title from available data
    const table = incident.alert?.table || 'System';
    const checkType = incident.alert?.check_type || 'unknown_check';
    
    // Convert check_type to readable format
    const readableCheckType = checkType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    // If we have both table and check type, combine them
    if (table && checkType) {
      return `${table} ${readableCheckType}`;
    }
    
    // Fallback to just the readable check type
    return readableCheckType || 'System Alert';
  };

  const getIncidentDescription = () => {
    // Use custom description if available
    if (incident.description) {
      return incident.description;
    }
    
    if (incident.alert?.description) {
      return incident.alert.description;
    }
    
    // If we have expected and actual values, show them
    const alert = incident.alert;
    if (alert?.expected_value && alert?.actual_value) {
      return `Expected: ${alert.expected_value}, Got: ${alert.actual_value}`;
    }
    
    // If we have just actual value, show it
    if (alert?.actual_value) {
      return `Current value: ${alert.actual_value}`;
    }
    
    // If we have an error message or details
    if (alert?.error_message) {
      return alert.error_message;
    }
    
    if (alert?.details) {
      return alert.details;
    }
    
    // Very generic fallback
    return 'System incident detected - please review';
  };

  const getLogFileName = () => {
    // Use custom log file if specified
    if (incident.log_file) {
      return incident.log_file;
    }
    
    if (incident.alert?.log_file) {
      return incident.alert.log_file;
    }
    
    if (incident.alert?.source_file) {
      return incident.alert.source_file;
    }
    
    // Generate from available data
    const table = incident.alert?.table || 'system';
    const checkType = incident.alert?.check_type || 'alert';
    
    // Create a reasonable log filename
    const cleanTable = table.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanCheckType = checkType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    return `${cleanTable}_${cleanCheckType}.log`;
  };

  // const getSeverityFromAlert = () => {
  //   // Use API severity directly if available
  //   if (incident.alert?.severity) {
  //     return incident.alert.severity.toUpperCase();
  //   }
    
  //   // Check for priority field
  //   if (incident.alert?.priority) {
  //     return incident.alert.priority.toUpperCase();
  //   }
    
  //   // Check for level field
  //   if (incident.alert?.level) {
  //     return incident.alert.level.toUpperCase();
  //   }
    
  //   // Check incident-level severity
  //   if (incident.severity) {
  //     return incident.severity.toUpperCase();
  //   }
    
  //   // Very basic fallback - could analyze values to determine severity
  //   const actual = incident.alert?.actual_value;
  //   const expected = incident.alert?.expected_value;
    
  //   if (actual && expected) {
  //     // Simple heuristic: if actual is very different from expected, it's likely high severity
  //     if (typeof actual === 'number' && typeof expected === 'number') {
  //       const diff = Math.abs(actual - expected) / expected;
  //       if (diff > 0.5) return 'HIGH';
  //       if (diff > 0.2) return 'MEDIUM';
  //       return 'LOW';
  //     }
  //   }
    
  //   // Default fallback
  //   return 'MEDIUM';
  // };

  // const getIncidentDescription = () => {
  //   // Use custom description if available
  //   if (incident.description) {
  //     return incident.description;
  //   }
    
  //   if (incident.alert?.description) {
  //     return incident.alert.description;
  //   }
    
  //   // If we have expected and actual values, show them
  //   const alert = incident.alert;
  //   if (alert?.expected_value && alert?.actual_value) {
  //     return `Expected: ${alert.expected_value}, Got: ${alert.actual_value}`;
  //   }
    
  //   // If we have just actual value, show it
  //   if (alert?.actual_value) {
  //     return `Current value: ${alert.actual_value}`;
  //   }
    
  //   // If we have an error message or details
  //   if (alert?.error_message) {
  //     return alert.error_message;
  //   }
    
  //   if (alert?.details) {
  //     return alert.details;
  //   }
    
  //   // Very generic fallback
  //   return 'System incident detected - please review';
  // };

  // const getLogFileName = () => {
  //   // Use custom log file if specified
  //   if (incident.log_file) {
  //     return incident.log_file;
  //   }
    
  //   if (incident.alert?.log_file) {
  //     return incident.alert.log_file;
  //   }
    
  //   if (incident.alert?.source_file) {
  //     return incident.alert.source_file;
  //   }
    
  //   // Generate from available data
  //   const table = incident.alert?.table || 'system';
  //   const checkType = incident.alert?.check_type || 'alert';
    
  //   // Create a reasonable log filename
  //   const cleanTable = table.toLowerCase().replace(/[^a-z0-9]/g, '_');
  //   const cleanCheckType = checkType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
  //   return `${cleanTable}_${cleanCheckType}.log`;
  // };

  const getIncidentId = () => {
    // Use actual incident ID or generate a formatted one
    const shortId = incident.incident_id.split('=')[1]?.substring(0, 8) || 
                   incident.incident_id.split('-').pop()?.substring(0, 8) || 
                   'unknown';
    
    return `#INC-${new Date().getFullYear()}-${shortId}`;
  };

  const getSeverityFromAlert = () => {
    // Use API severity directly if available
    if (incident.alert?.severity) {
      return incident.alert.severity.toUpperCase();
    }
    
    // Check for priority field
    if (incident.alert?.priority) {
      return incident.alert.priority.toUpperCase();
    }
    
    // Check for level field
    if (incident.alert?.level) {
      return incident.alert.level.toUpperCase();
    }
    
    // Check incident-level severity
    if (incident.severity) {
      return incident.severity.toUpperCase();
    }
    
    // Very basic fallback - could analyze values to determine severity
    const actual = incident.alert?.actual_value;
    const expected = incident.alert?.expected_value;
    
    if (actual && expected) {
      // Simple heuristic: if actual is very different from expected, it's likely high severity
      if (typeof actual === 'number' && typeof expected === 'number') {
        const diff = Math.abs(actual - expected) / expected;
        if (diff > 0.5) return 'HIGH';
        if (diff > 0.2) return 'MEDIUM';
        return 'LOW';
      }
    }
    
    // Default fallback
    return 'MEDIUM';
  };

  const getDotColor = () => {
    const severity = getSeverityFromAlert();
    const colors = {
      'CRITICAL': 'bg-red-500',
      'HIGH': 'bg-red-500',
      'MEDIUM': 'bg-yellow-500',
      'LOW': 'bg-green-500',
      'WARNING': 'bg-yellow-500'
    };
    return colors[severity] || 'bg-gray-500';
  };

  const getSeverityBadge = () => {
    const severity = getSeverityFromAlert();
    const badges = {
      'CRITICAL': 'bg-red-100 text-red-800 border-red-200',
      'HIGH': 'bg-red-100 text-red-800 border-red-200',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'LOW': 'bg-green-100 text-green-800 border-green-200',
      'WARNING': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return badges[severity] || badges['MEDIUM'];
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-3 h-3 rounded-full mt-2 ${getDotColor()}`}></div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
              {getIncidentTitle()}
            </h3>
            <p className="text-gray-600 text-sm mb-3">{getIncidentDescription()}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>{getLogFileName()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(incident.created_at)}</span>
              </div>
              <span className="text-blue-600 font-medium">{getIncidentId()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityBadge()}`}>
            {getSeverityFromAlert()}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;