import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIoT } from '../contexts/IoTContext';
import { useTheme } from '../contexts/ThemeContext';
import { StatsCard } from '../components/Dashboard/StatsCard';
import Skeleton, { SkeletonCard } from '../components/UI/Skeleton';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import TaskManager from '../components/TaskManager/TaskManager';
import { AuthDebug } from '../components/Debug/AuthDebug';
import { 
  Cpu, 
  Wifi, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Settings,
  Activity,
  Zap,
  Users,
  Shield,
  BarChart3,
  Bell,
  ArrowRight,
  Plus,
  Eye,
  CheckSquare
} from 'lucide-react';

export const DashboardSection: React.FC = () => {
  const { devices, notifications, rules, loading } = useIoT();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showTaskManager, setShowTaskManager] = useState(false);

  // Calculate metrics
  const metrics = useMemo(() => {
    const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
    const totalDevices = devices.length;
    
    // Maintenance schedules (using notifications as proxy)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const getNotifDate = (n: any) => new Date(n.createdAt || n.timestamp || Date.now());
    const maintenanceThisWeek = notifications.filter(n =>
      n.title?.toLowerCase().includes('maintenance') &&
      getNotifDate(n) >= startOfWeek && getNotifDate(n) < endOfWeek
    );

    const rulesCompletedThisWeek = rules.filter(r => 
      r.lastTriggered && new Date(r.lastTriggered) >= startOfWeek && new Date(r.lastTriggered) < endOfWeek
    ).length;

    return {
      totalDevices,
      onlineDevices,
      maintenanceThisWeek: maintenanceThisWeek.length,
      rulesCompletedThisWeek
    };
  }, [devices, notifications, rules]);

  // Upcoming maintenance
  const upcomingMaintenance = useMemo(() => {
    return notifications
      .filter(n => n.title?.toLowerCase().includes('maintenance'))
      .map(n => ({
        id: n.id as string,
        title: n.title,
        message: n.message,
        timestamp: (n.createdAt || (n as any).timestamp || new Date().toISOString()) as string,
        priority: derivePriority(n.createdAt || (n as any).timestamp)
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 5);
  }, [notifications]);

  function derivePriority(dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const diffMs = date.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 0) return 'overdue';
    if (diffHours <= 24) return 'soon';
    return 'later';
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'soon': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
      case 'later': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'soon': return <Clock className="w-4 h-4" />;
      case 'later': return <Calendar className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  // Navigation handlers
  const handleNavigateDevices = () => navigate('/devices');
  const handleShowActiveDevices = () => navigate('/devices?status=ONLINE');
  const handleShowMaintenanceWeek = () => navigate('/notifications?filter=maintenance&range=this-week');
  const handleShowRules = () => navigate('/rules');
  const handleAddDevice = () => navigate('/devices?add=true');

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Welcome back! Here's what's happening with your IoT devices.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddDevice}
          >
            Add Device
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<CheckSquare className="w-4 h-4" />}
            onClick={() => setShowTaskManager(true)}
          >
            Task Manager
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => navigate('/analytics')}
          >
            View Analytics
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Devices"
          value={metrics.totalDevices}
          subtitle={`${metrics.onlineDevices} online`}
          icon={Cpu}
          color="blue"
          onClick={handleNavigateDevices}
          className="hover-lift"
        />
        <StatsCard
          title="Active Devices"
          value={metrics.onlineDevices}
          subtitle="Currently online"
          icon={Wifi}
          color="green"
          onClick={handleShowActiveDevices}
          className="hover-lift"
        />
        <StatsCard
          title="Maintenance (This Week)"
          value={metrics.maintenanceThisWeek}
          subtitle="Scheduled tasks"
          icon={Calendar}
          color="yellow"
          onClick={handleShowMaintenanceWeek}
          className="hover-lift"
        />
        <StatsCard
          title="Rules Completed"
          value={metrics.rulesCompletedThisWeek}
          subtitle="This week"
          icon={CheckCircle}
          color="purple"
          onClick={handleShowRules}
          className="hover-lift"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Chart */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Device Activity
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Real-time monitoring of device performance
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {['24h', '7d', '30d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedTimeRange === range
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Device Activity Monitor
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Real-time device monitoring will be available when telemetry data is configured
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="lg:col-span-1">
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upcoming Maintenance
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Scheduled tasks and alerts
                </p>
              </div>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {upcomingMaintenance.length > 0 ? (
                upcomingMaintenance.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => navigate(`/notifications?id=${item.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {getPriorityIcon(item.priority)}
                            <span className="ml-1 capitalize">{item.priority}</span>
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    No upcoming maintenance scheduled
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/notifications')}
              >
                View All Notifications
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 text-center hover-lift cursor-pointer" onClick={() => navigate('/devices')}>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Manage Devices</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">View and configure your IoT devices</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer" onClick={() => navigate('/rules')}>
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Automation Rules</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Create and manage automation workflows</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer" onClick={() => navigate('/analytics')}>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Analytics</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">View detailed performance insights</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer" onClick={() => setShowTaskManager(true)}>
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Task Manager</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Organize and track your tasks</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer" onClick={() => navigate('/settings')}>
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Settings</h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Configure platform preferences</p>
        </div>
      </div>

      {/* Task Manager Modal */}
      <Modal
        isOpen={showTaskManager}
        onClose={() => setShowTaskManager(false)}
        title="Task Manager"
        size="full"
        className="max-w-7xl"
      >
        <TaskManager />
      </Modal>

      {/* Debug Component - Remove this after fixing the issue */}
      <div className="mt-8">
        <AuthDebug />
      </div>
    </div>
  );
};