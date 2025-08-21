import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Rule, RuleCondition, RuleAction, Device } from '../../types';
import { useIoT } from '../../contexts/IoTContext';
import Button from '../UI/Button';
import { LoadingSpinner } from '../Loading/LoadingComponents';

interface RuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: Rule;
  deviceId?: string; // Pre-assigned device when opened from device details
  onSubmit?: (ruleData: Omit<Rule, 'id' | 'createdAt'>) => Promise<void>;
}

export const RuleForm: React.FC<RuleFormProps> = ({
  isOpen,
  onClose,
  rule,
  deviceId,
  onSubmit
}) => {
  const { devices, createRule, updateRule, refreshRules } = useIoT();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    conditions?: string;
    actions?: string;
  }>({});
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    metric: string;
    metricValue: string;
    threshold: string;
    consequence: string;
    active: boolean;
    conditions: RuleCondition[];
    actions: RuleAction[];
  }>({
    name: rule?.name || '',
    description: rule?.description || '',
    metric: rule?.metric || '',
    metricValue: rule?.metricValue || '',
    threshold: rule?.threshold || '',
    consequence: rule?.consequence || '',
    active: rule?.active ?? true,
    conditions: rule?.conditions || [
      {
        id: '1',
        type: 'telemetry_threshold',
        deviceId: deviceId || '',
        metric: 'temperature',
        operator: '>',
        value: 30,
        logicOperator: 'AND'
      }
    ],
    actions: rule?.actions || [
      {
        id: '1',
        type: 'notification',
        config: { channels: ['email'] }
      }
    ]
  });

  // Reset form when rule changes or deviceId changes
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description,
        metric: rule.metric || '',
        metricValue: rule.metricValue || '',
        threshold: rule.threshold || '',
        consequence: rule.consequence || '',
        active: rule.active,
        conditions: rule.conditions,
        actions: rule.actions
      });
    } else {
      setFormData({
        name: '',
        description: '',
        metric: '',
        metricValue: '',
        threshold: '',
        consequence: '',
        active: true,
        conditions: [
          {
            id: '1',
            type: 'telemetry_threshold',
            deviceId: deviceId || '',
            metric: 'temperature',
            operator: '>',
            value: 30,
            logicOperator: 'AND'
          }
        ],
        actions: [
          {
            id: '1',
            type: 'notification',
            config: { channels: ['email'] }
          }
        ]
      });
    }
    setError('');
    setSuccess('');
    setFieldErrors({});
  }, [rule, deviceId]);

  // Real-time validation
  const validateField = (field: string, value: any) => {
    const newErrors = { ...fieldErrors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Rule name is required';
        } else if (value.trim().length < 3) {
          newErrors.name = 'Rule name must be at least 3 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'conditions':
        if (!value || value.length === 0) {
          newErrors.conditions = 'At least one condition is required';
        } else {
          const hasUnassignedDevice = value.some((condition: RuleCondition) => !condition.deviceId);
          if (hasUnassignedDevice) {
            newErrors.conditions = 'All conditions must have a device assigned';
          } else {
            delete newErrors.conditions;
          }
        }
        break;
      case 'actions':
        if (!value || value.length === 0) {
          newErrors.actions = 'At least one action is required';
        } else {
          delete newErrors.actions;
        }
        break;
    }
    
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form data changes with real-time validation
  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Get device name for display
  const getDeviceName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : 'Unknown Device';
  };

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: Date.now().toString(),
      type: 'telemetry_threshold',
      deviceId: deviceId || '',
      metric: 'temperature',
      operator: '>',
      value: 0,
      logicOperator: 'AND'
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const addAction = () => {
    const newAction: RuleAction = {
      id: Date.now().toString(),
      type: 'notification',
      config: { channels: ['email'] }
    };
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newConditions = prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      );
      const newFormData = { ...prev, conditions: newConditions };
      
      // Validate conditions after update
      validateField('conditions', newConditions);
      
      return newFormData;
    });
  };

  const removeCondition = (index: number) => {
    if (formData.conditions.length > 1) {
      setFormData(prev => {
        const newConditions = prev.conditions.filter((_, i) => i !== index);
        const newFormData = { ...prev, conditions: newConditions };
        
        // Validate conditions after removal
        validateField('conditions', newConditions);
        
        return newFormData;
      });
    }
  };

  const updateAction = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newActions = prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      );
      const newFormData = { ...prev, actions: newActions };
      
      // Validate actions after update
      validateField('actions', newActions);
      
      return newFormData;
    });
  };

  const removeAction = (index: number) => {
    if (formData.actions.length > 1) {
      setFormData(prev => {
        const newActions = prev.actions.filter((_, i) => i !== index);
        const newFormData = { ...prev, actions: newActions };
        
        // Validate actions after removal
        validateField('actions', newActions);
        
        return newFormData;
      });
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Rule name is required');
    } else if (formData.name.trim().length < 3) {
      errors.push('Rule name must be at least 3 characters');
    }
    
    if (formData.conditions.length === 0) {
      errors.push('At least one condition is required');
    } else {
      const hasUnassignedDevice = formData.conditions.some(condition => !condition.deviceId);
      if (hasUnassignedDevice) {
        errors.push('All conditions must have a device assigned');
      }
    }
    
    if (formData.actions.length === 0) {
      errors.push('At least one action is required');
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    return true;
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    return formData.name.trim().length >= 3 && 
           formData.conditions.length > 0 && 
           formData.actions.length > 0 &&
           !formData.conditions.some(condition => !condition.deviceId) &&
           Object.keys(fieldErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        // Use custom onSubmit if provided
        await onSubmit({
          name: formData.name,
          description: formData.description,
          metric: formData.metric,
          metricValue: formData.metricValue,
          threshold: formData.threshold,
          consequence: formData.consequence,
          active: formData.active,
          conditions: formData.conditions,
          actions: formData.actions
        });
      } else if (rule) {
        // Update existing rule
        await updateRule(rule.id, {
          name: formData.name,
          description: formData.description,
          metric: formData.metric,
          metricValue: formData.metricValue,
          threshold: formData.threshold,
          consequence: formData.consequence,
          active: formData.active,
          conditions: formData.conditions,
          actions: formData.actions
        });
      } else {
        // Create new rule
        await createRule({
          name: formData.name,
          description: formData.description,
          metric: formData.metric,
          metricValue: formData.metricValue,
          threshold: formData.threshold,
          consequence: formData.consequence,
          active: formData.active,
          conditions: formData.conditions,
          actions: formData.actions
        });
      }
      
      setSuccess(rule ? 'Rule updated successfully!' : 'Rule created successfully!');
      
      // Refresh rules data
      await refreshRules();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to save rule:', error);
      setError(error instanceof Error ? error.message : 'Failed to save rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {rule ? 'Edit Rule' : 'Create New Rule'}
              </h2>
              {deviceId && (
                <p className="text-sm text-slate-600 mt-1">
                  Device: <span className="font-medium">{getDeviceName(deviceId)}</span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-300 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h4 className="font-semibold text-red-800">Error</h4>
                <p className="text-red-700 leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-300 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-semibold text-green-800">Success</h4>
                <p className="text-green-700 leading-relaxed">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormDataChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                placeholder="Enter rule name"
                required
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.active ? 'active' : 'inactive'}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'active' }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
              placeholder="Describe what this rule does"
            />
          </div>

          {/* New Rule Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Metric
              </label>
              <input
                type="text"
                value={formData.metric}
                onChange={(e) => setFormData(prev => ({ ...prev, metric: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                placeholder="e.g., vibration, temperature, pressure"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Metric Value
              </label>
              <input
                type="text"
                value={formData.metricValue}
                onChange={(e) => setFormData(prev => ({ ...prev, metricValue: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                placeholder="e.g., 2.5 mm/s, 25°C"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Threshold
              </label>
              <input
                type="text"
                value={formData.threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                placeholder="e.g., Vibration > 2.5 mm/s"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Consequence
              </label>
              <input
                type="text"
                value={formData.consequence}
                onChange={(e) => setFormData(prev => ({ ...prev, consequence: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900"
                placeholder="e.g., Mechanical damage, safety risk"
              />
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Conditions *</h3>
              <Button
                type="button"
                onClick={addCondition}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </Button>
            </div>

            <div className="space-y-4">
              {formData.conditions.map((condition, index) => (
                <div key={condition.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-900">Condition {index + 1}</h4>
                    {formData.conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {index > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Logic</label>
                        <select
                          value={condition.logicOperator || 'AND'}
                          onChange={(e) => updateCondition(index, 'logicOperator', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}
                    
                    <div className={index === 0 ? 'col-span-1' : ''}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Device *</label>
                      <select
                        value={condition.deviceId || ''}
                        onChange={(e) => updateCondition(index, 'deviceId', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                        required
                      >
                        <option value="">Select device</option>
                        {devices.map(device => (
                          <option key={device.id} value={device.id}>{device.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Metric</label>
                      <select
                        value={condition.metric || ''}
                        onChange={(e) => updateCondition(index, 'metric', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                      >
                        <option value="temperature">Temperature</option>
                        <option value="humidity">Humidity</option>
                        <option value="pressure">Pressure</option>
                        <option value="light">Light</option>
                        <option value="motion">Motion</option>
                        <option value="status">Status</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Operator</label>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                      >
                        <option value=">">Greater than</option>
                        <option value="<">Less than</option>
                        <option value="=">Equals</option>
                        <option value="!=">Not equal</option>
                        <option value=">=">Greater than or equal</option>
                        <option value="<=">Less than or equal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Value</label>
                      <input
                        type="number"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fieldErrors.conditions && (
              <p className="text-xs text-red-500 mt-2">{fieldErrors.conditions}</p>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Actions *</h3>
              <Button
                type="button"
                onClick={addAction}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </Button>
            </div>

            <div className="space-y-4">
              {formData.actions.map((action, index) => (
                <div key={action.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-900">Action {index + 1}</h4>
                    {formData.actions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAction(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Action Type</label>
                      <select
                        value={action.type}
                        onChange={(e) => updateAction(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
                      >
                        <option value="notification">Send Notification</option>
                        <option value="email">Send Email</option>
                        <option value="sms">Send SMS</option>
                        <option value="webhook">Webhook</option>
                        <option value="device_control">Device Control</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Channels</label>
                      <div className="flex gap-3">
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            defaultChecked 
                            className="mr-1 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                          <span className="text-sm text-slate-700">Email</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-1 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                          <span className="text-sm text-slate-700">Slack</span>
                        </label>
                        <label className="flex items-center">
                          <input 
                            type="checkbox" 
                            className="mr-1 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                          />
                          <span className="text-sm text-slate-700">Teams</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {fieldErrors.actions && (
              <p className="text-xs text-red-500 mt-2">{fieldErrors.actions}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {rule ? 'Update Rule' : 'Create Rule'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
