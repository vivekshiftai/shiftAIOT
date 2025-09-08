import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Rule } from '../../types';
import Button from '../UI/Button';
import { LoadingSpinner } from '../Loading/LoadingComponents';
import { logInfo, logError } from '../../utils/logger';

interface RuleCreateRequest {
  name: string;
  description: string;
  active: boolean;
  deviceId?: string;
  conditions: Array<{
    deviceId?: string;
    parameter: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    deviceId?: string;
    action: string;
    value: string;
  }>;
}

interface RuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  rule?: Rule;
  deviceId?: string;
  onSubmit?: (ruleData: RuleCreateRequest) => Promise<void>;
}

export const RuleForm: React.FC<RuleFormProps> = ({
  isOpen,
  onClose,
  rule,
  deviceId,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    description?: string;
    condition?: string;
    action?: string;
  }>({});

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    metric: string;
    metricValue: string;
    threshold: string;
    consequence: string;
    status: 'ACTIVE' | 'INACTIVE';
    condition: string;
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    category: string;
  }>({
    name: rule?.name || '',
    description: rule?.description || '',
    metric: rule?.metric || '',
    metricValue: rule?.metricValue || '',
    threshold: rule?.threshold || '',
    consequence: rule?.consequence || '',
    status: rule?.status || 'ACTIVE',
    condition: rule?.condition || '',
    action: rule?.action || '',
    priority: rule?.priority || 'MEDIUM',
    category: rule?.category || 'General'
  });

  // Reset form when rule changes
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description,
        metric: rule.metric || '',
        metricValue: rule.metricValue || '',
        threshold: rule.threshold || '',
        consequence: rule.consequence || '',
        status: rule.status,
        condition: rule.condition,
        action: rule.action,
        priority: rule.priority,
        category: rule.category
      });
    } else {
      setFormData({
        name: '',
        description: '',
        metric: '',
        metricValue: '',
        threshold: '',
        consequence: '',
        status: 'ACTIVE',
        condition: '',
        action: '',
        priority: 'MEDIUM',
        category: 'General'
      });
    }
    setError('');
    setSuccess('');
    setFieldErrors({});
  }, [rule, deviceId]);

  // Validate form
  const validateForm = () => {
    const newErrors: typeof fieldErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.condition.trim()) {
      newErrors.condition = 'Condition is required';
    }

    if (!formData.action.trim()) {
      newErrors.action = 'Action is required';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Get user from localStorage to get organizationId
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const organizationId = user?.organizationId || 'default';

      // Convert to backend expected format
      const ruleData = {
        name: formData.name,
        description: formData.description,
        active: formData.status === 'ACTIVE',
        deviceId: deviceId || rule?.deviceId,
        conditions: [
          {
            deviceId: deviceId || rule?.deviceId,
            parameter: formData.metric,
            operator: 'equals',
            value: formData.metricValue
          }
        ],
        actions: [
          {
            type: 'notification',
            deviceId: deviceId || rule?.deviceId,
            action: formData.action,
            value: formData.threshold
          }
        ]
      };

      logInfo('RuleForm', 'Submitting rule data', ruleData);

      if (onSubmit) {
        await onSubmit(ruleData);
        setSuccess('Rule saved successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      logError('RuleForm', 'Failed to save rule', err);
      setError(err.response?.data?.message || err.message || 'Failed to save rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {rule ? 'Edit Rule' : 'Create New Rule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter rule name"
              />
              {fieldErrors.name && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Load, Security, Performance"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe what this rule does"
            />
            {fieldErrors.description && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Metric Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric
              </label>
              <input
                type="text"
                value={formData.metric}
                onChange={(e) => handleInputChange('metric', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., load, pressure"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric Value
              </label>
              <input
                type="text"
                value={formData.metricValue}
                onChange={(e) => handleInputChange('metricValue', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 25.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Threshold
              </label>
              <input
                type="text"
                value={formData.threshold}
                onChange={(e) => handleInputChange('threshold', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., > 30"
              />
            </div>
          </div>

          {/* Condition and Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition *
              </label>
              <textarea
                value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.condition ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., load > 85%"
              />
              {fieldErrors.condition && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.condition}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action *
              </label>
              <textarea
                value={formData.action}
                onChange={(e) => handleInputChange('action', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.action ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Send notification, Turn on fan"
              />
              {fieldErrors.action && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.action}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Consequence
            </label>
            <input
              type="text"
              value={formData.consequence}
              onChange={(e) => handleInputChange('consequence', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., System shutdown, Alert notification"
            />
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </div>
              ) : (
                rule ? 'Update Rule' : 'Create Rule'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
