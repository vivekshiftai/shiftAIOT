import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Filter, Search, AlertTriangle, CheckCircle, Info, Settings } from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { ruleAPI } from '../services/api';
import { LoadingSpinner } from '../components/Loading/LoadingComponents';
import { RuleForm } from '../components/Forms';
import { Rule } from '../types';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';

export const RulesSection: React.FC = () => {
  const { rules, createRule, updateRule, deleteRule, toggleRule, refreshRules, loading, devices } = useIoT();
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh rules when component mounts and set up polling
  useEffect(() => {
    refreshRules();
    
    // Poll for updates every 60 seconds (reduced from 30)
    const interval = setInterval(refreshRules, 60000);
    return () => clearInterval(interval);
  }, [refreshRules]);

  // Filter rules based on search and status
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && rule.status === 'ACTIVE') ||
                         (filterStatus === 'inactive' && rule.status === 'INACTIVE');
    return matchesSearch && matchesStatus;
  });

  const activeRulesCount = rules.filter(r => r.status === 'ACTIVE').length;
  const totalRulesCount = rules.length;

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      setError(null);
      await toggleRule(ruleId);
      // Refresh rules after toggle
      await refreshRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      setError('Failed to toggle rule status');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      try {
        setError(null);
        await deleteRule(ruleId);
        // Refresh rules after deletion
        await refreshRules();
      } catch (error) {
        console.error('Failed to delete rule:', error);
        setError('Failed to delete rule');
      }
    }
  };

  const getRuleIcon = (rule: Rule) => {
    if (rule.status === 'INACTIVE') return <AlertTriangle className="w-5 h-5 text-slate-400" />;
    
    // Determine icon based on rule priority
    if (rule.priority === 'HIGH') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getRuleBadge = (rule: Rule) => {
    if (rule.status === 'INACTIVE') return 'bg-slate-100/80 text-slate-600';
    return 'bg-green-100/80 text-green-600';
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
      setError(null);
      await createRule(ruleData);
      setShowRuleBuilder(false);
      // Refresh rules after creation
      await refreshRules();
    } catch (error) {
      console.error('Failed to create rule:', error);
      setError('Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={32} />
          <Skeleton width={120} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 min-h-screen p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Automation Rules</h1>
          <p className="text-slate-600 text-sm sm:text-base">Manage IoT automation rules and triggers</p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowRuleBuilder(true)}
        >
          Create Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50/80 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Rules</p>
              <p className="text-2xl font-bold text-slate-800">{totalRulesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50/80 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Active Rules</p>
              <p className="text-2xl font-bold text-slate-800">{activeRulesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50/80 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Inactive Rules</p>
              <p className="text-2xl font-bold text-slate-800">{totalRulesCount - activeRulesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50/80 rounded-lg">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Device Rules</p>
              <p className="text-2xl font-bold text-slate-800">{rules.filter(r => r.deviceId).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-3 sm:px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-slate-700 text-sm"
          >
            <option value="all">All Rules</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshRules}
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100/80"
            title="Refresh rules"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Rules Cards */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rules found</h3>
            <p className="text-gray-500 mb-4">
              {rules.length === 0 
                ? "You don't have any automation rules yet."
                : "No rules match your current filters."
              }
            </p>
            {rules.length === 0 && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowRuleBuilder(true)}
                className="mx-auto"
              >
                Create Your First Rule
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                className={`bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 ${
                  rule.status === 'INACTIVE' ? 'opacity-60' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        rule.status === 'ACTIVE' ? 'bg-green-50/80' : 'bg-slate-100/80'
                      }`}>
                        {getRuleIcon(rule)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">{rule.name}</h3>
                        <p className="text-sm text-slate-500">{rule.category || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                        rule.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                        {rule.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                        rule.priority === 'HIGH' 
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : rule.priority === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          : 'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {rule.priority}
                      </span>
                    </div>
                  </div>
                  
                  {rule.description && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600">{rule.description}</p>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <strong className="text-sm text-slate-700">Condition:</strong>
                      <p className="text-sm text-slate-600 mt-1">
                        {rule.condition || 'No condition specified'}
                      </p>
                    </div>
                    
                    <div>
                      <strong className="text-sm text-slate-700">Action:</strong>
                      <p className="text-sm text-slate-600 mt-1">
                        {rule.action || 'No action specified'}
                      </p>
                    </div>
                    
                    {rule.deviceId && (
                      <div>
                        <strong className="text-sm text-slate-700">Device:</strong>
                        <p className="text-sm text-slate-600 mt-1">
                          {devices.find(d => d.id === rule.deviceId)?.name || 'Unknown Device'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/60">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                      {rule.updatedAt && (
                        <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`p-1 rounded transition-colors ${
                          rule.status === 'ACTIVE'
                            ? 'text-orange-600 hover:bg-orange-100'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={rule.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      >
                        {rule.status === 'ACTIVE' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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