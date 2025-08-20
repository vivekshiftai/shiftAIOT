import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit, Zap, Filter, Search, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { ruleAPI } from '../services/api';
import { Rule, RuleCondition, RuleAction } from '../types';
import { LoadingSpinner, LoadingButton } from '../components/Loading/LoadingComponents';
import { RuleForm } from '../components/Forms';

export const RulesSection: React.FC = () => {
  const { rules, createRule, updateRule, deleteRule, toggleRule, refreshRules, loading, devices } = useIoT();
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refresh rules when component mounts
  useEffect(() => {
    refreshRules();
  }, [refreshRules]);

  // Filter rules based on search and status
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && rule.active) ||
                         (filterStatus === 'inactive' && !rule.active);
    return matchesSearch && matchesStatus;
  });

  const activeRulesCount = rules.filter(r => r.active).length;
  const totalRulesCount = rules.length;

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      await toggleRule(ruleId);
      // Refresh rules after toggle
      await refreshRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      try {
        await deleteRule(ruleId);
        // Refresh rules after deletion
        await refreshRules();
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

  // Get device names for conditions
  const getDeviceNames = (rule: Rule) => {
    const deviceIds = rule.conditions
      .map(c => c.deviceId)
      .filter(id => id && id !== '*');
    
    if (deviceIds.length === 0) return ['All Devices'];
    
    // Get actual device names from the devices context
    return deviceIds.map(id => {
      const device = devices.find(d => d.id === id);
      return device ? device.name : `Device ${id}`;
    });
  };

  const handleCreateRule = async (ruleData: Omit<Rule, 'id' | 'createdAt'>) => {
    try {
      setIsSubmitting(true);
      await createRule(ruleData);
      setShowRuleBuilder(false);
      // Refresh rules after creation
      await refreshRules();
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Automation Rules</h2>
          <p className="text-slate-600 mt-1">Manage IoT automation rules and triggers</p>
        </div>
        <button
          onClick={() => setShowRuleBuilder(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Rules</p>
              <p className="text-2xl font-bold text-slate-900">{totalRulesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Rules</p>
              <p className="text-2xl font-bold text-slate-900">{activeRulesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Inactive Rules</p>
              <p className="text-2xl font-bold text-slate-900">{totalRulesCount - activeRulesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Device Rules</p>
              <p className="text-2xl font-bold text-slate-900">{rules.filter(r => r.conditions.some(c => c.deviceId && c.deviceId !== '*')).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Rules</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button
            onClick={refreshRules}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            title="Refresh rules"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-slate-600 mt-4">Loading rules...</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
            <Zap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No rules found' : 'No rules created yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? "Try adjusting your search or filter criteria."
                : "Create your first automation rule to get started with intelligent device management."
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => setShowRuleBuilder(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                Create First Rule
              </button>
            )}
          </div>
        ) : (
          filteredRules.map((rule) => (
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
                      <span>Devices: {getDeviceNames(rule).join(', ')}</span>
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

      {/* Rule Builder Modal */}
      <RuleForm
        isOpen={showRuleBuilder}
        onClose={() => {
          setShowRuleBuilder(false);
          setEditingRule(null);
        }}
        rule={editingRule || undefined}
        onSubmit={handleCreateRule}
      />
    </div>
  );
};