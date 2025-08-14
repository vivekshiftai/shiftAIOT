import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ruleAPI } from '../services/api';
import { handleAuthError } from '../utils/authUtils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  ArrowLeft, 
  Settings,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Wifi,
  Thermometer,
  Gauge,
  Target
} from 'lucide-react';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';

interface Rule {
  id: string;
  name: string;
  description?: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggerCount: number;
  type: string; // Added for new card
  priority: string; // Added for new card
}

interface RuleCondition {
  id: string;
  deviceId: string;
  deviceName: string;
  parameter: string;
  operator: string;
  value: string;
}

interface RuleAction {
  id: string;
  type: string;
  deviceId: string;
  deviceName: string;
  action: string;
  value?: string;
}

interface RuleFormData {
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
}

const RulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    conditions: [],
    actions: [],
    isActive: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock devices for condition/action selection
  const mockDevices = [
    { id: '1', name: 'Temperature Sensor 1' },
    { id: '2', name: 'Humidity Monitor' },
    { id: '3', name: 'Pressure Gauge' },
    { id: '4', name: 'Flow Meter' }
  ];

  const parameterOptions = [
    { value: 'temperature', label: 'Temperature', icon: Thermometer },
    { value: 'humidity', label: 'Humidity', icon: Gauge },
    { value: 'pressure', label: 'Pressure', icon: Gauge },
    { value: 'flow_rate', label: 'Flow Rate', icon: Wifi },
    { value: 'status', label: 'Status', icon: CheckCircle }
  ];

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' }
  ];

  const actionTypes = [
    { value: 'send_notification', label: 'Send Notification' },
    { value: 'control_device', label: 'Control Device' },
    { value: 'log_event', label: 'Log Event' },
    { value: 'trigger_alert', label: 'Trigger Alert' }
  ];

  const { user } = useAuth();

  // Fetch rules with polling
  const fetchRules = async () => {
    if (!user) {
      console.warn('No user authenticated, skipping rules fetch');
      return;
    }

    try {
      setError(null);
      const response = await ruleAPI.getAll();
      setRules(response.data || []);
    } catch (err: any) {
      setError(handleAuthError(err, 'Failed to fetch rules'));
      console.error('Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchRules, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter rules based on search and status
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && rule.isActive) ||
                         (filterStatus === 'inactive' && !rule.isActive);
    return matchesSearch && matchesStatus;
  });

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Rule name is required';
    }
    
    if (formData.conditions.length === 0) {
      errors.conditions = 'At least one condition is required';
    }
    
    if (formData.actions.length === 0) {
      errors.actions = 'At least one action is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingRule) {
        await ruleAPI.update(editingRule.id, formData);
      } else {
        await ruleAPI.create(formData);
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingRule(null);
      resetForm();
      fetchRules(); // Refresh the list
    } catch (err: any) {
      setError(handleAuthError(err, 'Failed to save rule'));
    }
  };

  // Handle rule deletion
  const handleDelete = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await ruleAPI.delete(ruleId);
      fetchRules(); // Refresh the list
    } catch (err: any) {
      setError(handleAuthError(err, 'Failed to delete rule'));
    }
  };

  // Handle edit
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      conditions: rule.conditions,
      actions: rule.actions,
      isActive: rule.isActive
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      conditions: [],
      actions: [],
      isActive: true
    });
    setFormErrors({});
  };

  // Add condition
  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: Date.now().toString(),
      deviceId: '',
      deviceName: '',
      parameter: 'temperature',
      operator: 'equals',
      value: ''
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  // Remove condition
  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  // Update condition
  const updateCondition = (index: number, field: keyof RuleCondition, value: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  // Add action
  const addAction = () => {
    const newAction: RuleAction = {
      id: Date.now().toString(),
      type: 'send_notification',
      deviceId: '',
      deviceName: '',
      action: '',
      value: ''
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  // Remove action
  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  // Update action
  const updateAction = (index: number, field: keyof RuleAction, value: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={32} />
          <Skeleton width={120} height={40} />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Automation Rules</h1>
            <p className="text-secondary">Create and manage IoT automation rules</p>
          </div>
        </div>
        
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          Add Rule
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Rules</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRules.map((rule) => (
          <div key={rule.id} className="card p-6 hover-lift">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-success-500' : 'bg-neutral-400'}`} />
                <h3 className="font-semibold text-primary">{rule.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(rule)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(rule.id)}
                  className="text-error-500 hover:text-error-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {rule.description && (
              <p className="text-secondary text-sm mb-4">{rule.description}</p>
            )}
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-secondary">Type:</span>
                <span className="font-medium text-primary capitalize">{rule.type}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-warning-500" />
                <span className="text-secondary">Priority:</span>
                <span className="font-medium text-primary capitalize">{rule.priority}</span>
              </div>
              
              {rule.lastTriggered && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="text-secondary">Last triggered:</span>
                  <span className="font-medium text-primary">
                    {new Date(rule.lastTriggered).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-tertiary">
              <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredRules.length === 0 && !loading && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No rules found</h3>
          <p className="text-secondary mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first automation rule to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              Create First Rule
            </Button>
          )}
        </div>
      )}

      {/* Add Rule Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Rule"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                formErrors.name ? 'border-error-500' : 'border-light'
              }`}
              placeholder="Enter rule name"
            />
            {formErrors.name && (
              <p className="text-error-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Describe what this rule does"
            />
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-primary">
                Conditions *
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Condition
              </Button>
            </div>
            
            {formData.conditions.map((condition, index) => (
              <div key={condition.id} className="border border-light rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary">Condition {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="text-error-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Device</label>
                    <select
                      value={condition.deviceId}
                      onChange={(e) => {
                        const device = mockDevices.find(d => d.id === e.target.value);
                        updateCondition(index, 'deviceId', e.target.value);
                        updateCondition(index, 'deviceName', device?.name || '');
                      }}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Device</option>
                      {mockDevices.map(device => (
                        <option key={device.id} value={device.id}>{device.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Parameter</label>
                    <select
                      value={condition.parameter}
                      onChange={(e) => updateCondition(index, 'parameter', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {parameterOptions.map(param => (
                        <option key={param.value} value={param.value}>{param.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Operator</label>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {operatorOptions.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Value</label>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {formErrors.conditions && (
              <p className="text-error-500 text-sm">{formErrors.conditions}</p>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-primary">
                Actions *
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={addAction}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Action
              </Button>
            </div>
            
            {formData.actions.map((action, index) => (
              <div key={action.id} className="border border-light rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary">Action {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                    className="text-error-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Action Type</label>
                    <select
                      value={action.type}
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {actionTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Target Device</label>
                    <select
                      value={action.deviceId}
                      onChange={(e) => {
                        const device = mockDevices.find(d => d.id === e.target.value);
                        updateAction(index, 'deviceId', e.target.value);
                        updateAction(index, 'deviceName', device?.name || '');
                      }}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Device</option>
                      {mockDevices.map(device => (
                        <option key={device.id} value={device.id}>{device.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary mb-1">Action Details</label>
                    <input
                      type="text"
                      value={action.action}
                      onChange={(e) => updateAction(index, 'action', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Describe the action to perform"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {formErrors.actions && (
              <p className="text-error-500 text-sm">{formErrors.actions}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary border-light rounded focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-primary">
              Rule is active
            </label>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light bg-white dark:bg-gray-800 sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            Create Rule
          </Button>
        </div>
      </Modal>

      {/* Edit Rule Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Rule"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                formErrors.name ? 'border-error-500' : 'border-light'
              }`}
              placeholder="Enter rule name"
            />
            {formErrors.name && (
              <p className="text-error-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Describe what this rule does"
            />
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-primary">
                Conditions *
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Condition
              </Button>
            </div>
            
            {formData.conditions.map((condition, index) => (
              <div key={condition.id} className="border border-light rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary">Condition {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(index)}
                    className="text-error-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Device</label>
                    <select
                      value={condition.deviceId}
                      onChange={(e) => {
                        const device = mockDevices.find(d => d.id === e.target.value);
                        updateCondition(index, 'deviceId', e.target.value);
                        updateCondition(index, 'deviceName', device?.name || '');
                      }}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Device</option>
                      {mockDevices.map(device => (
                        <option key={device.id} value={device.id}>{device.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Parameter</label>
                    <select
                      value={condition.parameter}
                      onChange={(e) => updateCondition(index, 'parameter', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {parameterOptions.map(param => (
                        <option key={param.value} value={param.value}>{param.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Operator</label>
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {operatorOptions.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Value</label>
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {formErrors.conditions && (
              <p className="text-error-500 text-sm">{formErrors.conditions}</p>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-primary">
                Actions *
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={addAction}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Action
              </Button>
            </div>
            
            {formData.actions.map((action, index) => (
              <div key={action.id} className="border border-light rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-primary">Action {index + 1}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(index)}
                    className="text-error-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Action Type</label>
                    <select
                      value={action.type}
                      onChange={(e) => updateAction(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {actionTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Target Device</label>
                    <select
                      value={action.deviceId}
                      onChange={(e) => {
                        const device = mockDevices.find(d => d.id === e.target.value);
                        updateAction(index, 'deviceId', e.target.value);
                        updateAction(index, 'deviceName', device?.name || '');
                      }}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="">Select Device</option>
                      {mockDevices.map(device => (
                        <option key={device.id} value={device.id}>{device.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-secondary mb-1">Action Details</label>
                    <input
                      type="text"
                      value={action.action}
                      onChange={(e) => updateAction(index, 'action', e.target.value)}
                      className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Describe the action to perform"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {formErrors.actions && (
              <p className="text-error-500 text-sm">{formErrors.actions}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary border-light rounded focus:ring-primary"
            />
            <label htmlFor="isActiveEdit" className="text-sm font-medium text-primary">
              Rule is active
            </label>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light bg-white dark:bg-gray-800 sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            Update Rule
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RulesPage;
