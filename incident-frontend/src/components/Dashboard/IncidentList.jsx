import React from 'react';
import IncidentCard from './IncidentCard';
import { AlertTriangle } from 'lucide-react';

const IncidentList = ({ incidents }) => {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 text-lg font-medium">No incidents found</div>
        <p className="text-gray-400 mt-2">Create incidents using the API to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map(incident => (
        <IncidentCard key={incident.incident_id} incident={incident} />
      ))}
    </div>
  );
};

export default IncidentList;