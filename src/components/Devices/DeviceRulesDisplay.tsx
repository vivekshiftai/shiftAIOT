import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, CheckCircle, Clock, Filter, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { unifiedOnboardingService } from '../../services/unifiedOnboardingService';
import { ruleAPI } from '../../services/api';
import { RuleForm } from '../Forms';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { logInfo, logError, logWarn } from '../../utils/logger';

interface IoTRule {
  id: string;
  name: string;
  description: string;
  metric?: string;
  metricValue?: string;
  threshold?: string;
  consequence?: string;
  condition: string;
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ACTIVE' | 'INACTIVE';
  category: string;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
}

interface DeviceRulesDisplayProps {
  deviceId: string;
}

const DeviceRulesDisplay: React.FC<DeviceRulesDisplayProps> = ({ deviceId }) => {
  const [rules, setRules] = useState<IoTRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<IoTRule | null>(null);

  useEffect(() => {
    loadRules();
  }, [deviceId]);

  const loadRules = async () => {
    try {
      setLoading(true);
      logInfo('DeviceRulesDisplay', 'Loading rules for device', { deviceId });
      
      // Use unified service to get rules
      const rulesData = await unifiedOnboardingService.getDeviceRules(deviceId);
      
      // Transform the data to match the expected format
      const transformedRules: IoTRule[] = rulesData.map((rule: any) => ({
        id: rule.id || rule.rule_id || `rule_${Math.random()}`,
        name: rule.name || rule.rule_name || 'Unnamed Rule',
        description: rule.description || 'No description available',
        metric: rule.metric,
        metricValue: rule.metric_value,
        threshold: rule.threshold,
        consequence: rule.consequence,
        condition: rule.condition || `${rule.metric} ${rule.threshold}`,
        action: rule.action || rule.consequence || 'Send notification',
        priority: rule.priority || 'MEDIUM',
        status: rule.status || 'ACTIVE',
        category: rule.category || 'General',
        deviceId: deviceId,
        createdAt: rule.createdAt || rule.created_at || new Date().toISOString(),
        updatedAt: rule.updatedAt || rule.updated_at || new Date().toISOString()
      }));
      
      setRules(transformedRules);
      setError(null);
      
      logInfo('DeviceRulesDisplay', 'Rules loaded successfully', { 
        deviceId, 
        rulesCount: transformedRules.length 
      });
    } catch (err) {
      logError('DeviceRulesDisplay', 'Error loading rules', err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error loading rules:', err);
      setError('Failed to load IoT rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesPriority = filterPriority === 'all' || rule.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || rule.status === filterStatus;
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rule.metric && rule.metric.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (rule.threshold && rule.threshold.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (rule.consequence && rule.consequence.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesPriority && matchesStatus && matchesSearch;
  });

  const handleAddRule = () => {
    setEditingRule(null);
    setShowAddModal(true);
  };

  const handleEditRule = (rule: IoTRule) => {
    setEditingRule(rule);
    setShowEditModal(true);
  };

  const handleDeleteRule = async (id: string) => {
    try {
      logInfo('DeviceRulesDisplay', 'Deleting rule', { ruleId: id, deviceId });
      
      // Use direct API call for delete operation as it's not part of the unified service
      await ruleAPI.delete(id);
      
      logInfo('DeviceRulesDisplay', 'Rule deleted successfully', { ruleId: id });
      
      // Reload rules to get updated list
      await loadRules();
    } catch (err) {
      logError('DeviceRulesDisplay', 'Error deleting rule', err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error deleting rule:', err);
      alert('Failed to delete rule');
    }
  };

  const handleToggleStatus = async (rule: IoTRule) => {
    try {
      logInfo('DeviceRulesDisplay', 'Toggling rule status', { ruleId: rule.id, deviceId, newStatus: rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      await ruleAPI.update(rule.id, {
        ...rule,
        status: rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
      });
      logInfo('DeviceRulesDisplay', 'Rule status toggled successfully', { ruleId: rule.id });
      await loadRules();
    } catch (err) {
      logError('DeviceRulesDisplay', 'Error updating rule status', err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error updating rule:', err);
      setError('Failed to update rule');
    }
  };

  const handleSaveRule = async (ruleData: any) => {
    try {
      logInfo('DeviceRulesDisplay', 'Saving rule', { ruleData, deviceId });
      
      if (editingRule) {
        // Update existing rule
        await ruleAPI.update(editingRule.id, { ...ruleData, deviceId });
        logInfo('DeviceRulesDisplay', 'Rule updated successfully', { ruleId: editingRule.id });
      } else {
        // Create new rule
        await ruleAPI.create({ ...ruleData, deviceId });
        logInfo('DeviceRulesDisplay', 'Rule created successfully');
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingRule(null);
      
      // Reload rules to get updated list
      await loadRules();
    } catch (err) {
      logError('DeviceRulesDisplay', 'Error saving rule', err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error saving rule:', err);
      setError('Failed to save rule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button
            onClick={loadRules}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">IoT Rules</h3>
          <p className="text-sm text-gray-600">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          onClick={handleAddRule}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No IoT rules found</h3>
            <p className="text-gray-500 mb-4">
              {rules.length === 0 
                ? "This device doesn't have any IoT rules yet."
                : "No rules match your current filters."
              }
            </p>
            {rules.length === 0 && (
              <Button
                onClick={handleAddRule}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Rule
              </Button>
            )}
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-lg border ${
                rule.status === 'INACTIVE' ? 'opacity-60 bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Settings className="w-5 h-5 text-blue-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(rule.priority)}`}>
                        {rule.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(rule.status)}`}>
                        {rule.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong className="text-gray-700">Description:</strong>
                        <p className="text-gray-600 ml-2">{rule.description}</p>
                      </div>
                      {rule.metric && (
                        <div>
                          <strong className="text-gray-700">Metric:</strong>
                          <p className="text-gray-600 ml-2">{rule.metric}</p>
                        </div>
                      )}
                      {rule.metricValue && (
                        <div>
                          <strong className="text-gray-700">Metric Value:</strong>
                          <p className="text-gray-600 ml-2">{rule.metricValue}</p>
                        </div>
                      )}
                      {rule.threshold && (
                        <div>
                          <strong className="text-gray-700">Threshold:</strong>
                          <p className="text-gray-600 ml-2">{rule.threshold}</p>
                        </div>
                      )}
                      {rule.consequence && (
                        <div>
                          <strong className="text-gray-700">Consequence:</strong>
                          <p className="text-gray-600 ml-2">{rule.consequence}</p>
                        </div>
                      )}
                      <div>
                        <strong className="text-gray-700">Condition:</strong>
                        <p className="text-gray-600 ml-2">{rule.condition}</p>
                      </div>
                      <div>
                        <strong className="text-gray-700">Action:</strong>
                        <p className="text-gray-600 ml-2">{rule.action}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Category: {rule.category}</span>
                      <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(rule)}
                    className={`p-1 rounded ${
                      rule.status === 'ACTIVE' 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={rule.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  >
                    {rule.status === 'ACTIVE' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingRule(null);
        }}
        title={editingRule ? 'Edit IoT Rule' : 'Add IoT Rule'}
      >
        <RuleForm
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingRule(null);
          }}
          rule={editingRule || undefined}
          deviceId={deviceId}
          onSubmit={handleSaveRule}
        />
      </Modal>
    </div>
  );
};

export default DeviceRulesDisplay;
