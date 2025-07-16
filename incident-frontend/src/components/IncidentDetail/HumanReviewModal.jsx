
import React, { useState } from 'react';
import { X, Check, Edit, AlertTriangle } from 'lucide-react';
import { useSubmitReview } from '../../hooks/useIncidents';

const HumanReviewModal = ({ isOpen, onClose, incident }) => {
  const [reviewData, setReviewData] = useState({
    action: '',
    feedback: '',
    root_cause_override: '',
    impact_override: '',
    business_impact_override: '',
    recommendations_override: '',
    escalation_reason: ''
  });

  // Mock submit for now since we disabled the POST functionality
  const submitReview = async (data) => {
    console.log('Would submit review:', data);
    alert(`Review submitted: ${data.action}`);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewData.action || !reviewData.feedback) {
      alert('Please select an action and provide feedback');
      return;
    }
    await submitReview(reviewData);
  };

  const setAction = (action) => {
    setReviewData(prev => ({ ...prev, action }));
  };

  const handleInputChange = (field, value) => {
    setReviewData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const actions = [
    {
      key: 'approve',
      label: 'Approve',
      description: 'Analysis looks good, proceed with recommendations',
      icon: Check,
      color: 'border-green-300 bg-green-50 text-green-800'
    },
    {
      key: 'modify',
      label: 'Modify',
      description: 'Analysis needs changes or corrections',
      icon: Edit,
      color: 'border-blue-300 bg-blue-50 text-blue-800'
    },
    {
      key: 'escalate',
      label: 'Escalate',
      description: 'Send to senior engineers for expert review',
      icon: AlertTriangle,
      color: 'border-red-300 bg-red-50 text-red-800'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-900">Human Review Required</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Action Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Action</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {actions.map(action => {
                const Icon = action.icon;
                const isSelected = reviewData.action === action.key;
                
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => setAction(action.key)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? `${action.color} border-opacity-100 transform scale-105`
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-gray-500'}`} />
                      <span className={`font-medium ${isSelected ? '' : 'text-gray-900'}`}>
                        {action.label}
                      </span>
                    </div>
                    <p className={`text-sm ${isSelected ? '' : 'text-gray-600'}`}>
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback *
            </label>
            <textarea
              value={reviewData.feedback}
              onChange={(e) => handleInputChange('feedback', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Explain your decision and provide any additional context..."
              required
            />
          </div>

          {/* Additional fields for modify action */}
          {reviewData.action === 'modify' && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">Provide Corrections</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Root Cause Override
                </label>
                <input
                  type="text"
                  value={reviewData.root_cause_override}
                  onChange={(e) => handleInputChange('root_cause_override', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Correct root cause analysis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations Override
                </label>
                <textarea
                  value={reviewData.recommendations_override}
                  onChange={(e) => handleInputChange('recommendations_override', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Updated recommendations..."
                />
              </div>
            </div>
          )}

          {/* Escalation reason for escalate action */}
          {reviewData.action === 'escalate' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Reason *
              </label>
              <input
                type="text"
                value={reviewData.escalation_reason}
                onChange={(e) => handleInputChange('escalation_reason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Why does this need expert attention?"
                required={reviewData.action === 'escalate'}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!reviewData.action || !reviewData.feedback}
            >
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HumanReviewModal;