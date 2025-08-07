import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit, Zap, AlertTriangle, CheckCircle, Info, Settings, X } from 'lucide-react';
import { Device, Rule, RuleCondition, RuleAction } from '../../types';
import { useIoT } from '../../contexts/IoTContext';
import { RuleBuilder } from '../Rules/RuleBuilder';

interface DeviceRulesProps {
  device: Device;
  onClose: () => void;
}

export const DeviceRules: React.FC<DeviceRulesProps> = ({ device, onClose }) => {
  const { rules, createRule, updateRule, deleteRule, toggleRule, loading } = useIoT();
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter rules that are specific to this device
  const deviceRules = rules.filter(rule => 
    rule.conditions.some(condition => 
      condition.deviceId === device.id || condition.deviceId === '*'
    )
  );

  const activeRulesCount = deviceRules.filter(r => r.active).length;
  const totalRulesCount = deviceRules.length;

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await toggleRule(ruleId);
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      try {
        await deleteRule(ruleId);
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const getRuleIcon = (rule: Rule) => {
    if (!rule.active) return <Pause className="w-5 h-5 text-slate-400" />;
    
    // Determine icon based on rule conditions
    const hasErrorCondition = rule.conditions.some(c => 
      c.operator === '>' && c.metric === 'temperature' && parseFloat(c.value.toString()) > 30
    );
    
    if (hasErrorCondition) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <Zap className="w-5 h-5 text-green-500" />;
  };

  const getRuleBadge = (rule: Rule) => {
    if (!rule.active) return 'bg-slate-100 text-slate-600';
    return 'bg-green-100 text-green-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleCreateRule = async (ruleData: Omit<Rule, 'id' | 'createdAt'>) => {
    try {
      setIsSubmitting(true);
      // Ensure the rule is specific to this device
      const deviceSpecificRule = {
        ...ruleData,
        conditions: ruleData.conditions.map(condition => ({
          ...condition,
          deviceId: condition.deviceId || device.id
        }))
      };
      await createRule(deviceSpecificRule);
      setShowRuleBuilder(false);
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Device Rules</h2>
              <p className="text-slate-600 mt-1">
                Manage automation rules for {device.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <span className="text-slate-600">{activeRulesCount} active rules</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">{totalRulesCount} total rules</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Create Rule Button */}
          <div className="mb-6">
            <button 
              onClick={() => setShowRuleBuilder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Create Rule for {device.name}
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-4">
            {deviceRules.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                <Zap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No rules for this device</h3>
                <p className="text-slate-600 mb-6">
                  Create automation rules to monitor and control this device automatically.
                </p>
                <button 
                  onClick={() => setShowRuleBuilder(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  Create First Rule
                </button>
              </div>
            ) : (
              deviceRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        rule.active ? 'bg-green-50' : 'bg-slate-100'
                      }`}>
                        {getRuleIcon(rule)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{rule.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRuleBadge(rule)}`}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                          {rule.lastTriggered && (
                            <span className="text-xs text-slate-500">
                              Last triggered: {formatDate(rule.lastTriggered)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-slate-600 text-sm mb-3">
                          {rule.description}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-slate-500">
                          <span>Conditions: {rule.conditions.length}</span>
                          <span>Actions: {rule.actions.length}</span>
                          <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button 
                        onClick={() => handleEditRule(rule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit rule"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => handleToggleRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.active 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={rule.active ? 'Deactivate rule' : 'Activate rule'}
                      >
                        {rule.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Rule Logic Preview */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-700">IF:</span>
                      <span className="text-slate-600">
                        {rule.conditions.map((condition, index) => (
                          <span key={condition.id}>
                            {index > 0 && ` ${condition.logicOperator || 'AND'} `}
                            {condition.metric} {condition.operator} {condition.value}
                          </span>
                        ))}
                      </span>
                      <span className="font-medium text-slate-700 ml-4">THEN:</span>
                      <span className="text-slate-600">
                        {rule.actions.map(action => action.type).join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rule Builder Modal */}
        <RuleBuilder
          isOpen={showRuleBuilder}
          onClose={() => {
            setShowRuleBuilder(false);
            setEditingRule(null);
          }}
          rule={editingRule || undefined}
          deviceId={device.id}
          onSubmit={handleCreateRule}
        />
      </div>
    </div>
  );
};
