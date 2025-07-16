import React from 'react';
import { List, AlertTriangle, Activity, CheckCircle, XCircle, Clock, User } from 'lucide-react';

const StatusFilter = ({ selectedStatus, onStatusChange, incidents }) => {
  const getStatusCount = (status) => {
    if (status === 'all') return incidents.length;
    return incidents.filter(incident => incident.status === status).length;
  };

  const filters = [
    { 
      key: 'all', 
      label: 'All Incidents', 
      icon: List, 
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      selectedColor: 'bg-gray-100 border-gray-300 text-gray-800'
    },
    { 
      key: 'waiting_for_human_review', 
      label: 'Needs Review', 
      icon: User, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      selectedColor: 'bg-orange-100 border-orange-300 text-orange-800'
    },
    { 
      key: 'running', 
      label: 'Active', 
      icon: Activity, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-300 text-green-800'
    },
    { 
      key: 'escalated', 
      label: 'Escalated', 
      icon: AlertTriangle, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      selectedColor: 'bg-purple-100 border-purple-300 text-purple-800'
    },
    { 
      key: 'error', 
      label: 'Error', 
      icon: XCircle, 
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      selectedColor: 'bg-red-100 border-red-300 text-red-800'
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {filters.map(filter => {
        const Icon = filter.icon;
        const count = getStatusCount(filter.key);
        const isSelected = selectedStatus === filter.key;
        
        return (
          <button
            key={filter.key}
            onClick={() => onStatusChange(filter.key)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
              isSelected 
                ? `${filter.selectedColor} border-opacity-100 shadow-sm` 
                : `bg-white border-gray-200 hover:border-gray-300 text-gray-700 ${filter.bgColor}`
            }`}
          >
            <Icon className={`w-5 h-5 ${isSelected ? '' : filter.color}`} />
            <span className="text-sm">{filter.label}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-bold min-w-[24px] text-center ${
              isSelected 
                ? 'bg-white bg-opacity-60' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default StatusFilter;