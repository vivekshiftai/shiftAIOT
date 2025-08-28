import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare,
  Mail,
  Phone,
  MessageSquare as MessageCircle,
  Zap,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { conversationConfigAPI } from '../../services/api';
import Button from '../UI/Button';
import Modal from '../UI/Modal';


interface ConversationConfig {
  id: string;
  platformName: string;
  platformType: string;
  credentials: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConversationConfigForm {
  platformName: string;
  platformType: string;
  credentials: Record<string, any>;
  isActive: boolean;
}

const platformOptions = [
  { value: 'slack', label: 'Slack', icon: MessageSquare, color: 'text-purple-600' },
  { value: 'gmail', label: 'Gmail', icon: Mail, color: 'text-red-600' },
  { value: 'teams', label: 'Microsoft Teams', icon: MessageCircle, color: 'text-blue-600' },
  { value: 'google_chat', label: 'Google Chat', icon: MessageSquare, color: 'text-green-600' },
  { value: 'sms', label: 'SMS', icon: Phone, color: 'text-gray-600' }
];

const credentialFields = {
  slack: [
    { key: 'token', label: 'Bot Token', type: 'password', required: true },
    { key: 'channel', label: 'Channel ID', type: 'text', required: true }
  ],
  gmail: [
    { key: 'token', label: 'Access Token', type: 'password', required: true },
    { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: true }
  ],
  teams: [
    { key: 'webhook_url', label: 'Webhook URL', type: 'text', required: true }
  ],
  google_chat: [
    { key: 'webhook_url', label: 'Webhook URL', type: 'text', required: true }
  ],
  sms: [
    { key: 'api_key', label: 'API Key', type: 'password', required: true },
    { key: 'phone_number', label: 'Phone Number', type: 'text', required: true }
  ]
};

export const ConversationConfigTab: React.FC = () => {
  const [configs, setConfigs] = useState<ConversationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConversationConfig | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState<ConversationConfigForm>({
    platformName: '',
    platformType: '',
    credentials: {},
    isActive: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch configurations
  const fetchConfigs = async () => {
    try {
      setError(null);
      const response = await conversationConfigAPI.getAll();
      setConfigs(response.data || []);
    } catch (err: any) {
      // Don't show error for 401 authentication issues
      if (err.response?.status === 401) {
        console.warn('Conversation configs not available due to authentication');
        setConfigs([]);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch configurations');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.platformName.trim()) {
      errors.platformName = 'Platform name is required';
    }
    
    if (!formData.platformType) {
      errors.platformType = 'Platform type is required';
    }

    // Validate required credentials
    const fields = credentialFields[formData.platformType as keyof typeof credentialFields] || [];
    fields.forEach(field => {
      if (field.required && !formData.credentials[field.key]) {
        errors[`credential_${field.key}`] = `${field.label} is required`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingConfig) {
        await conversationConfigAPI.update(editingConfig.id, formData);
      } else {
        await conversationConfigAPI.create(formData);
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingConfig(null);
      resetForm();
      fetchConfigs();
    } catch (err: any) {
      // Don't show authentication errors - let the user continue using the app
      if (err.response?.status === 401) {
        console.warn('Authentication error in ConversationConfigTab, but not showing to user');
      } else {
        setError(err.response?.data?.message || 'Failed to save configuration');
      }
    }
  };

  // Handle delete
  const handleDelete = async (configId: string) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      await conversationConfigAPI.delete(configId);
      fetchConfigs();
    } catch (err: any) {
      // Don't show authentication errors - let the user continue using the app
      if (err.response?.status === 401) {
        console.warn('Authentication error in ConversationConfigTab delete, but not showing to user');
      } else {
        setError(err.response?.data?.message || 'Failed to delete configuration');
      }
    }
  };

  // Handle edit
  const handleEdit = (config: ConversationConfig) => {
    setEditingConfig(config);
    setFormData({
      platformName: config.platformName,
      platformType: config.platformType,
      credentials: config.credentials,
      isActive: config.isActive
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      platformName: '',
      platformType: '',
      credentials: {},
      isActive: true
    });
    setFormErrors({});
  };

  // Get platform icon
  const getPlatformIcon = (platformType: string) => {
    const platform = platformOptions.find(p => p.value === platformType);
    return platform?.icon || MessageSquare;
  };

  // Get platform color
  const getPlatformColor = (platformType: string) => {
    const platform = platformOptions.find(p => p.value === platformType);
    return platform?.color || 'text-gray-600';
  };

  // Toggle credential visibility
  const toggleCredentialVisibility = (configId: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold gradient-text">Conversation Platforms</h3>
          <p className="text-secondary mt-1">Configure communication platforms for notifications and alerts</p>
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
          Add Platform
        </Button>
      </div>



      {/* Configurations List */}
      <div className="space-y-4">
        {configs.map((config) => {
          const Icon = getPlatformIcon(config.platformType);
          const color = getPlatformColor(config.platformType);
          
          return (
            <div key={config.id} className="card p-6 hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">{config.platformName}</h4>
                    <p className="text-secondary text-sm capitalize">{config.platformType.replace('_', ' ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        config.isActive 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-gray-600 bg-gray-50'
                      }`}>
                        {config.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCredentialVisibility(config.id)}
                  >
                    {showCredentials[config.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(config)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                    className="text-error-500 hover:text-error-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {showCredentials[config.id] && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-primary mb-2">Credentials</h5>
                  <div className="space-y-2">
                    {Object.entries(config.credentials).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-secondary font-medium">{key}:</span>
                        <span className="text-primary font-mono">
                          {typeof value === 'string' && value.length > 20 
                            ? `${value.substring(0, 20)}...` 
                            : String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-tertiary mt-4">
                <span>Created: {new Date(config.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(config.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {configs.length === 0 && !loading && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No conversation platforms configured</h3>
          <p className="text-secondary mb-4">
            Add your first communication platform to start receiving notifications
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            Add First Platform
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingConfig(null);
          resetForm();
        }}
        title={editingConfig ? "Edit Platform Configuration" : "Add Platform Configuration"}
        size="lg"
      >
        <div className="space-y-6 bg-secondary p-6 rounded-lg">
          {/* Platform Name */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Platform Name *
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData(prev => ({ ...prev, platformName: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white ${
                formErrors.platformName ? 'border-error-500' : 'border-light'
              }`}
              placeholder="e.g., Production Slack, Team Gmail"
            />
            {formErrors.platformName && (
              <p className="text-error-500 text-sm mt-1">{formErrors.platformName}</p>
            )}
          </div>

          {/* Platform Type */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Platform Type *
            </label>
            <select
              value={formData.platformType}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  platformType: e.target.value,
                  credentials: {} // Reset credentials when platform changes
                }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white ${
                formErrors.platformType ? 'border-error-500' : 'border-light'
              }`}
            >
              <option value="">Select Platform</option>
              {platformOptions.map(platform => {
                const Icon = platform.icon;
                return (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                );
              })}
            </select>
            {formErrors.platformType && (
              <p className="text-error-500 text-sm mt-1">{formErrors.platformType}</p>
            )}
          </div>

          {/* Credentials */}
          {formData.platformType && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Credentials
              </label>
              <div className="space-y-4">
                {credentialFields[formData.platformType as keyof typeof credentialFields]?.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-secondary mb-1">
                      {field.label} {field.required && '*'}
                    </label>
                    <input
                      type={field.type}
                      value={formData.credentials[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        credentials: {
                          ...prev.credentials,
                          [field.key]: e.target.value
                        }
                      }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white ${
                        formErrors[`credential_${field.key}`] ? 'border-error-500' : 'border-light'
                      }`}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                    {formErrors[`credential_${field.key}`] && (
                      <p className="text-error-500 text-sm mt-1">{formErrors[`credential_${field.key}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 text-primary-500 border-light rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-primary">
              Active (Enable this configuration)
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditingConfig(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            {editingConfig ? 'Update Configuration' : 'Add Configuration'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
