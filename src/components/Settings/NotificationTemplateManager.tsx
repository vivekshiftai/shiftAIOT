import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  Settings,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { notificationTemplateAPI } from '../../services/api';
import { NotificationTemplate, NotificationTemplateRequest } from '../../types';
import { useFormValidation, COMMON_VALIDATION_RULES } from '../../utils/validation';
import { ValidatedField } from '../UI/ValidatedField';

interface NotificationTemplateManagerProps {
  organizationId: string;
}

export const NotificationTemplateManager: React.FC<NotificationTemplateManagerProps> = ({ organizationId }) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

  // Form validation
  const validationRules = {
    name: COMMON_VALIDATION_RULES.templateName,
    type: { required: true },
    titleTemplate: COMMON_VALIDATION_RULES.templateTitle,
    messageTemplate: COMMON_VALIDATION_RULES.templateMessage,
    notificationType: { required: true },
    description: COMMON_VALIDATION_RULES.description
  };

  const initialFormData: NotificationTemplateRequest = {
    name: '',
    type: 'CUSTOM',
    titleTemplate: '',
    messageTemplate: '',
    notificationType: 'CUSTOM',
    active: true,
    description: '',
    variables: {}
  };

  const {
    data: formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset
  } = useFormValidation(initialFormData, validationRules);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await notificationTemplateAPI.getAll();
      setTemplates(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
      setError('Failed to load notification templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!validateAll()) {
      setError('Please fix validation errors before submitting');
      return;
    }

    try {
      await notificationTemplateAPI.create(formData);
      setShowCreateForm(false);
      reset();
      loadTemplates();
      setError(null);
    } catch (err: any) {
      console.error('Failed to create template:', err);
      setError('Failed to create template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    
    if (!validateAll()) {
      setError('Please fix validation errors before submitting');
      return;
    }

    try {
      await notificationTemplateAPI.update(editingTemplate.id, formData);
      setEditingTemplate(null);
      reset();
      loadTemplates();
      setError(null);
    } catch (err: any) {
      console.error('Failed to update template:', err);
      setError('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await notificationTemplateAPI.delete(templateId);
      loadTemplates();
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      setError('Failed to delete template');
    }
  };

  const handleToggleStatus = async (templateId: string) => {
    try {
      await notificationTemplateAPI.toggleStatus(templateId);
      loadTemplates();
    } catch (err: any) {
      console.error('Failed to toggle template status:', err);
      setError('Failed to toggle template status');
    }
  };

  const handlePreviewTemplate = async () => {
    if (!previewTemplate) return;
    
    try {
      const response = await notificationTemplateAPI.process(previewTemplate.id, previewVariables);
      const processed = response.data;
      
      // Show preview in a modal or alert
      alert(`Preview:\n\nTitle: ${processed.title}\n\nMessage: ${processed.message}`);
    } catch (err: any) {
      console.error('Failed to preview template:', err);
      setError('Failed to preview template');
    }
  };

  const startEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    reset({
      name: template.name,
      type: template.type,
      titleTemplate: template.titleTemplate,
      messageTemplate: template.messageTemplate,
      notificationType: template.notificationType,
      active: template.active,
      description: template.description || '',
      variables: template.variables || {}
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEVICE_ASSIGNMENT': return <Settings className="w-4 h-4" />;
      case 'MAINTENANCE_SCHEDULE': return <Clock className="w-4 h-4" />;
      case 'DEVICE_OFFLINE': return <AlertCircle className="w-4 h-4" />;
      case 'DEVICE_ONLINE': return <CheckCircle className="w-4 h-4" />;
      case 'RULE_TRIGGERED': return <Zap className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEVICE_ASSIGNMENT': return 'text-blue-600 bg-blue-100';
      case 'MAINTENANCE_SCHEDULE': return 'text-orange-600 bg-orange-100';
      case 'DEVICE_OFFLINE': return 'text-red-600 bg-red-100';
      case 'DEVICE_ONLINE': return 'text-green-600 bg-green-100';
      case 'RULE_TRIGGERED': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Notification Templates</h3>
          <p className="text-sm text-slate-600">Manage notification templates for different events</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                  {getTypeIcon(template.type)}
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">{template.name}</h4>
                  <p className="text-sm text-slate-600">{template.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {template.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPreviewTemplate(template);
                    setPreviewVariables({});
                  }}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startEdit(template)}
                  className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(template.id)}
                  className="p-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title={template.active ? 'Deactivate' : 'Activate'}
                >
                  {template.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTemplate(null);
                  reset();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              editingTemplate ? handleUpdateTemplate() : handleCreateTemplate();
            }} className="space-y-4">
              
              {/* Name */}
              <ValidatedField
                label="Template Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                validationRule={validationRules.name}
                error={errors.name}
                touched={touched.name}
                placeholder="Enter template name"
                required
                maxLength={100}
              />

              {/* Type */}
              <ValidatedField
                label="Template Type"
                name="type"
                type="select"
                value={formData.type}
                onChange={handleChange}
                onBlur={handleBlur}
                validationRule={validationRules.type}
                error={errors.type}
                touched={touched.type}
                required
                options={[
                  { value: 'DEVICE_ASSIGNMENT', label: 'Device Assignment' },
                  { value: 'DEVICE_CREATION', label: 'Device Creation' },
                  { value: 'MAINTENANCE_SCHEDULE', label: 'Maintenance Schedule' },
                  { value: 'MAINTENANCE_REMINDER', label: 'Maintenance Reminder' },
                  { value: 'DEVICE_OFFLINE', label: 'Device Offline' },
                  { value: 'DEVICE_ONLINE', label: 'Device Online' },
                  { value: 'TEMPERATURE_ALERT', label: 'Temperature Alert' },
                  { value: 'BATTERY_LOW', label: 'Battery Low' },
                  { value: 'RULE_TRIGGERED', label: 'Rule Triggered' },
                  { value: 'CUSTOM', label: 'Custom' }
                ]}
              />

              {/* Title Template */}
              <ValidatedField
                label="Title Template"
                name="titleTemplate"
                type="text"
                value={formData.titleTemplate}
                onChange={handleChange}
                onBlur={handleBlur}
                validationRule={validationRules.titleTemplate}
                error={errors.titleTemplate}
                touched={touched.titleTemplate}
                placeholder="e.g., New Device Assignment - {{deviceName}}"
                required
                maxLength={200}
                helpText="Use {{variableName}} for dynamic content"
              />

              {/* Message Template */}
              <ValidatedField
                label="Message Template"
                name="messageTemplate"
                type="textarea"
                value={formData.messageTemplate}
                onChange={handleChange}
                onBlur={handleBlur}
                validationRule={validationRules.messageTemplate}
                error={errors.messageTemplate}
                touched={touched.messageTemplate}
                placeholder="Enter your message template with variables like {{deviceName}}"
                required
                maxLength={1000}
                rows={6}
                helpText="Use {{variableName}} for dynamic content"
              />

              {/* Notification Type */}
              <ValidatedField
                label="Notification Type"
                name="notificationType"
                type="select"
                value={formData.notificationType}
                onChange={handleChange}
                onBlur={handleBlur}
                validationRule={validationRules.notificationType}
                error={errors.notificationType}
                touched={touched.notificationType}
                required
                options={[
                  { value: 'INFO', label: 'Info' },
                  { value: 'WARNING', label: 'Warning' },
                  { value: 'ERROR', label: 'Error' },
                  { value: 'SUCCESS', label: 'Success' }
                ]}
              />

              {/* Description */}
              <ValidatedField
                label="Description"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                validationRule={validationRules.description}
                error={errors.description}
                touched={touched.description}
                placeholder="Optional description of this template"
                maxLength={500}
                rows={2}
              />

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => handleChange('active', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                    reset();
                  }}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Preview Template: {previewTemplate.name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Test Variables (JSON)
                </label>
                <textarea
                  value={JSON.stringify(previewVariables, null, 2)}
                  onChange={(e) => {
                    try {
                      setPreviewVariables(JSON.parse(e.target.value));
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder='{"deviceName": "Test Device", "userName": "John Doe"}'
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handlePreviewTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
