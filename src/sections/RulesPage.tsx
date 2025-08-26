import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ruleAPI, maintenanceAPI, deviceSafetyPrecautionsAPI } from '../services/api';
import { handleAuthError } from '../utils/authUtils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Shield,
  Target,
  Wrench
} from 'lucide-react';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';
import { RuleForm } from '../components/Forms';
import { getApiConfig } from '../config/api';

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
  type: string;
  priority: string;
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

interface MaintenanceTask {
  id: string;
  taskName: string;
  description?: string;
  deviceId: string;
  deviceName: string;
  frequency: string;
  lastMaintenance?: string;
  nextMaintenance: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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

type TabType = 'rules' | 'maintenance' | 'safety';

const RulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('rules');
  
  // Rules state
  const [rules, setRules] = useState<Rule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  
  // Maintenance state
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceTask | null>(null);
  
  // Safety state
  const [safetyPrecautions, setSafetyPrecautions] = useState<SafetyPrecaution[]>([]);
  const [safetyLoading, setSafetyLoading] = useState(true);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [editingSafety, setEditingSafety] = useState<SafetyPrecaution | null>(null);
  
  // Common state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { user } = useAuth();

  // Fetch all data
  const fetchAllData = async () => {
    if (!user) {
      console.warn('No user authenticated, skipping data fetch');
      return;
    }

    try {
      // Fetch rules data
      try {
        const rulesResponse = await ruleAPI.getAll();
        const rulesData = rulesResponse.data || [];
        setRules(rulesData);
        console.log('Total rules loaded:', rulesData.length);
      } catch (err) {
        console.error('Error fetching rules:', err);
        setRulesError('Failed to fetch rules');
      }

      // Fetch maintenance data
      try {
        const maintenanceResponse = await maintenanceAPI.getAll();
        const maintenanceData = maintenanceResponse.data || [];
        setMaintenanceTasks(maintenanceData);
        console.log('Total maintenance tasks loaded:', maintenanceData.length);
      } catch (err) {
        console.error('Error fetching maintenance:', err);
        setMaintenanceError('Failed to fetch maintenance');
      }

      // Fetch safety precautions data
      try {
        // Get all devices first to fetch safety precautions for each
        const devicesResponse = await fetch(`${getApiConfig().BACKEND_BASE_URL}/api/devices`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (devicesResponse.ok) {
          const devices = await devicesResponse.json();
          let allSafetyPrecautions: any[] = [];
          
          // Fetch safety precautions for each device
          for (const device of devices) {
            try {
              const safetyResponse = await deviceSafetyPrecautionsAPI.getAllByDevice(device.id);
              const deviceSafety = safetyResponse.data || [];
              allSafetyPrecautions = [...allSafetyPrecautions, ...deviceSafety];
            } catch (err) {
              console.warn(`Error fetching safety precautions for device ${device.id}:`, err);
            }
          }
          
          setSafetyPrecautions(allSafetyPrecautions);
          console.log('Total safety precautions loaded:', allSafetyPrecautions.length);
        }
      } catch (err) {
        console.error('Error fetching safety precautions:', err);
        setSafetyError('Failed to fetch safety precautions');
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setRulesError('Failed to fetch rules');
      setMaintenanceError('Failed to fetch maintenance');
      setSafetyError('Failed to fetch safety precautions');
    } finally {
      setRulesLoading(false);
      setMaintenanceLoading(false);
      setSafetyLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter functions
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && rule.isActive) ||
                         (filterStatus === 'inactive' && !rule.isActive);
    return matchesSearch && matchesStatus;
  });

  const filteredMaintenance = maintenanceTasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && task.status !== 'completed') ||
                         (filterStatus === 'inactive' && task.status === 'completed');
    return matchesSearch && matchesStatus;
  });

  const filteredSafety = safetyPrecautions.filter(precaution => {
    const matchesSearch = precaution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         precaution.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && precaution.isActive) ||
                         (filterStatus === 'inactive' && !precaution.isActive);
    return matchesSearch && matchesStatus;
  });

  // Handle rule operations
  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setShowRuleModal(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await ruleAPI.delete(ruleId);
      fetchAllData();
    } catch (err: any) {
      console.error('Error deleting rule:', err);
    }
  };

  // Handle maintenance operations
  const handleEditMaintenance = (task: MaintenanceTask) => {
    setEditingMaintenance(task);
    setShowMaintenanceModal(true);
  };

  const handleDeleteMaintenance = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this maintenance task?')) return;
    
    try {
      await maintenanceAPI.delete(taskId);
      fetchAllData();
    } catch (err: any) {
      console.error('Error deleting maintenance task:', err);
    }
  };

  // Handle safety operations
  const handleEditSafety = (precaution: SafetyPrecaution) => {
    setEditingSafety(precaution);
    setShowSafetyModal(true);
  };

  const handleDeleteSafety = async (precautionId: string) => {
    if (!window.confirm('Are you sure you want to delete this safety precaution?')) return;
    
    try {
      await deviceSafetyPrecautionsAPI.delete(precautionId);
      fetchAllData();
    } catch (err: any) {
      console.error('Error deleting safety precaution:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRulesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Automation Rules</h2>
          <p className="text-gray-600">Manage IoT automation rules</p>
        </div>
        <Button
          onClick={() => {
            setEditingRule(null);
            setShowRuleModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </div>

      {rulesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{rulesError}</p>
        </div>
      )}

      {rulesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rules found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first automation rule to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button onClick={() => setShowRuleModal(true)}>
              Create First Rule
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {rule.description && (
                <p className="text-gray-600 text-sm mb-4">{rule.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{rule.type || 'General'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium text-gray-900 capitalize">{rule.priority || 'Medium'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Tasks</h2>
          <p className="text-gray-600">Manage device maintenance schedules</p>
        </div>
        <Button
          onClick={() => {
            setEditingMaintenance(null);
            setShowMaintenanceModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Maintenance
        </Button>
      </div>

      {maintenanceError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{maintenanceError}</p>
        </div>
      )}

      {maintenanceLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      ) : filteredMaintenance.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance tasks found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first maintenance task to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button onClick={() => setShowMaintenanceModal(true)}>
              Create First Maintenance Task
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaintenance.map((task) => (
            <div key={task.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <h3 className="font-semibold text-gray-900">{task.taskName}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditMaintenance(task)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMaintenance(task.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {task.description && (
                <p className="text-gray-600 text-sm mb-4">{task.description}</p>
              )}
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Next:</span>
                  <span className="font-medium text-gray-900">{new Date(task.nextMaintenance).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium text-gray-900 capitalize">{task.frequency}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-gray-600">Priority:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSafetyTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Safety Precautions</h2>
          <p className="text-gray-600">Manage device safety guidelines</p>
        </div>
        <Button
          onClick={() => {
            setEditingSafety(null);
            setShowSafetyModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Safety Precaution
        </Button>
      </div>

      {safetyError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{safetyError}</p>
        </div>
      )}

      {safetyLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      ) : filteredSafety.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No safety precautions found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first safety precaution to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button onClick={() => setShowSafetyModal(true)}>
              Create First Safety Precaution
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSafety.map((precaution) => (
            <div key={precaution.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${precaution.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <h3 className="font-semibold text-gray-900">{precaution.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSafety(precaution)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSafety(precaution.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{precaution.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 capitalize">{precaution.type}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-gray-600">Severity:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(precaution.severity)}`}>
                    {precaution.severity}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-900 capitalize">{precaution.category.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created: {new Date(precaution.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(precaution.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600">Manage rules, maintenance, and safety precautions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Rules ({rules.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Maintenance ({maintenanceTasks.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'safety'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety ({safetyPrecautions.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && renderRulesTab()}
      {activeTab === 'maintenance' && renderMaintenanceTab()}
      {activeTab === 'safety' && renderSafetyTab()}

      {/* Rule Modal */}
      {showRuleModal && (
        <RuleForm
          isOpen={showRuleModal}
          onClose={() => {
            setShowRuleModal(false);
            setEditingRule(null);
          }}
          rule={editingRule || undefined}
          onSubmit={async (ruleData) => {
            try {
              if (editingRule) {
                await ruleAPI.update(editingRule.id, ruleData);
              } else {
                await ruleAPI.create(ruleData);
              }
              setShowRuleModal(false);
              setEditingRule(null);
              fetchAllData();
            } catch (error) {
              console.error('Failed to save rule:', error);
            }
          }}
        />
      )}

      {/* Maintenance Modal - Placeholder for now */}
      {showMaintenanceModal && (
        <Modal
          isOpen={showMaintenanceModal}
          onClose={() => {
            setShowMaintenanceModal(false);
            setEditingMaintenance(null);
          }}
          title={editingMaintenance ? 'Edit Maintenance Task' : 'Add Maintenance Task'}
        >
          <div className="p-6">
            <p className="text-gray-600">Maintenance form will be implemented here.</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setEditingMaintenance(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                setShowMaintenanceModal(false);
                setEditingMaintenance(null);
              }}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Safety Modal - Placeholder for now */}
      {showSafetyModal && (
        <Modal
          isOpen={showSafetyModal}
          onClose={() => {
            setShowSafetyModal(false);
            setEditingSafety(null);
          }}
          title={editingSafety ? 'Edit Safety Precaution' : 'Add Safety Precaution'}
        >
          <div className="p-6">
            <p className="text-gray-600">Safety precaution form will be implemented here.</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSafetyModal(false);
                  setEditingSafety(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                setShowSafetyModal(false);
                setEditingSafety(null);
              }}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RulesPage;
