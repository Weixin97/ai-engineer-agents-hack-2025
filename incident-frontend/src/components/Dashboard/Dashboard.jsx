import React, { useState } from 'react';
import { useIncidents } from '../../hooks/useIncidents';
import IncidentList from './IncidentList';
import StatusFilter from './StatusFilter';
import LoadingSpinner from '../Common/LoadingSpinner';
import { RefreshCw, TrendingUp, AlertTriangle, Square, Activity, XCircle } from 'lucide-react';

const Dashboard = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  const { data: incidents = [], isLoading, error, refetch } = useIncidents();

  const filteredIncidents = incidents.filter(incident => {
    if (selectedStatus === 'all') return true;
    return incident.status === selectedStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-lg text-gray-600">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load incidents</h3>
          <p className="text-red-700 mb-4">Please check if the API server is running</p>
          <button 
            onClick={() => refetch()}
            className="btn-primary"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="flex gap-2">
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>All</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Interrupted</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
          <Square className="w-4 h-4" />
          <span>Idle</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm">
          <Activity className="w-4 h-4" />
          <span>Busy</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm">
          <XCircle className="w-4 h-4" />
          <span>Error</span>
        </button>
      </div>

      {/* Incident List */}
      <IncidentList incidents={filteredIncidents} />
    </div>
  );
};

export default Dashboard;