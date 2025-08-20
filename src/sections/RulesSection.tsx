import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit, Zap, Filter, Search, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { ruleAPI } from '../services/api';
import { Rule, RuleCondition, RuleAction } from '../types';
import { LoadingSpinner, LoadingButton } from '../components/Loading/LoadingComponents';
import { RuleForm } from '../components/Forms';

export const RulesSection: React.FC = () => {
  const { rules, createRule, updateRule, deleteRule, toggleRule, refreshRules, loading } = useIoT();
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && rule.active) ||
                         (statusFilter === 'inactive' && !rule.active);
    
    return matchesSearch && matchesStatus;
  });

  const activeRulesCount = rules.filter(r => r.active).length;
  const totalRulesCount = rules.length;

  const handleRefreshRules = async () => {
    setIsRefreshing(true);
    try {
      await refreshRules();
    } catch (error) {
      console.error('Failed to refresh rules:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleSelectRule = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRules.length === filteredRules.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(filteredRules.map(r => r.id));
    }
  };

  const handleBulkToggle = async (active: boolean) => {
    setIsSubmitting(true);
    try {
      const promises = selectedRules.map(ruleId => {
        const rule = rules.find(r => r.id === ruleId);
        if (rule && rule.active !== active) {
          return toggleRule(ruleId);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      setSelectedRules([]);
    } catch (error) {
      console.error('Failed to bulk toggle rules:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedRules.length} rules? This action cannot be undone.`)) {
      setIsSubmitting(true);
      try {
        const promises = selectedRules.map(ruleId => deleteRule(ruleId));
        await Promise.all(promises);
        setSelectedRules([]);
      } catch (error) {
        console.error('Failed to bulk delete rules:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getRuleIcon = (rule: Rule) => {
    if (!rule.active) return <Pause className="w-5 h-5 text-tertiary" />;
    
    // Determine icon based on rule conditions
    const hasErrorCondition = rule.conditions.some(c => 
      c.operator === '>' && c.metric === 'temperature' && parseFloat(c.value.toString()) > 30
    );
    
    if (hasErrorCondition) return <AlertTriangle className="w-5 h-5 text-error-500" />;
    return <Zap className="w-5 h-5 text-success-500" />;
  };

  const getRuleBadge = (rule: Rule) => {
    if (!rule.active) return 'bg-tertiary/20 text-tertiary';
    return 'bg-success-500/20 text-success-300';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  // Show loading screen while data is being fetched
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 bg-slate-200 rounded-lg w-40 animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded-lg w-20 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded-lg w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-200 rounded-lg w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Automation Rules</h1>
          <p className="text-secondary mt-2">
            Create and manage automated responses to device events
          </p>
        </div>
        
        <div className="flex gap-2">
          <LoadingButton
            loading={isRefreshing}
            onClick={handleRefreshRules}
            className="flex items-center gap-2 px-4 py-2 btn-success"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </LoadingButton>
          <button 
            onClick={() => setShowRuleBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 btn-secondary"
          >
            <Plus className="w-4 h-4" />
            Create Rule
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{activeRulesCount} active</span>
            <span className="text-slate-400">•</span>
            <span>{totalRulesCount} total</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedRules.length} rule{selectedRules.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <LoadingButton
                loading={isSubmitting}
                onClick={() => handleBulkToggle(true)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Activate All
              </LoadingButton>
              <LoadingButton
                loading={isSubmitting}
                onClick={() => handleBulkToggle(false)}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Deactivate All
              </LoadingButton>
              <LoadingButton
                loading={isSubmitting}
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete All
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div key={rule.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes(rule.id)}
                    onChange={() => handleSelectRule(rule.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className={`p-2 rounded-lg ${
                    rule.active ? 'bg-green-50' : 'bg-slate-100'
                  }`}>
                    {getRuleIcon(rule)}
                  </div>
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
        ))}
      </div>

      {filteredRules.length === 0 && (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
          <Zap className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No rules found</h3>
          <p className="text-slate-600 mb-6">
            {rules.length === 0 
              ? "Create your first automation rule to get started with intelligent device management."
              : "No rules match your current search criteria."
            }
          </p>
          <button 
            onClick={() => setShowRuleBuilder(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            Create First Rule
          </button>
        </div>
      )}

      {/* Rule Builder Modal */}
      <RuleForm
        isOpen={showRuleBuilder}
        onClose={() => {
          setShowRuleBuilder(false);
          setEditingRule(null);
        }}
        onSubmit={(data) => {
          if (editingRule) {
            updateRule(editingRule.id, data).then(() => {
              refreshRules();
              setShowRuleBuilder(false);
              setEditingRule(null);
            });
          } else {
            createRule(data).then(() => {
              refreshRules();
              setShowRuleBuilder(false);
              setEditingRule(null);
            });
          }
        }}
        initialValues={editingRule}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};