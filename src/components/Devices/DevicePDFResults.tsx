import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Shield, 
  AlertTriangle, 
  Wrench, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '../Loading/LoadingComponents';

interface DevicePDFResultsProps {
  deviceId: string;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
}

interface DeviceMaintenance {
  id: string;
  taskName: string;
  componentName: string;
  maintenanceType: string;
  frequency: string;
  nextMaintenance: string;
  description: string;
  priority: string;
  status: string;
}

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
  mitigation?: string;
  aboutReaction?: string;
  causes?: string;
  howToAvoid?: string;
  safetyInfo?: string;
  isActive: boolean;
  organizationId: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PDFResultsData {
  device: any;
  rules: Rule[];
  maintenance: DeviceMaintenance[];
  safetyPrecautions: DeviceSafetyPrecaution[];
}

export const DevicePDFResults: React.FC<DevicePDFResultsProps> = ({ deviceId }) => {
  const [data, setData] = useState<PDFResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'maintenance' | 'safety'>('rules');

  useEffect(() => {
    fetchPDFResults();
  }, [deviceId]);

  const fetchPDFResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devices/${deviceId}/pdf-results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF results');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Error Loading PDF Results</h3>
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">No PDF Results Available</h3>
        <p className="text-slate-600">This device doesn't have any PDF processing results yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">AI-Generated Device Intelligence</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-slate-700">{data.rules.length} IoT Rules</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <span className="text-slate-700">{data.maintenance.length} Maintenance Items</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-slate-700">{data.safetyPrecautions.length} Safety Precautions</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-slate-700">AI Processed</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'rules' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          Rules ({data.rules.length})
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'maintenance' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Maintenance ({data.maintenance.length})
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'safety' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Safety ({data.safetyPrecautions.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {activeTab === 'rules' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">IoT Monitoring Rules</h3>
            {data.rules.length === 0 ? (
              <p className="text-slate-600">No rules generated for this device.</p>
            ) : (
              <div className="space-y-4">
                {data.rules.map((rule) => (
                  <div key={rule.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-slate-800">{rule.name}</h4>
                          <p className="text-sm text-slate-600">{rule.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${
                          rule.active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Created: {new Date(rule.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Maintenance Schedule</h3>
            {data.maintenance.length === 0 ? (
              <p className="text-slate-600">No maintenance schedule generated for this device.</p>
            ) : (
              <div className="space-y-4">
                {data.maintenance.map((item) => (
                  <div key={item.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-orange-600" />
                        <div>
                          <h4 className="font-semibold text-slate-800">{item.taskName}</h4>
                          <p className="text-sm text-slate-600">{item.componentName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Frequency: {item.frequency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Next: {new Date(item.nextMaintenance).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Safety Precautions</h3>
            {data.safetyPrecautions.length === 0 ? (
              <p className="text-slate-600">No safety precautions generated for this device.</p>
            ) : (
              <div className="space-y-4">
                {data.safetyPrecautions.map((item) => (
                  <div key={item.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <h4 className="font-semibold text-slate-800">{item.title}</h4>
                          <p className="text-sm text-slate-600">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-700">{item.description}</p>
                      {item.recommendedAction && (
                        <div>
                          <span className="font-medium text-slate-700">Recommended Action:</span>
                          <p className="text-slate-600">{item.recommendedAction}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
