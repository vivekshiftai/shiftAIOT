import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { maintenanceAPI } from '../services/api';
import { logError, logInfo } from '../utils/logger';
import Button from '../components/UI/Button';
import Skeleton, { SkeletonCard } from '../components/UI/Skeleton';

import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  User,
  Wrench,
  ChevronDown,
  ChevronUp,
  Plus,
  Filter,
  RefreshCw,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  Users,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  Bell,
  Send
} from 'lucide-react';

interface MaintenanceTask {
  id: string;
  taskName: string;
  description: string;
  priority: string;
  status: string;
  nextMaintenance: string;
  lastMaintenance?: string;
  frequency: string;
  estimatedDuration: string;
  requiredTools: string;
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  completedBy?: string;
  completedAt?: string;
  deviceName: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface DayWiseMaintenance {
  today: MaintenanceTask[];
  tomorrow: MaintenanceTask[];
  next7Days: MaintenanceTask[];
  next30Days: MaintenanceTask[];
  overdue: MaintenanceTask[];
  recentCompleted: MaintenanceTask[];
  summary: {
    todayCount: number;
    tomorrowCount: number;
    next7DaysCount: number;
    next30DaysCount: number;
    overdueCount: number;
    recentCompletedCount: number;
    totalActive: number;
  };
}

export const MaintenanceSection: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [maintenanceData, setMaintenanceData] = useState<DayWiseMaintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'today' | 'tomorrow' | 'next7Days' | 'next30Days' | 'overdue' | 'recentCompleted'>('today');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['today']));
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [triggeringNotifications, setTriggeringNotifications] = useState(false);

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      logInfo('MaintenanceSection', 'Fetching day-wise maintenance data...');
      
      const response = await maintenanceAPI.getDayWise();
      setMaintenanceData(response.data);
      
      logInfo('MaintenanceSection', 'Day-wise maintenance data fetched successfully', {
        todayCount: response.data.summary.todayCount,
        tomorrowCount: response.data.summary.tomorrowCount,
        totalActive: response.data.summary.totalActive
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch maintenance data';
      setError(errorMessage);
      logError('MaintenanceSection', 'Failed to fetch maintenance data', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else {
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
      }
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await maintenanceAPI.completeTask(taskId);
      logInfo('MaintenanceSection', 'Task completed successfully', { taskId });
      fetchMaintenanceData(); // Refresh data
    } catch (err: any) {
      logError('MaintenanceSection', 'Failed to complete task', err);
    }
  };

  const handleAssignTask = async (taskId: string, assigneeId: string) => {
    try {
      await maintenanceAPI.assignTask(taskId, assigneeId);
      logInfo('MaintenanceSection', 'Task assigned successfully', { taskId, assigneeId });
      fetchMaintenanceData(); // Refresh data
    } catch (err: any) {
      logError('MaintenanceSection', 'Failed to assign task', err);
    }
  };

  const handleTriggerNotifications = async () => {
    try {
      setTriggeringNotifications(true);
      logInfo('MaintenanceSection', 'Triggering maintenance notifications...');
      
      const response = await maintenanceAPI.triggerNotifications();
      const { notificationsSent, message } = response.data;
      
      logInfo('MaintenanceSection', 'Maintenance notifications triggered successfully', {
        notificationsSent,
        message
      });
      
      // Show success message (you could add a toast notification here)
      alert(`✅ ${message}\n📧 Notifications sent: ${notificationsSent}`);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to trigger notifications';
      logError('MaintenanceSection', 'Failed to trigger maintenance notifications', err);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setTriggeringNotifications(false);
    }
  };

  const filterTasks = (tasks: MaintenanceTask[]) => {
    return tasks.filter(task => {
      const priorityMatch = filterPriority === 'all' || task.priority?.toLowerCase() === filterPriority.toLowerCase();
      const statusMatch = filterStatus === 'all' || task.status?.toLowerCase() === filterStatus.toLowerCase();
      return priorityMatch && statusMatch;
    });
  };

  const renderTaskCard = (task: MaintenanceTask) => (
    <div key={task.id} className="p-4 rounded-xl border border-light hover:bg-secondary transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-primary text-sm mb-1">
            {task.taskName}
          </h4>
          <p className="text-secondary text-xs mb-2">
            {task.description || 'Maintenance task'}
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
              <span className="capitalize">{task.priority || 'medium'}</span>
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status || 'active'}</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-tertiary mb-1">
            {getRelativeDate(task.nextMaintenance)}
          </p>
          <p className="text-xs text-secondary">
            {formatDate(task.nextMaintenance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs text-secondary mb-3">
        <div>
          <span className="font-medium">Device:</span> {task.deviceName}
        </div>
        <div>
          <span className="font-medium">Frequency:</span> {task.frequency}
        </div>
        <div>
          <span className="font-medium">Duration:</span> {task.estimatedDuration || 'Not specified'}
        </div>
        <div>
          <span className="font-medium">Tools:</span> {task.requiredTools || 'Standard tools'}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-light">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <div className="flex items-center gap-1 text-xs text-secondary">
              <UserCheck className="w-3 h-3" />
              <span>Assigned to: {task.assignedTo}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-secondary">
              <UserX className="w-3 h-3" />
              <span>Unassigned</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {task.status === 'active' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => handleCompleteTask(task.id)}
            >
              <CheckSquare className="w-3 h-3 mr-1" />
              Complete
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate(`/devices?maintenance=${task.id}`)}
          >
            <Wrench className="w-3 h-3 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSection = (title: string, tasks: MaintenanceTask[], icon: React.ReactNode, color: string) => {
    const filteredTasks = filterTasks(tasks);
    const isExpanded = expandedSections.has(title.toLowerCase().replace(/\s+/g, ''));
    
    return (
      <div className="card p-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection(title.toLowerCase().replace(/\s+/g, ''))}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {title}
              </h3>
              <p className="text-secondary text-sm">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-secondary" /> : <ChevronDown className="w-5 h-5 text-secondary" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(renderTaskCard)
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-secondary mx-auto mb-4" />
                <p className="text-secondary text-sm">
                  No maintenance tasks found
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton width={200} height={32} />
          <Skeleton width={120} height={40} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">Error Loading Maintenance Data</h3>
        <p className="text-secondary mb-4">{error}</p>
        <Button onClick={fetchMaintenanceData} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!maintenanceData) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-secondary mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">No Maintenance Data</h3>
        <p className="text-secondary">No maintenance tasks found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">
            Maintenance Schedule
          </h1>
          <p className="text-secondary text-lg">
            Track and manage your device maintenance tasks
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchMaintenanceData}
            className="btn-secondary"
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="md"
            leftIcon={triggeringNotifications ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            onClick={handleTriggerNotifications}
            disabled={triggeringNotifications}
            className="btn-secondary"
          >
            {triggeringNotifications ? 'Sending...' : 'Send Today\'s Notifications'}
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/devices?addMaintenance=true')}
            className="btn-primary"
          >
            Add Maintenance
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h4 className="text-2xl font-bold text-primary mb-1">{maintenanceData.summary.overdueCount}</h4>
          <p className="text-secondary text-sm">Overdue Tasks</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
          <h4 className="text-2xl font-bold text-primary mb-1">{maintenanceData.summary.todayCount}</h4>
          <p className="text-secondary text-sm">Today's Tasks</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-6 h-6 text-yellow-500" />
          </div>
          <h4 className="text-2xl font-bold text-primary mb-1">{maintenanceData.summary.tomorrowCount}</h4>
          <p className="text-secondary text-sm">Tomorrow's Tasks</p>
        </div>

        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h4 className="text-2xl font-bold text-primary mb-1">{maintenanceData.summary.recentCompletedCount}</h4>
          <p className="text-secondary text-sm">Recently Completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary">Filters:</span>
          </div>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1 border border-light rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-light rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Maintenance Sections */}
      <div className="space-y-6">
        {renderSection(
          'Overdue Tasks',
          maintenanceData.overdue,
          <AlertTriangle className="w-5 h-5 text-red-500" />,
          'bg-red-50'
        )}
        
        {renderSection(
          'Today',
          maintenanceData.today,
          <Clock className="w-5 h-5 text-blue-500" />,
          'bg-blue-50'
        )}
        
        {renderSection(
          'Tomorrow',
          maintenanceData.tomorrow,
          <CalendarDays className="w-5 h-5 text-yellow-500" />,
          'bg-yellow-50'
        )}
        
        {renderSection(
          'Next 7 Days',
          maintenanceData.next7Days,
          <TrendingUp className="w-5 h-5 text-purple-500" />,
          'bg-purple-50'
        )}
        
        {renderSection(
          'Next 30 Days',
          maintenanceData.next30Days,
          <Calendar className="w-5 h-5 text-indigo-500" />,
          'bg-indigo-50'
        )}
        
        {renderSection(
          'Recently Completed',
          maintenanceData.recentCompleted,
          <CheckCircle className="w-5 h-5 text-green-500" />,
          'bg-green-50'
        )}
      </div>
    </div>
  );
};
