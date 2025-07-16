import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Target, Lightbulb, TrendingUp } from 'lucide-react';

const LLMAnalysis = ({ analysis }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!analysis?.llm_response) {
    return null;
  }

  const parseAnalysis = (response) => {
    const sections = {
      rootCause: '',
      recommendations: '',
      confidence: '',
      impact: ''
    };

    // Simple parsing - in production, you might want more sophisticated parsing
    const lines = response.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.includes('ROOT CAUSE') || line.includes('root cause')) {
        currentSection = 'rootCause';
      } else if (line.includes('RECOMMENDATIONS') || line.includes('recommendations')) {
        currentSection = 'recommendations';
      } else if (line.includes('CONFIDENCE') || line.includes('confidence')) {
        currentSection = 'confidence';
      } else if (line.includes('IMPACT') || line.includes('impact')) {
        currentSection = 'impact';
      } else if (currentSection && line.trim()) {
        sections[currentSection] += line + '\n';
      }
    });

    return sections;
  };

  const sections = parseAnalysis(analysis.llm_response);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">LLM Analysis</h3>
          <span className="text-sm text-gray-500">
            ({analysis.model_used || 'llama3.2'})
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {sections.rootCause && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-red-600" />
                <h4 className="font-medium text-red-900">Root Cause Analysis</h4>
              </div>
              <p className="text-sm text-red-800 whitespace-pre-wrap">{sections.rootCause.trim()}</p>
            </div>
          )}

          {sections.recommendations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-blue-900">Recommendations</h4>
              </div>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{sections.recommendations.trim()}</p>
            </div>
          )}

          {sections.confidence && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-green-900">Confidence & Impact</h4>
              </div>
              <p className="text-sm text-green-800 whitespace-pre-wrap">{sections.confidence.trim()}</p>
            </div>
          )}

          {/* Show raw response if parsing didn't work well */}
          {!sections.rootCause && !sections.recommendations && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Analysis Response</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {analysis.llm_response}
              </div>
            </div>
          )}

          {/* Analysis metadata */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Response Length: {analysis.llm_response.length} chars</span>
              <span>Logs Analyzed: {analysis.logs_analyzed || 0}</span>
              <span>Generated: {new Date(analysis.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMAnalysis;