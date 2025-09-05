import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, AlertCircle, Info, Plus, Edit, Trash2, Filter, Search } from 'lucide-react';
import { deviceSafetyPrecautionsAPI } from '../../services/api';
import { unifiedOnboardingService } from '../../services/unifiedOnboardingService';
import Button from '../UI/Button';
import { SafetyForm } from '../Forms/SafetyForm';
import { logInfo, logError, logWarn } from '../../utils/logger';

interface DeviceSafetyPrecaution {
  id: string;
  deviceId: string;
  title: string;
  description: string;
  type: 'warning' | 'procedure' | 'caution' | 'note';
  category: string;
  precautionType: 'electrical' | 'mechanical' | 'chemical' | 'environmental' | 'general';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction?: string;
  aboutReaction?: string;
  causes?: string;
  howToAvoid?: string;
  safetyInfo?: string;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface DeviceSafetyInfoProps {
  deviceId: string;
}

const DeviceSafetyInfo: React.FC<DeviceSafetyInfoProps> = ({ deviceId }) => {
  const [safetyPrecautions, setSafetyPrecautions] = useState<DeviceSafetyPrecaution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPrecaution, setEditingPrecaution] = useState<DeviceSafetyPrecaution | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSafetyPrecautions();
  }, [deviceId]);

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const truncateText = (text: string, limit: number = 40) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  const loadSafetyPrecautions = async () => {
    try {
      setLoading(true);
      logInfo('DeviceSafetyInfo', 'Loading safety precautions for device', { deviceId });
      
      // Use device safety precautions API to get safety precautions for this specific device
      const safetyResponse = await deviceSafetyPrecautionsAPI.getByDevice(deviceId);
      
      const safetyData = safetyResponse.data || [];
      
      // Transform the data to match the expected format
      const transformedPrecautions: DeviceSafetyPrecaution[] = safetyData.map((precaution: any) => {
        const transformed = {
          id: precaution.id || precaution.safety_id || `safety_${Math.random()}`,
          deviceId: precaution.deviceId || deviceId,
          title: precaution.title || 'Unnamed Safety Precaution',
          description: precaution.description || 'No description available',
          type: precaution.type || 'warning',
          category: precaution.category || 'general',
          severity: precaution.severity || 'MEDIUM',
          recommendedAction: precaution.recommendedAction || precaution.recommended_action,
          aboutReaction: precaution.aboutReaction || precaution.about_reaction,
          causes: precaution.causes,
          howToAvoid: precaution.howToAvoid || precaution.how_to_avoid,
          safetyInfo: precaution.safetyInfo || precaution.safety_info,
          isActive: precaution.isActive !== false, // Default to true
          organizationId: precaution.organizationId || 'default',
          createdAt: precaution.createdAt || precaution.created_at || new Date().toISOString(),
          updatedAt: precaution.updatedAt || precaution.updated_at || new Date().toISOString()
        };
        
        return transformed;
      });
      
      setSafetyPrecautions(transformedPrecautions);
      setError(null);
      
      logInfo('DeviceSafetyInfo', 'Safety precautions loaded successfully', { 
        deviceId, 
        precautionsCount: transformedPrecautions.length,
        fieldsWithData: {
          aboutReaction: transformedPrecautions.filter(p => p.aboutReaction).length,
          causes: transformedPrecautions.filter(p => p.causes).length,
          howToAvoid: transformedPrecautions.filter(p => p.howToAvoid).length,
          safetyInfo: transformedPrecautions.filter(p => p.safetyInfo).length
        }
      });
    } catch (err) {
      logError('DeviceSafetyInfo', 'Error loading safety precautions', err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error loading safety precautions:', err);
      setError('Failed to load safety precautions');
      setSafetyPrecautions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'procedure':
        return <Shield className="w-5 h-5 text-blue-500" />;
      case 'caution':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'note':
        return <Info className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'thermal_hazard':
        return 'bg-red-50 border-red-200';
      case 'electrical_hazard':
        return 'bg-yellow-50 border-yellow-200';
      case 'mechanical_hazard':
        return 'bg-orange-50 border-orange-200';
      case 'emergency_procedures':
        return 'bg-blue-50 border-blue-200';
      case 'ppe_requirements':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const filteredPrecautions = safetyPrecautions.filter(precaution => {
    const matchesType = filterType === 'all' || precaution.type === filterType;
    const matchesCategory = filterCategory === 'all' || precaution.category === filterCategory;
    const matchesSearch = precaution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         precaution.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (precaution.aboutReaction && precaution.aboutReaction.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (precaution.causes && precaution.causes.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (precaution.howToAvoid && precaution.howToAvoid.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (precaution.safetyInfo && precaution.safetyInfo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesCategory && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this safety precaution?')) {
      try {
        await deviceSafetyPrecautionsAPI.delete(id);
        await loadSafetyPrecautions();
      } catch (err) {
        console.error('Error deleting safety precaution:', err);
        setError('Failed to delete safety precaution');
      }
    }
  };

  const handleToggleActive = async (precaution: DeviceSafetyPrecaution) => {
    try {
      await deviceSafetyPrecautionsAPI.update(precaution.id, {
        ...precaution,
        isActive: !precaution.isActive
      });
      await loadSafetyPrecautions();
    } catch (err) {
      console.error('Error updating safety precaution:', err);
      setError('Failed to update safety precaution');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading safety precautions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button
            onClick={loadSafetyPrecautions}
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
          <h3 className="text-lg font-semibold text-gray-900">Safety Information</h3>
          <p className="text-sm text-gray-600">
            {safetyPrecautions.length} safety precaution{safetyPrecautions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Safety Info
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="warning">Warnings</option>
            <option value="procedure">Procedures</option>
            <option value="caution">Cautions</option>
            <option value="note">Notes</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            <option value="thermal_hazard">Thermal Hazard</option>
            <option value="electrical_hazard">Electrical Hazard</option>
            <option value="mechanical_hazard">Mechanical Hazard</option>
            <option value="emergency_procedures">Emergency Procedures</option>
            <option value="ppe_requirements">PPE Requirements</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search safety precautions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Safety Precautions List */}
      <div className="space-y-4">
        {filteredPrecautions.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No safety precautions found</h3>
            <p className="text-gray-500 mb-4">
              {safetyPrecautions.length === 0 
                ? "This device doesn't have any safety precautions yet."
                : "No precautions match your current filters."
              }
            </p>
            {safetyPrecautions.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Safety Precaution
              </button>
            )}
          </div>
        ) : (
          filteredPrecautions.map((precaution) => (
            <div
              key={precaution.id}
              className={`p-4 rounded-lg border ${getCategoryColor(precaution.category)} ${
                !precaution.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getTypeIcon(precaution.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{precaution.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(precaution.severity)}`}>
                        {precaution.severity}
                      </span>
                      {!precaution.isActive && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{precaution.description}</p>
                    
                    {/* Enhanced Safety Information Display */}
                    {precaution.aboutReaction && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>About Reaction:</strong> {precaution.aboutReaction}
                      </div>
                    )}
                    
                    {precaution.causes && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Causes:</strong> {precaution.causes}
                      </div>
                    )}
                    
                    {precaution.howToAvoid && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>How to Avoid:</strong> {precaution.howToAvoid}
                      </div>
                    )}
                    
                    {precaution.safetyInfo && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Safety Information:</strong> {precaution.safetyInfo}
                      </div>
                    )}
                    
                    {precaution.recommendedAction && (
                      <div className="text-sm text-gray-600">
                        <strong>Recommended Action:</strong> {precaution.recommendedAction}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>Type: {precaution.type}</span>
                      <span>Category: {precaution.category.replace('_', ' ')}</span>
                      <span>Created: {new Date(precaution.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(precaution)}
                    className={`p-1 rounded ${
                      precaution.isActive 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={precaution.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingPrecaution(precaution)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(precaution.id)}
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
      
      {/* Safety Form Modal */}
      {showAddForm && (
        <SafetyForm
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          deviceId={deviceId}
          onSubmit={async (safetyData) => {
            try {
              await deviceSafetyPrecautionsAPI.create(safetyData);
              await loadSafetyPrecautions();
              setShowAddForm(false);
            } catch (err) {
              console.error('Error creating safety precaution:', err);
              setError('Failed to create safety precaution');
            }
          }}
        />
      )}
      
      {editingPrecaution && (
        <SafetyForm
          isOpen={!!editingPrecaution}
          onClose={() => setEditingPrecaution(null)}
          safety={editingPrecaution}
          deviceId={deviceId}
          onSubmit={async (safetyData) => {
            try {
              await deviceSafetyPrecautionsAPI.update(editingPrecaution.id, safetyData);
              await loadSafetyPrecautions();
              setEditingPrecaution(null);
            } catch (err) {
              console.error('Error updating safety precaution:', err);
              setError('Failed to update safety precaution');
            }
          }}
        />
      )}
    </div>
  );
};

export default DeviceSafetyInfo;
