import React, { useState } from 'react';
import { Plus, Play, Pause, Trash2, Edit, Zap } from 'lucide-react';
import { RuleBuilder } from '../components/Rules/RuleBuilder';
import { useIoT } from '../contexts/IoTContext';

export const RulesSection: React.FC = () => {
  const { rules } = useIoT();
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Rules</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage automated responses to device events
          </p>
        </div>
        
        <button 
          onClick={() => setShowRuleBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-2 rounded-lg ${
                  rule.active ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'
                }`}>
                  <Zap className={`w-5 h-5 ${
                    rule.active ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rule.active 
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {rule.description}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Conditions: {rule.conditions.length}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Actions: {rule.actions.length}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Created: {new Date(rule.createdAt).toLocaleDateString()}
                    </span>
                    {rule.lastTriggered && (
                      <span className="text-gray-500 dark:text-gray-400">
                        Last triggered: {new Date(rule.lastTriggered).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                
                <button className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">
                  {rule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                
                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Rule Logic Preview */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">IF:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {rule.conditions.map((condition, index) => (
                    <span key={condition.id}>
                      {index > 0 && ` ${condition.logicOperator || 'AND'} `}
                      {condition.metric} {condition.operator} {condition.value}
                    </span>
                  ))}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300 ml-4">THEN:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {rule.actions.map(action => action.type).join(', ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No rules yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first automation rule to get started with intelligent device management.
          </p>
          <button 
            onClick={() => setShowRuleBuilder(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Rule
          </button>
        </div>
      )}

      {/* Rule Builder Modal */}
      <RuleBuilder
        isOpen={showRuleBuilder}
        onClose={() => {
          setShowRuleBuilder(false);
          setEditingRule(null);
        }}
        rule={editingRule}
      />
    </div>
  );
};