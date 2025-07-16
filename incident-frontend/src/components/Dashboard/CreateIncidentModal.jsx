import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

const CreateIncidentModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    severity: 'CRITICAL',
    check_type: 'report_readiness_check',
    table: 'daily_transaction_report',
    time_period: "2025-07-16T15:00:00",
    expected_value: 'READY',
    actual_value: 'NOT_READY'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const predefinedScenarios = [
    {
      name: 'Transaction Report Failed',
      data: {
        severity: 'CRITICAL',
        check_type: 'report_readiness_check',
        table: 'daily_transaction_report',
        expected_value: 'READY',
        actual_value: 'NOT_READY'
      }
    },
    {
      name: 'Data Pipeline Delayed',
      data: {
        severity: 'WARNING',
        check_type: 'data_recency_anomaly',
        table: 'daily_summary_report',
        expected_value: '0',
        actual_value: '4.5'
      }
    },
    {
      name: 'Data Integrity Issues',
      data: {
        severity: 'CRITICAL',
        check_type: 'cross_table_validation',
        table: 'user_payment_summary',
        expected_value: 'CONSISTENT',
        actual_value: 'INCONSISTENT'
      }
    }
  ];

  const loadScenario = (scenario) => {
    setFormData(prev => ({
      ...prev,
      ...scenario.data,
      time_period: new Date().toISOString()
    }));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Create New Incident
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Scenarios */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Scenarios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {predefinedScenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => loadScenario(scenario)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{scenario.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{scenario.data.table}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => handleChange('severity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check Type
                </label>
                <select
                  value={formData.check_type}
                  onChange={(e) => handleChange('check_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="report_readiness_check">Report Readiness Check</option>
                  <option value="data_recency_anomaly">Data Recency Anomaly</option>
                  <option value="cross_table_validation">Cross Table Validation</option>
                  <option value="memory_usage_alert">Memory Usage Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Name
              </label>
              <input
                type="text"
                value={formData.table}
                onChange={(e) => handleChange('table', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., daily_transaction_report"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Value
                </label>
                <input
                  type="text"
                  value={formData.expected_value}
                  onChange={(e) => handleChange('expected_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Value
                </label>
                <input
                  type="text"
                  value={formData.actual_value}
                  onChange={(e) => handleChange('actual_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary inline-flex items-center space-x-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Incident</span>
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CreateIncidentModal;