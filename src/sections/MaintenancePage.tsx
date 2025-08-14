import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenanceAPI } from '../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  ArrowLeft, 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Settings,
  Repeat,
  Bell,
  Cog
} from 'lucide-react';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import Skeleton from '../components/UI/Skeleton';

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

interface MaintenanceFormData {
  taskName: string;
  description: string;
  deviceId: string;
  deviceName: string;
  frequency: string;
  nextMaintenance: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo: string;
  notes: string;
}

const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    taskName: '',
    description: '',
    deviceId: '',
    deviceName: '',
    frequency: 'weekly',
    nextMaintenance: '',
    priority: 'medium',
    assignedTo: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mock devices for selection
  const mockDevices = [
    { id: '1', name: 'Temperature Sensor 1' },
    { id: '2', name: 'Humidity Monitor' },
    { id: '3', name: 'Pressure Gauge' },
    { id: '4', name: 'Flow Meter' },
    { id: '5', name: 'Control Valve' },
    { id: '6', name: 'Pump System' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600 bg-green-50' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50' },
    { value: 'critical', label: 'Critical', color: 'text-red-600 bg-red-50' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-gray-600 bg-gray-50' },
    { value: 'in_progress', label: 'In Progress', color: 'text-blue-600 bg-blue-50' },
    { value: 'completed', label: 'Completed', color: 'text-green-600 bg-green-50' },
    { value: 'overdue', label: 'Overdue', color: 'text-red-600 bg-red-50' }
  ];

  // Fetch maintenance tasks with polling
  const fetchMaintenanceTasks = async () => {
    try {
      setError(null);
      const response = await maintenanceAPI.getAll();
      setMaintenanceTasks(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch maintenance tasks');
      console.error('Error fetching maintenance tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceTasks();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchMaintenanceTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks based on search, status, and priority
  const filteredTasks = maintenanceTasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.deviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.taskName.trim()) {
      errors.taskName = 'Task name is required';
    }
    
    if (!formData.deviceId) {
      errors.deviceId = 'Device selection is required';
    }
    
    if (!formData.nextMaintenance) {
      errors.nextMaintenance = 'Due date is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingTask) {
        await maintenanceAPI.update(editingTask.id, formData);
      } else {
        await maintenanceAPI.create(formData);
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingTask(null);
      resetForm();
      fetchMaintenanceTasks(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save maintenance task');
    }
  };

  // Handle task deletion
  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this maintenance task?')) return;
    
    try {
      await maintenanceAPI.delete(taskId);
      fetchMaintenanceTasks(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete maintenance task');
    }
  };

  // Handle edit
  const handleEdit = (task: MaintenanceTask) => {
    setEditingTask(task);
    setFormData({
      taskName: task.taskName,
      description: task.description || '',
      deviceId: task.deviceId,
      deviceName: task.deviceName,
      frequency: task.frequency,
      nextMaintenance: task.nextMaintenance,
      priority: task.priority,
      assignedTo: task.assignedTo || '',
      notes: task.notes || ''
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      taskName: '',
      description: '',
      deviceId: '',
      deviceName: '',
      frequency: 'weekly',
      nextMaintenance: '',
      priority: 'medium',
      assignedTo: '',
      notes: ''
    });
    setFormErrors({});
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || 'text-gray-600 bg-gray-50';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const priorityOption = priorityOptions.find(p => p.value === priority);
    return priorityOption?.color || 'text-gray-600 bg-gray-50';
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Check if task is overdue
  const isOverdue = (nextMaintenance: string) => {
    return new Date(nextMaintenance) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={32} />
          <Skeleton width={120} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Maintenance Schedule</h1>
            <p className="text-secondary">Manage device maintenance tasks and schedules</p>
          </div>
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
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Search maintenance tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="px-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Maintenance Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <div key={task.id} className="card p-6 hover-lift">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  task.status === 'completed' ? 'bg-success-500' :
                  task.status === 'in_progress' ? 'bg-primary-500' :
                  isOverdue(task.nextMaintenance) ? 'bg-error-500' : 'bg-warning-500'
                }`} />
                <h3 className="font-semibold text-primary">{task.taskName}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(task)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                  className="text-error-500 hover:text-error-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {task.description && (
              <p className="text-secondary text-sm mb-4">{task.description}</p>
            )}
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-secondary" />
                <span className="text-secondary">Next Due:</span>
                <span className={`font-medium ${isOverdue(task.nextMaintenance) ? 'text-error-600' : 'text-primary'}`}>
                  {new Date(task.nextMaintenance).toLocaleDateString()}
                </span>
              </div>
              
              {task.lastMaintenance && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <span className="text-secondary">Last performed:</span>
                  <span className="font-medium text-primary">
                    {new Date(task.lastMaintenance).toLocaleDateString()}
                  </span>
                </div>
              )}
              
              {task.assignedTo && (
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4 text-primary-500" />
                  <span className="text-secondary">Assigned to:</span>
                  <span className="font-medium text-primary">{task.assignedTo}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                {getStatusIcon(task.status)}
                <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
              </span>
              
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                <span className="capitalize">{task.priority}</span>
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-tertiary">
              <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
              <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <Wrench className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">No maintenance tasks found</h3>
          <p className="text-secondary mb-4">
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first maintenance task to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && filterPriority === 'all' && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
            >
              Create First Task
            </Button>
          )}
        </div>
      )}

      {/* Add Maintenance Task Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Maintenance Task"
        size="lg"
      >
        <div className="space-y-6 bg-secondary p-6 rounded-lg">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.taskName}
              onChange={(e) => setFormData(prev => ({ ...prev, taskName: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white ${
                formErrors.taskName ? 'border-error-500' : 'border-light'
              }`}
              placeholder="Enter task name"
            />
            {formErrors.taskName && (
              <p className="text-error-500 text-sm mt-1">{formErrors.taskName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              rows={3}
              placeholder="Describe the maintenance task"
            />
          </div>

          {/* Device Selection */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Device *
            </label>
            <select
              value={formData.deviceId}
              onChange={(e) => {
                const device = mockDevices.find(d => d.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  deviceId: e.target.value,
                  deviceName: device?.name || ''
                }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                formErrors.deviceId ? 'border-error-500' : 'border-light'
              }`}
            >
              <option value="">Select Device</option>
              {mockDevices.map(device => (
                <option key={device.id} value={device.id}>{device.name}</option>
              ))}
            </select>
            {formErrors.deviceId && (
              <p className="text-error-500 text-sm mt-1">{formErrors.deviceId}</p>
            )}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {frequencyOptions.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Next Due Date *
              </label>
              <input
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenance: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  formErrors.nextMaintenance ? 'border-error-500' : 'border-light'
                }`}
              />
              {formErrors.nextMaintenance && (
                <p className="text-error-500 text-sm mt-1">{formErrors.nextMaintenance}</p>
              )}
            </div>
          </div>

          {/* Priority and Assignment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {priorityOptions.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter assignee name"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Additional notes or instructions"
            />
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light bg-white dark:bg-gray-800 sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            Create Task
          </Button>
        </div>
      </Modal>

      {/* Edit Maintenance Task Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Maintenance Task"
        size="lg"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.taskName}
              onChange={(e) => setFormData(prev => ({ ...prev, taskName: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                formErrors.taskName ? 'border-error-500' : 'border-light'
              }`}
              placeholder="Enter task name"
            />
            {formErrors.taskName && (
              <p className="text-error-500 text-sm mt-1">{formErrors.taskName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Describe the maintenance task"
            />
          </div>

          {/* Device Selection */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Device *
            </label>
            <select
              value={formData.deviceId}
              onChange={(e) => {
                const device = mockDevices.find(d => d.id === e.target.value);
                setFormData(prev => ({
                  ...prev,
                  deviceId: e.target.value,
                  deviceName: device?.name || ''
                }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                formErrors.deviceId ? 'border-error-500' : 'border-light'
              }`}
            >
              <option value="">Select Device</option>
              {mockDevices.map(device => (
                <option key={device.id} value={device.id}>{device.name}</option>
              ))}
            </select>
            {formErrors.deviceId && (
              <p className="text-error-500 text-sm mt-1">{formErrors.deviceId}</p>
            )}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {frequencyOptions.map(freq => (
                  <option key={freq.value} value={freq.value}>{freq.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Next Due Date *
              </label>
              <input
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenance: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  formErrors.nextMaintenance ? 'border-error-500' : 'border-light'
                }`}
              />
              {formErrors.nextMaintenance && (
                <p className="text-error-500 text-sm mt-1">{formErrors.nextMaintenance}</p>
              )}
            </div>
          </div>

          {/* Priority and Assignment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {priorityOptions.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter assignee name"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Additional notes or instructions"
            />
          </div>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-light bg-white dark:bg-gray-800 sticky bottom-0">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
          >
            Update Task
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
