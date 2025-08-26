import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Search, 
  Filter, 
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';
import { getApiConfig } from '../config/api';

interface SafetyPrecaution {
  id: string;
  deviceId: string;
  deviceName?: string;
  title: string;
  description: string;
  type: 'warning' | 'procedure' | 'caution' | 'note';
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction?: string;
  aboutReaction?: string;
  causes?: string;
  howToAvoid?: string;
  safetyInfo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SafetyFormData {
  title: string;
  description: string;
  type: 'warning' | 'procedure' | 'caution' | 'note';
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
  aboutReaction: string;
  causes: string;
  howToAvoid: string;
  safetyInfo: string;
}

const SafetyPage: React.FC = () => {
  const navigate = useNavigate();
  const [safetyPrecautions, setSafetyPrecautions] = useState<SafetyPrecaution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'warning' | 'procedure' | 'caution' | 'note'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPrecaution, setEditingPrecaution] = useState<SafetyPrecaution | null>(null);
  const [formData, setFormData] = useState<SafetyFormData>({
    title: '',
    description: '',
    type: 'warning',
    category: '',
    severity: 'MEDIUM',
    recommendedAction: '',
    aboutReaction: '',
    causes: '',
    howToAvoid: '',
    safetyInfo: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const typeOptions = [
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-red-600 bg-red-50/80' },
    { value: 'procedure', label: 'Procedure', icon: Info, color: 'text-blue-600 bg-blue-50/80' },
    { value: 'caution', label: 'Caution', icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50/80' },
    { value: 'note', label: 'Note', icon: Info, color: 'text-green-600 bg-green-50/80' }
  ];

  const severityOptions = [
    { value: 'LOW', label: 'Low', color: 'text-green-600 bg-green-50/80' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600 bg-yellow-50/80' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600 bg-orange-50/80' },
    { value: 'CRITICAL', label: 'Critical', color: 'text-red-600 bg-red-50/80' }
  ];

  const categoryOptions = [
    'thermal_hazard',
    'electrical_hazard', 
    'mechanical_hazard',
    'emergency_procedures',
    'ppe_requirements',
    'general_safety'
  ];

  // Fetch safety precautions with polling
  const fetchSafetyPrecautions = async () => {
    try {
      setError(null);
      
      // Get AI-generated safety precautions from PDF results
      const aiSafetyResponse = await fetch(`${getApiConfig().BACKEND_BASE_URL}/api/devices/pdf-results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      let aiSafety: any[] = [];
      if (aiSafetyResponse.ok) {
        const aiData = await aiSafetyResponse.json();
        aiSafety = aiData.safetyPrecautions || [];
        console.log('AI-generated safety precautions found:', aiSafety.length);
      }

      // Also fetch manually created safety precautions
      const manualSafetyResponse = await fetch(`${getApiConfig().BACKEND_BASE_URL}/api/device-safety-precautions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      let manualSafety: any[] = [];
      if (manualSafetyResponse.ok) {
        manualSafety = await manualSafetyResponse.json();
        console.log('Manual safety precautions found:', manualSafety.length);
      }

      // Combine both types of safety precautions
      const allSafety = [...aiSafety, ...manualSafety];
      setSafetyPrecautions(allSafety);
      
      console.log('Total safety precautions loaded:', allSafety.length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch safety precautions');
      console.error('Error fetching safety precautions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafetyPrecautions();
    
    // Poll for updates every 60 seconds
    const interval = setInterval(fetchSafetyPrecautions, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter precautions based on search, type, and severity
  const filteredPrecautions = safetyPrecautions.filter(precaution => {
    const matchesSearch = precaution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         precaution.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         precaution.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || precaution.type === filterType;
    const matchesSeverity = filterSeverity === 'all' || precaution.severity === filterSeverity;
    return matchesSearch && matchesType && matchesSeverity;
  });

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Implementation for creating/updating safety precautions
      console.log('Submitting safety precaution:', formData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'warning',
        category: '',
        severity: 'MEDIUM',
        recommendedAction: '',
        aboutReaction: '',
        causes: '',
        howToAvoid: '',
        safetyInfo: ''
      });
      
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingPrecaution(null);
      
      // Refresh data
      fetchSafetyPrecautions();
    } catch (error) {
      console.error('Error submitting safety precaution:', error);
    }
  };

  const handleEdit = (precaution: SafetyPrecaution) => {
    setEditingPrecaution(precaution);
    setFormData({
      title: precaution.title,
      description: precaution.description,
      type: precaution.type,
      category: precaution.category,
      severity: precaution.severity,
      recommendedAction: precaution.recommendedAction || '',
      aboutReaction: precaution.aboutReaction || '',
      causes: precaution.causes || '',
      howToAvoid: precaution.howToAvoid || '',
      safetyInfo: precaution.safetyInfo || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this safety precaution?')) {
      try {
        // Implementation for deleting safety precaution
        console.log('Deleting safety precaution:', id);
        fetchSafetyPrecautions();
      } catch (error) {
        console.error('Error deleting safety precaution:', error);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(opt => opt.value === type);
    return option ? option.icon : AlertTriangle;
  };

  const getSeverityColor = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option ? option.color : 'text-gray-600 bg-gray-50/80';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
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
          <h1 className="text-2xl font-bold text-gray-900">Safety Precautions</h1>
          <p className="text-gray-600 mt-1">
            Manage device safety precautions and guidelines
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Safety Precaution
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Precautions</p>
              <p className="text-xl font-semibold text-gray-900">{safetyPrecautions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-xl font-semibold text-gray-900">
                {safetyPrecautions.filter(p => p.severity === 'CRITICAL').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-xl font-semibold text-gray-900">
                {safetyPrecautions.filter(p => p.severity === 'HIGH').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Info className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-semibold text-gray-900">
                {safetyPrecautions.filter(p => p.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search safety precautions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Severities</option>
              {severityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Safety Precautions Grid */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {filteredPrecautions.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No safety precautions found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' || filterSeverity !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first safety precaution'
            }
          </p>
          {!searchTerm && filterType === 'all' && filterSeverity === 'all' && (
            <Button onClick={() => setShowAddModal(true)}>
              Add Safety Precaution
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrecautions.map((precaution) => {
            const TypeIcon = getTypeIcon(precaution.type);
            return (
              <div key={precaution.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <TypeIcon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{precaution.title}</h3>
                        <p className="text-sm text-gray-600">{precaution.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(precaution)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(precaution.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">{precaution.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(precaution.severity)}`}>
                      {precaution.severity}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(precaution.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <Modal
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditingPrecaution(null);
          }}
          title={showAddModal ? 'Add Safety Precaution' : 'Edit Safety Precaution'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter safety precaution title"
              />
              {formErrors.title && (
                <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter safety precaution description"
              />
              {formErrors.description && (
                <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {severityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {categoryOptions.map(category => (
                  <option key={category} value={category}>{category.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
              {formErrors.category && (
                <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingPrecaution(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {showAddModal ? 'Add Safety Precaution' : 'Update Safety Precaution'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SafetyPage;
