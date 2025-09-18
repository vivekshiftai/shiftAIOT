import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useIoT } from '../contexts/IoTContext';
import { ruleAPI, maintenanceAPI, deviceSafetyPrecautionsAPI, maintenanceSchedulerAPI } from '../services/api';
import { logInfo, logError, logWarn } from '../utils/logger';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Clock,
  Shield,
  Zap,
  Wrench
} from 'lucide-react';
import Button from '../components/UI/Button';

import Skeleton from '../components/UI/Skeleton';
import { RuleForm, MaintenanceForm, SafetyForm } from '../components/Forms';
import { Rule, MaintenanceTask, DeviceSafetyPrecaution } from '../types';





type TabType = 'rules' | 'maintenance' | 'safety';

const RulesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get active tab from URL or default to 'rules'
  const getActiveTabFromURL = (): TabType => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as TabType;
    return tab && ['rules', 'maintenance', 'safety'].includes(tab) ? tab : 'rules';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getActiveTabFromURL());
  
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
  const [safetyPrecautions, setSafetyPrecautions] = useState<DeviceSafetyPrecaution[]>([]);
  const [safetyLoading, setSafetyLoading] = useState(true);
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [editingSafety, setEditingSafety] = useState<DeviceSafetyPrecaution | null>(null);
  
  // Scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  
  // Common state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { user } = useAuth();
  const { devices } = useIoT();

  // Helper function to get device name by device ID
  const getDeviceName = (deviceId: string | undefined): string => {
    if (!deviceId) return 'N/A';
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : 'Unknown Device';
  };

  // Update URL when tab changes
  const updateTabInURL = (tab: TabType) => {
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  // Sync URL with active tab
  useEffect(() => {
    const urlTab = getActiveTabFromURL();
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [location.search]);

  // Initialize URL if no tab parameter is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.get('tab')) {
      updateTabInURL('rules');
    }
  }, []);

  // Fetch all data
  const fetchAllData = async () => {
    if (!user) {
      logWarn('RulesPage', 'No user authenticated, skipping data fetch');
      return;
    }

    try {
      // Fetch rules data
      try {
        const rulesResponse = await ruleAPI.getAll();
        const rulesData = rulesResponse.data || [];
        setRules(rulesData);
        logInfo('RulesPage', 'Total rules loaded', { count: rulesData.length });
      } catch (err) {
        logError('RulesPage', 'Error fetching rules', err instanceof Error ? err : new Error('Unknown error'));
        setRulesError('Failed to fetch rules');
      }

      // Fetch maintenance data
      try {
        const maintenanceResponse = await maintenanceAPI.getAll();
        const maintenanceData = maintenanceResponse.data || [];
        setMaintenanceTasks(maintenanceData);
        logInfo('RulesPage', 'Total maintenance tasks loaded', { count: maintenanceData.length });
        logInfo('RulesPage', 'Sample maintenance task data', maintenanceData[0] ? {
          id: maintenanceData[0].id,
          taskName: maintenanceData[0].taskName,
          deviceName: maintenanceData[0].deviceName,
          deviceId: maintenanceData[0].deviceId,
          description: maintenanceData[0].description
        } : 'No maintenance tasks found');
        
        // Check if any maintenance tasks have missing device names and update them
        const hasMissingDeviceNames = maintenanceData.some((task: MaintenanceTask) => 
          !task.deviceName || task.deviceName === 'N/A' || task.deviceName.trim() === ''
        );
        
        if (hasMissingDeviceNames) {
          logInfo('RulesPage', 'Found maintenance tasks with missing device names, updating');
          try {
            await maintenanceAPI.updateDeviceNames();
            logInfo('RulesPage', 'Device names updated successfully');
            // Refetch maintenance data to get updated device names
            const updatedMaintenanceResponse = await maintenanceAPI.getAll();
            const updatedMaintenanceData = updatedMaintenanceResponse.data || [];
            setMaintenanceTasks(updatedMaintenanceData);
            logInfo('RulesPage', 'Maintenance data refreshed with updated device names');
          } catch (updateErr) {
            logWarn('RulesPage', 'Failed to update device names', updateErr instanceof Error ? updateErr : new Error('Unknown error'));
            // Don't fail the entire data fetch if device name update fails
          }
        }
      } catch (err) {
        logError('RulesPage', 'Error fetching maintenance', err instanceof Error ? err : new Error('Unknown error'));
        setMaintenanceError('Failed to fetch maintenance');
      }

      // Fetch safety precautions data
      try {
        const safetyResponse = await deviceSafetyPrecautionsAPI.getAll();
        const safetyData = safetyResponse.data || [];
        setSafetyPrecautions(safetyData);
        logInfo('RulesPage', 'Total safety precautions loaded', { count: safetyData.length });
      } catch (err) {
        logError('RulesPage', 'Error fetching safety precautions', err instanceof Error ? err : new Error('Unknown error'));
        setSafetyError('Failed to fetch safety precautions');
      }

    } catch (err: any) {
      logError('RulesPage', 'Error fetching data', err instanceof Error ? err : new Error('Unknown error'));
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
    fetchSchedulerStatus();
  }, []);
  
  // Fetch scheduler status
  const fetchSchedulerStatus = async () => {
    try {
      const response = await maintenanceSchedulerAPI.getStatus();
      setSchedulerStatus(response.data);
    } catch (error) {
      logError('RulesPage', 'Error fetching scheduler status', error instanceof Error ? error : new Error('Unknown error'));
    }
  };
  
  // Manual trigger scheduler update
  const handleManualSchedulerUpdate = async () => {
    setSchedulerLoading(true);
    try {
      logInfo('RulesPage', 'Triggering manual maintenance schedule update');
      const response = await maintenanceSchedulerAPI.manualUpdate();
      
      // Enhanced success feedback
      const successMessage = response.data?.message || 'Maintenance schedule update completed successfully!';
      const executionTime = response.data?.executionTimeMs;
      const timestamp = response.data?.timestamp;
      
      logInfo('RulesPage', 'Maintenance schedule update completed', {
        message: successMessage,
        executionTime: executionTime ? `${executionTime}ms` : 'N/A',
        timestamp: timestamp
      });
      
      // Show detailed success message
      const detailedMessage = executionTime 
        ? `${successMessage}\n\nExecution time: ${executionTime}ms\nTimestamp: ${new Date(timestamp).toLocaleString()}`
        : successMessage;
      
      alert(detailedMessage);
      
      // Refresh all data to show updated schedules
      logInfo('RulesPage', 'Refreshing maintenance data');
      await Promise.all([
        fetchAllData(),
        fetchSchedulerStatus()
      ]);
      
      logInfo('RulesPage', 'Data refresh completed');
      
    } catch (error) {
      logError('RulesPage', 'Error triggering scheduler update', error instanceof Error ? error : new Error('Unknown error'));
      
      // Enhanced error handling
      const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to update maintenance schedules';
      const errorDetails = (error as any)?.response?.data?.error || 'Unknown error';
      
      logError('RulesPage', 'Error details', error instanceof Error ? error : new Error('Unknown error'), {
        message: errorMessage,
        type: errorDetails,
        status: (error as any)?.response?.status
      });
      
      alert(`Failed to update maintenance schedules:\n\n${errorMessage}\n\nError type: ${errorDetails}`);
    } finally {
      setSchedulerLoading(false);
    }
  };

  // Filter functions
  const filteredRules = rules.filter(rule => {
    const matchesSearch = (rule.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (rule.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && rule.status === 'ACTIVE') ||
                         (filterStatus === 'inactive' && rule.status === 'INACTIVE');
    return matchesSearch && matchesStatus;
  });

  const filteredMaintenance = maintenanceTasks.filter(task => {
    const matchesSearch = (task.taskName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (task.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && task.status !== 'COMPLETED') ||
                         (filterStatus === 'inactive' && task.status === 'COMPLETED');
    return matchesSearch && matchesStatus;
  });

  const filteredSafety = safetyPrecautions.filter(precaution => {
    const matchesSearch = (precaution.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (precaution.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
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
      logError('RulesPage', 'Error deleting rule', err instanceof Error ? err : new Error('Unknown error'));
    }
  };

  // Handle maintenance operations
  const handleEditMaintenance = (task: MaintenanceTask) => {
    console.log('Editing maintenance task:', {
      id: task.id,
      taskName: task.taskName,
      deviceName: task.deviceName,
      deviceId: task.deviceId,
      description: task.description
    });
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
  const handleEditSafety = (precaution: DeviceSafetyPrecaution) => {
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

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
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

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
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

  const getSeverityColor = (severity: string | undefined) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-header">Automation Rules</h2>
          <p className="section-subtitle">Manage automation rules</p>
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search rules..."
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


      {rulesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{rulesError}</p>
        </div>
      )}

      {rulesLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <Skeleton height={20} className="mb-2" />
              <Skeleton height={16} className="w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="subsection-header">No rules found</h3>
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        {rule.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        rule.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {rule.category || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(rule.priority)}`}>
                        {rule.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(rule.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/rules/${rule.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Button> */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-header">Maintenance Tasks</h2>
          <p className="section-subtitle">Manage device maintenance schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleManualSchedulerUpdate}
            disabled={schedulerLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400"
            title="Update maintenance schedules and send notifications to assigned users"
          >
            <Clock className={`w-4 h-4 ${schedulerLoading ? 'animate-spin' : ''}`} />
            {schedulerLoading ? 'Updating Schedules...' : 'Update Schedules & Notify'}
          </Button>
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
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search maintenance tasks..."
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
      
      {/* Scheduler Status */}
      {schedulerStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">Maintenance Scheduler</h3>
              <p className="text-sm text-blue-700">
                Status: {schedulerStatus.status} • Next Run: {schedulerStatus.nextScheduledRun}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${schedulerStatus.schedulerEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-blue-700">
                {schedulerStatus.schedulerEnabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}


      {maintenanceError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{maintenanceError}</p>
        </div>
      )}

      {maintenanceLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <Skeleton height={20} className="mb-2" />
              <Skeleton height={16} className="w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredMaintenance.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="subsection-header">No maintenance tasks found</h3>
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Task Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Next Maintenance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredMaintenance.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.taskName}</div>
                        {task.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(task.nextMaintenance).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {task.frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.deviceName || getDeviceName(task.deviceId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/maintenance/${task.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Button> */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMaintenance(task)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMaintenance(task.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderSafetyTab = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="section-header">Safety Precautions</h2>
          <p className="section-subtitle">Manage device safety guidelines</p>
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search safety precautions..."
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


      {safetyError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{safetyError}</p>
        </div>
      )}

      {safetyLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <Skeleton height={20} className="mb-2" />
              <Skeleton height={16} className="w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredSafety.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="subsection-header">No safety precautions found</h3>
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
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredSafety.map((precaution) => (
                  <tr key={precaution.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{precaution.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{precaution.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${precaution.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-sm text-gray-900">
                          {precaution.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {precaution.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(precaution.severity)}`}>
                        {precaution.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {precaution.category.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(precaution.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/safety/${precaution.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Button> */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSafety(precaution)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSafety(precaution.id)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
             {/* Header */}
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div>
           <h1 className="page-header">DeviceCare Center</h1>
           <p className="page-subtitle">Manage rules, maintenance, and safety precautions</p>
         </div>
       </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('rules');
              updateTabInURL('rules');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              Rules ({rules.length})
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('maintenance');
              updateTabInURL('maintenance');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              Maintenance ({maintenanceTasks.length})
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('safety');
              updateTabInURL('safety');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'safety'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              Safety ({safetyPrecautions.length})
            </div>
          </button>
        </nav>
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
                     onSubmit={async (ruleData: any) => {
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

             {/* Maintenance Modal */}
       {showMaintenanceModal && (
         <MaintenanceForm
           isOpen={showMaintenanceModal}
           onClose={() => {
             setShowMaintenanceModal(false);
             setEditingMaintenance(null);
           }}
           maintenance={editingMaintenance || undefined}
           onSubmit={async (maintenanceData: Omit<MaintenanceTask, 'id' | 'createdAt' | 'updatedAt'>) => {
             try {
               if (editingMaintenance) {
                 await maintenanceAPI.update(editingMaintenance.id, maintenanceData);
               } else {
                 await maintenanceAPI.create(maintenanceData);
               }
               setShowMaintenanceModal(false);
               setEditingMaintenance(null);
               fetchAllData();
             } catch (error) {
               console.error('Failed to save maintenance task:', error);
             }
           }}
         />
       )}

       {/* Safety Modal */}
       {showSafetyModal && (
         <SafetyForm
           isOpen={showSafetyModal}
           onClose={() => {
             setShowSafetyModal(false);
             setEditingSafety(null);
           }}
           safety={editingSafety || undefined}
           onSubmit={async (safetyData: Omit<DeviceSafetyPrecaution, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => {
             try {
               if (editingSafety) {
                 await deviceSafetyPrecautionsAPI.update(editingSafety.id, safetyData);
               } else {
                 await deviceSafetyPrecautionsAPI.create(safetyData);
               }
               setShowSafetyModal(false);
               setEditingSafety(null);
               fetchAllData();
             } catch (error) {
               console.error('Failed to save safety precaution:', error);
             }
           }}
         />
       )}
    </div>
  );
};

export default RulesPage;
