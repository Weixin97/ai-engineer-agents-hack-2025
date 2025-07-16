export const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const getSeverityColor = (severity) => {
  const colors = {
    'HIGH': 'bg-red-100 text-red-800 border-red-200',
    'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'CRITICAL': 'bg-purple-100 text-purple-800 border-purple-200',
    'LOW': 'bg-green-100 text-green-800 border-green-200'
  };
  return colors[severity] || colors['MEDIUM'];
};

export const getStatusColor = (status) => {
  const colors = {
    'running': 'bg-blue-100 text-blue-800',
    'waiting_for_human_review': 'bg-orange-100 text-orange-800',
    'completed': 'bg-green-100 text-green-800',
    'escalated': 'bg-purple-100 text-purple-800',
    'error': 'bg-red-100 text-red-800'
  };
  return colors[status] || colors['running'];
};