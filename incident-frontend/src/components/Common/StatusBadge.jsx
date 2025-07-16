// ===============================================
import React from 'react';
import { getSeverityColor, getStatusColor } from '../../utils/helpers';

export const SeverityBadge = ({ severity }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getSeverityColor(severity)}`}>
      {severity}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const displayStatus = status.replace(/_/g, ' ').toUpperCase();
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusColor(status)}`}>
      {displayStatus}
    </span>
  );
};