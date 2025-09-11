import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Filter, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  Wrench
} from 'lucide-react';
import { maintenanceAPI, userAPI } from '../../services/api';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { logError, logInfo, logComponentMount } from '../../utils/logger';

interface DeviceMaintenance {
  id: string;
  deviceId: string;
  title: string;
  description: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'routine';
  frequency?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scheduledDate: string;
  completedDate?: string;
  assignedTo?: string;
  estimatedDuration?: string;
  actualDuration?: number;
  cost?: number;
  notes?: string;
  requiredTools?: string;
  safetyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceFormData {
  title: string;
  description: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'routine';
  frequency: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scheduledDate: string;
  assignedTo: string;
  estimatedDuration: string;
  notes: string;
  requiredTools: string;
  safetyNotes: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  organizationId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface DeviceMaintenanceDisplayProps {
  deviceId: string;
}

const DeviceMaintenanceDisplay: React.FC<DeviceMaintenanceDisplayProps> = ({ deviceId }) => {
  const [maintenanceTasks, setMaintenanceTasks] = useState<DeviceMaintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<DeviceMaintenance | null>(null);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    title: '',
    description: '',
    type: 'preventive',
    frequency: '',
    priority: 'MEDIUM',
    scheduledDate: '',
    assignedTo: '',
    estimatedDuration: '',
    notes: '',
    requiredTools: '',
    safetyNotes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    logComponentMount('DeviceMaintenanceDisplay', { deviceId });
    logInfo('DeviceMaintenanceDisplay', 'Loading maintenance data for device', { deviceId });
    loadMaintenanceTasks();
    loadUsers();
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

  const loadMaintenanceTasks = async () => {
    try {
      setLoading(true);
      logInfo('DeviceMaintenanceDisplay', 'Loading maintenance tasks for device', { deviceId });
      
      // Use maintenance API to get maintenance tasks for this specific device
      const maintenanceResponse = await maintenanceAPI.getByDevice(deviceId);
      logInfo('DeviceMaintenanceDisplay', 'Raw maintenance response received', maintenanceResponse);
      
      // The backend returns a complex object with maintenanceTasks field
      const maintenanceData = maintenanceResponse.data?.maintenanceTasks || maintenanceResponse.data || [];
      logInfo('DeviceMaintenanceDisplay', 'Maintenance data processed', maintenanceData);
      
      // Transform the data to match the expected format
      const transformedTasks: DeviceMaintenance[] = maintenanceData.map((task: any) => ({
        id: task.id || task.maintenance_id || `maintenance_${Math.random()}`,
        deviceId: task.deviceId || task.device?.id || deviceId,
        title: task.taskName || task.title || 'Unnamed Task',
        description: task.description || 'No description available',
        type: task.maintenanceType || task.type || 'preventive',
        frequency: task.frequency || 'Not specified',
        status: task.status || 'scheduled',
        priority: task.priority || 'MEDIUM',
        scheduledDate: task.nextMaintenance || task.scheduledDate || new Date().toISOString(),
        completedDate: task.lastMaintenance || task.completedDate,
        assignedTo: task.assignedTo || '',
        estimatedDuration: task.estimatedDuration || task.estimated_duration || '',
        actualDuration: task.actualDuration || task.actual_duration,
        cost: task.estimatedCost || task.estimated_cost,
        notes: task.notes || '',
        requiredTools: task.requiredTools || task.required_tools || '',
        safetyNotes: task.safetyNotes || task.safety_notes || '',
        createdAt: task.createdAt || task.created_at || new Date().toISOString(),
        updatedAt: task.updatedAt || task.updated_at || new Date().toISOString()
      }));
      
      setMaintenanceTasks(transformedTasks);
      setError(null);
      
      logInfo('DeviceMaintenanceDisplay', 'Maintenance tasks loaded successfully', { 
        deviceId, 
        tasksCount: transformedTasks.length 
      });
      logInfo('DeviceMaintenanceDisplay', `Loaded ${transformedTasks.length} maintenance tasks for device ${deviceId}`);
    } catch (err) {
      logError('DeviceMaintenanceDisplay', 'Error loading maintenance tasks', err instanceof Error ? err : new Error('Unknown error'));
      setError('Failed to load maintenance tasks');
      setMaintenanceTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      logInfo('DeviceMaintenanceDisplay', 'Loading users for assignment');
      const response = await userAPI.getAll();
      setUsers(response.data || []);
      logInfo('DeviceMaintenanceDisplay', 'Users loaded successfully', { 
        userCount: response.data?.length || 0 
      });
    } catch (err) {
      const error = err as Error;
      logError('DeviceMaintenanceDisplay', 'Failed to load users', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'in_progress':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-success-100 text-success-800 border-success-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTasks = maintenanceTasks.filter(task => {
    const matchesType = filterType === 'all' || task.type === filterType;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  // Log filtered results for debugging
  useEffect(() => {
    const filteredCount = filteredTasks.length;
    const totalCount = maintenanceTasks.length;
    logInfo('DeviceMaintenanceDisplay', `Filtered ${filteredCount} of ${totalCount} maintenance tasks for device ${deviceId}`);
  }, [filteredTasks.length, maintenanceTasks.length, deviceId]);

  const handleAddTask = () => {
    setFormData({
      title: '',
      description: '',
      type: 'preventive',
      frequency: '',
      priority: 'MEDIUM',
      scheduledDate: '',
      assignedTo: '',
      estimatedDuration: '',
      notes: '',
      requiredTools: '',
      safetyNotes: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditTask = (task: DeviceMaintenance) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      type: task.type,
      frequency: task.frequency || '',
      priority: task.priority,
      scheduledDate: task.scheduledDate,
      assignedTo: task.assignedTo || '',
      estimatedDuration: task.estimatedDuration || '',
      notes: task.notes || '',
      requiredTools: task.requiredTools || '',
      safetyNotes: task.safetyNotes || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance task?')) {
      try {
        logInfo('DeviceMaintenanceDisplay', 'Deleting maintenance task', { taskId: id, deviceId });
        await maintenanceAPI.delete(id);
        await loadMaintenanceTasks();
        logInfo('DeviceMaintenanceDisplay', 'Maintenance task deleted successfully', { taskId: id, deviceId });
      } catch (err) {
        const error = err as Error;
        logError('DeviceMaintenanceDisplay', 'Failed to delete maintenance task', error, { taskId: id, deviceId });
        setError('Failed to delete maintenance task');
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Scheduled date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const taskData = {
        ...formData,
        deviceId,
        status: 'scheduled' as const
      };

      if (editingTask) {
        await maintenanceAPI.update(editingTask.id, taskData);
      } else {
        await maintenanceAPI.create(taskData);
      }

      await loadMaintenanceTasks();
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingTask(null);
    } catch (err) {
      logError('Maintenance', 'Error saving maintenance task', err instanceof Error ? err : new Error('Unknown error'));
      setError('Failed to save maintenance task');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };


  const getUserNameById = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading maintenance tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button
            onClick={loadMaintenanceTasks}
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
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Tasks</h3>
          <p className="text-sm text-gray-600">
            {maintenanceTasks.length} task{maintenanceTasks.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button
          onClick={handleAddTask}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
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
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="emergency">Emergency</option>
            <option value="routine">Routine</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Maintenance Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance tasks found</h3>
            <p className="text-gray-500 mb-4">
              {maintenanceTasks.length === 0 
                ? "This device doesn't have any maintenance tasks yet."
                : "No tasks match your current filters."
              }
            </p>
            {maintenanceTasks.length === 0 && (
              <Button
                onClick={handleAddTask}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 w-1/3">Task Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">Frequency</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300">Actions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredTasks.map((task) => (
                  <React.Fragment key={task.id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
                        task.status === 'completed' ? 'opacity-60' : ''
                      }`}
                      onClick={() => toggleRowExpansion(task.id)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200 font-medium">
                        {truncateText(task.title)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-200">
                        {task.frequency || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 text-sm border-r border-gray-200">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm border-r border-gray-200">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTask(task);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 text-center">
                        <span className="text-lg font-bold">
                          {expandedRows.has(task.id) ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>
                    {expandedRows.has(task.id) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-6 bg-gray-50 border-b border-gray-200">
                          <div className="space-y-3">
                            <div>
                              <h5 className="font-medium text-gray-800 mb-1">Description:</h5>
                              <p className="text-gray-600 text-sm">{task.description || 'No description available'}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Scheduled:</span>
                                <p className="text-gray-800">{formatDate(task.scheduledDate)}</p>
                              </div>
                              {task.completedDate && (
                                <div>
                                  <span className="font-medium text-gray-600">Completed:</span>
                                  <p className="text-gray-800">{formatDate(task.completedDate)}</p>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-600">Duration:</span>
                                <p className="text-gray-800">{task.estimatedDuration || 'Not specified'}</p>
                              </div>
                              {task.cost && (
                                <div>
                                  <span className="font-medium text-gray-600">Cost:</span>
                                  <p className="text-gray-800">${task.cost}</p>
                                </div>
                              )}
                            </div>
                            {(task.requiredTools || task.safetyNotes || task.assignedTo || task.notes) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {task.requiredTools && (
                                  <div>
                                    <span className="font-medium text-gray-600">Required Tools:</span>
                                    <p className="text-gray-800">{task.requiredTools}</p>
                                  </div>
                                )}
                                {task.safetyNotes && (
                                  <div>
                                    <span className="font-medium text-gray-600">Safety Notes:</span>
                                    <p className="text-gray-800">{task.safetyNotes}</p>
                                  </div>
                                )}
                                {task.assignedTo && (
                                  <div>
                                    <span className="font-medium text-gray-600">Assigned to:</span>
                                    <p className="text-gray-800">{getUserNameById(task.assignedTo)}</p>
                                  </div>
                                )}
                                {task.notes && (
                                  <div>
                                    <span className="font-medium text-gray-600">Notes:</span>
                                    <p className="text-gray-800">{task.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200">
                              <span>Frequency: {task.frequency || 'Not specified'}</span>
                              <span>Created: {formatDate(task.createdAt)}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Maintenance Task' : 'Add Maintenance Task'}
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
              className={`w-full px-3 py-2 border rounded-md ${
                formErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter task title"
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
              className={`w-full px-3 py-2 border rounded-md ${
                formErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              placeholder="Enter task description"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="emergency">Emergency</option>
                <option value="routine">Routine</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <input
                type="text"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Daily, Weekly, Monthly, Quarterly"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.scheduledDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.scheduledDate && (
                <p className="text-red-500 text-sm mt-1">{formErrors.scheduledDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.estimatedDuration ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 15 minutes, 2 hours"
              />
              {formErrors.estimatedDuration && (
                <p className="text-red-500 text-sm mt-1">{formErrors.estimatedDuration}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={usersLoading}
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
            {usersLoading && (
              <p className="text-sm text-gray-500 mt-1">Loading users...</p>
            )}
            {!usersLoading && users.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No users available</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="Additional notes"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Tools
            </label>
            <input
              type="text"
              value={formData.requiredTools}
              onChange={(e) => setFormData({ ...formData, requiredTools: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., torque wrench, socket set, safety gloves"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Safety Notes
            </label>
            <textarea
              value={formData.safetyNotes}
              onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Safety precautions and requirements"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTask ? 'Update Task' : 'Add Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DeviceMaintenanceDisplay;
