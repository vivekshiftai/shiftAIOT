import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIoT } from '../contexts/IoTContext';
import { useTheme } from '../contexts/ThemeContext';
import { StatsCard } from '../components/Dashboard/StatsCard';
import Skeleton, { SkeletonCard } from '../components/UI/Skeleton';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import TaskManager from '../components/TaskManager/TaskManager';
import { maintenanceAPI } from '../services/api';

import { 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Settings,
  Shield,
  ArrowRight,
  Plus,
  Eye
} from 'lucide-react';

export const DashboardSection: React.FC = () => {
  const { devices, notifications, rules, loading } = useIoT();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showTaskManager, setShowTaskManager] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  // Fetch maintenance tasks
  useEffect(() => {
    const fetchMaintenanceTasks = async () => {
      try {
        setMaintenanceLoading(true);
        const response = await maintenanceAPI.getAll();
        setMaintenanceTasks(response.data || []);
      } catch (error) {
        console.error('Failed to fetch maintenance tasks:', error);
        setMaintenanceTasks([]);
      } finally {
        setMaintenanceLoading(false);
      }
    };

    fetchMaintenanceTasks();
    
    // Poll for maintenance updates every 60 seconds (reduced from 30)
    const interval = setInterval(fetchMaintenanceTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
    const totalDevices = devices.length;
    
    // Real maintenance data
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const maintenanceThisWeek = maintenanceTasks.filter(task => {
      const taskDate = new Date(task.nextMaintenance);
      return taskDate >= startOfWeek && taskDate < endOfWeek;
    });

    const rulesCompletedThisWeek = rules.filter(r => 
      r.createdAt && new Date(r.createdAt) >= startOfWeek && new Date(r.createdAt) < endOfWeek
    ).length;

    return {
      totalDevices,
      onlineDevices,
      maintenanceThisWeek: maintenanceThisWeek.length,
      rulesCompletedThisWeek,
      totalRules: rules.length,
      totalMaintenance: maintenanceTasks.length,
      pendingMaintenance: maintenanceTasks.filter(task => task.status === 'pending').length,
      completedMaintenance: maintenanceTasks.filter(task => task.status === 'completed').length
    };
  }, [devices, notifications, rules, maintenanceTasks]);

  // Upcoming maintenance
  const upcomingMaintenance = useMemo(() => {
    return maintenanceTasks
      .map(task => ({
        id: task.id as string,
        title: task.title,
        message: task.description,
        timestamp: new Date(task.nextMaintenance).toISOString(),
        priority: task.priority
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 5);
  }, [maintenanceTasks]);

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
      case 'overdue': return 'text-error-500 bg-error-500/20';
      case 'soon': return 'text-warning-500 bg-warning-500/20';
      case 'later': return 'text-secondary-500 bg-secondary-500/20';
      default: return 'text-tertiary bg-tertiary/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'soon': return <Clock className="w-4 h-4" />;
      case 'later': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Navigation handlers
  const handleNavigateDevices = () => navigate('/devices');
  const handleShowActiveDevices = () => navigate('/devices?status=ONLINE');
  const handleShowMaintenanceWeek = () => navigate('/notifications?filter=maintenance&range=this-week');
  const handleShowRules = () => navigate('/rules');
  const handleShowMaintenance = () => navigate('/maintenance');
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
          <h1 className="text-4xl font-bold text-primary mb-2">
            Dashboard
          </h1>
          <p className="text-secondary text-lg">
            Welcome back! Here's what's happening with your IoT devices.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddDevice}
            className="btn-secondary"
          >
            Add Device
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<CheckCircle className="w-4 h-4" />}
            onClick={() => setShowTaskManager(true)}
            className="btn-warning"
          >
            Task Manager
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => navigate('/analytics')}
            className="btn-primary"
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
           icon={Shield}
           color="blue"
           onClick={handleNavigateDevices}
           className="hover-lift animate-fade-in"
         />
                 <StatsCard
           title="Active Devices"
           value={metrics.onlineDevices}
           subtitle="Currently online"
           icon={Shield}
           color="green"
           onClick={handleShowActiveDevices}
           className="hover-lift animate-fade-in"
         />
                 <StatsCard
           title="Total Rules"
           value={metrics.totalRules}
           subtitle="Automation rules"
           icon={Shield}
           color="purple"
           onClick={handleShowRules}
           className="hover-lift animate-fade-in"
         />
                 <StatsCard
           title="Total Maintenance"
           value={metrics.totalMaintenance}
           subtitle="Scheduled tasks"
           icon={Shield} // Changed from Wrench to Shield
           color="yellow"
           onClick={handleShowMaintenance}
           className="hover-lift animate-fade-in"
         />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Chart */}
        <div className="lg:col-span-2">
                     <div className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                                 <h3 className="text-xl font-semibold text-primary">
                   Device Activity
                 </h3>
                <p className="text-secondary">
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
                       ? 'bg-primary-300 text-white border border-primary-300'
                       : 'text-secondary hover:bg-secondary hover:text-primary'
                   }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                                 <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Shield className="w-8 h-8 text-primary-300" />
                 </div>
                <h4 className="text-lg font-semibold text-primary mb-2">
                  Device Activity Monitor
                </h4>
                <p className="text-secondary text-sm">
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
                                 <h3 className="text-xl font-semibold text-primary">
                   Upcoming Maintenance
                 </h3>
                <p className="text-secondary">
                  Scheduled tasks and alerts
                </p>
              </div>
                             <Shield className="w-5 h-5 text-secondary" />
            </div>

            <div className="space-y-4">
              {upcomingMaintenance.length > 0 ? (
                upcomingMaintenance.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-light hover:bg-secondary transition-colors cursor-pointer"
                    onClick={() => navigate(`/notifications?id=${item.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-primary text-sm mb-1">
                          {item.title}
                        </h4>
                        <p className="text-secondary text-xs mb-2">
                          {item.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {getPriorityIcon(item.priority)}
                            <span className="ml-1 capitalize">{item.priority}</span>
                          </span>
                          <span className="text-xs text-tertiary">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                                             <ArrowRight className="w-4 h-4 text-secondary" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-secondary mx-auto mb-4" />
                  <p className="text-secondary text-sm">
                    No upcoming maintenance scheduled
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-light">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-secondary hover:text-primary"
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
                 <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/devices')}>
           <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
             <Shield className="w-6 h-6 text-primary-300" />
           </div>
          <h4 className="font-semibold text-primary mb-2">Manage Devices</h4>
          <p className="text-secondary text-sm">View and configure your IoT devices</p>
        </div>

                 <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/rules')}>
           <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center mx-auto mb-4">
             <Shield className="w-6 h-6 text-warning-200" />
           </div>
          <h4 className="font-semibold text-primary mb-2">Automation Rules</h4>
          <p className="text-secondary text-sm">Create and manage automation workflows</p>
        </div>

                 <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/analytics')}>
           <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center mx-auto mb-4">
             <Shield className="w-6 h-6 text-success-400" />
           </div>
          <h4 className="font-semibold text-primary mb-2">Analytics</h4>
          <p className="text-secondary text-sm">View detailed performance insights</p>
        </div>

                 <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => setShowTaskManager(true)}>
           <div className="w-12 h-12 bg-error-50 rounded-xl flex items-center justify-center mx-auto mb-4">
             <CheckCircle className="w-6 h-6 text-error-400" />
           </div>
          <h4 className="font-semibold text-primary mb-2">Task Manager</h4>
          <p className="text-secondary text-sm">Organize and track your tasks</p>
        </div>

                 <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/settings')}>
           <div className="w-12 h-12 bg-secondary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
             <Settings className="w-6 h-6 text-secondary" />
           </div>
          <h4 className="font-semibold text-primary mb-2">Settings</h4>
          <p className="text-secondary text-sm">Configure platform preferences</p>
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

      
    </div>
  );
};