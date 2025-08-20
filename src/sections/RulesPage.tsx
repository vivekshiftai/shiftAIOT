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
import { RuleForm } from '../components/Forms';

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
        <div>
          <h1 className="text-3xl font-bold text-primary">Automation Rules</h1>
          <p className="text-secondary">Create and manage IoT automation rules</p>
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
      <RuleForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (ruleData) => {
          try {
            const response = await ruleAPI.create(ruleData);
            setRules(prev => [...prev, response]);
            setShowAddModal(false);
            setFormData({
              name: '',
              description: '',
              conditions: [],
              actions: [],
              isActive: true
            });
          } catch (error) {
            console.error('Failed to create rule:', error);
          }
        }}
      />

      {/* Edit Rule Modal */}
      <RuleForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        rule={editingRule || undefined}
        onSubmit={async (ruleData) => {
          if (!editingRule) return;
          try {
            const response = await ruleAPI.update(editingRule.id, ruleData);
            setRules(prev => prev.map(rule => rule.id === editingRule.id ? response : rule));
            setShowEditModal(false);
            setEditingRule(null);
          } catch (error) {
            console.error('Failed to update rule:', error);
          }
        }}
      />
    </div>
  );
};

export default RulesPage;
