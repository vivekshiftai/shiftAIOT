import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Rule, RuleCondition, RuleAction } from '../../types';
import { useIoT } from '../../contexts/IoTContext';

interface RuleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: Rule;
  deviceId?: string;
  onSubmit?: (ruleData: Omit<Rule, 'id' | 'createdAt'>) => Promise<void>;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ isOpen, onClose, rule, deviceId, onSubmit }) => {
  const { devices, createRule } = useIoT();
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    active: boolean;
    conditions: RuleCondition[];
    actions: RuleAction[];
  }>({
    name: rule?.name || '',
    description: rule?.description || '',
    active: rule?.active ?? true,
    conditions: rule?.conditions || [
      {
        id: '1',
        type: 'telemetry_threshold' as const,
        deviceId: deviceId || '',
        metric: 'temperature',
        operator: '>' as const,
        value: 30
      }
    ],
    actions: rule?.actions || [
      {
        id: '1',
        type: 'notification' as const,
        config: { channels: ['email'] }
      }
    ]
  });

  if (!isOpen) return null;

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
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (onSubmit) {
        // Use custom onSubmit if provided (for device-specific rules)
        await onSubmit({
          name: formData.name,
          description: formData.description,
          active: formData.active,
          conditions: formData.conditions,
          actions: formData.actions
        });
      } else {
        // Use default createRule from context
        await createRule({
          name: formData.name,
          description: formData.description,
          active: formData.active,
          conditions: formData.conditions,
          actions: formData.actions
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {rule ? 'Edit Rule' : 'Create New Rule'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rule Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.active ? 'active' : 'inactive'}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'active' }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Conditions</h3>
              <button
                type="button"
                onClick={addCondition}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>

            <div className="space-y-4">
              {formData.conditions.map((condition, index) => (
                <div key={condition.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="grid grid-cols-5 gap-4 items-end">
                    {index > 0 && (
                      <div>
                        <select
                          value={condition.logicOperator || 'AND'}
                          onChange={(e) => updateCondition(index, 'logicOperator', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}
                    
                    <div className={index === 0 ? 'col-span-1' : ''}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Device
                      </label>
                      <select
                        value={condition.deviceId || ''}
                        onChange={(e) => updateCondition(index, 'deviceId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select device</option>
                        {devices.map(device => (
                          <option key={device.id} value={device.id}>{device.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Metric
                      </label>
                      <select
                        value={condition.metric || ''}
                        onChange={(e) => updateCondition(index, 'metric', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="temperature">Temperature</option>
                        <option value="humidity">Humidity</option>
                        <option value="pressure">Pressure</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Operator
                      </label>
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value=">">Greater than</option>
                        <option value="<">Less than</option>
                        <option value="=">Equals</option>
                        <option value=">=">Greater than or equal</option>
                        <option value="<=">Less than or equal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Value
                      </label>
                      <input
                        type="number"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Actions</h3>
              <button
                type="button"
                onClick={addAction}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            </div>

            <div className="space-y-4">
              {formData.actions.map((action, index) => (
                <div key={action.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Action Type
                      </label>
                      <select
                        value={action.type}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="notification">Send Notification</option>
                        <option value="webhook">Webhook</option>
                        <option value="device_control">Device Control</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Channels
                      </label>
                      <div className="flex gap-2">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="mr-1" />
                          <span className="text-sm">Email</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-1" />
                          <span className="text-sm">Slack</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-1" />
                          <span className="text-sm">Teams</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};