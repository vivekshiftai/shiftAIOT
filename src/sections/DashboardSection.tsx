import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserDisplayNames } from '../hooks/useUserDisplayName';
import { StatsCard } from '../components/Dashboard/StatsCard';
import Skeleton, { SkeletonCard } from '../components/UI/Skeleton';
import Button from '../components/UI/Button';

import { maintenanceAPI, ruleAPI, userAPI } from '../services/api';
import { logError, logInfo } from '../utils/logger';
import { cacheService, CacheConfigs } from '../utils/cacheService';

import { 
  Clock,
  Settings,
  Shield,
  ArrowRight,
  Cpu,
  Zap,
  Wrench,
  Activity,
  User,
  Bell
} from 'lucide-react';

export const DashboardSection: React.FC = () => {
  const { devices, loading } = useIoT();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);
  const [todayMaintenance, setTodayMaintenance] = useState<any[]>([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);
  const [rulesCount, setRulesCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersStats, setUsersStats] = useState<any>(null);

  // State for upcoming maintenance notifications (fetched separately)
  const [upcomingMaintenanceNotifications, setUpcomingMaintenanceNotifications] = useState<any[]>([]);

  // Get unique user IDs from maintenance tasks for fetching user names
  const assigneeIds = useMemo(() => {
    const allTasks = [...upcomingMaintenance, ...todayMaintenance, ...upcomingMaintenanceNotifications];
    const uniqueIds = [...new Set(allTasks.map(task => task.assignedTo).filter(Boolean))];
    return uniqueIds;
  }, [upcomingMaintenance, todayMaintenance, upcomingMaintenanceNotifications]);

  // Fetch user display names
  const { displayNames, loading: userNamesLoading } = useUserDisplayNames(assigneeIds);

  // Helper function to format assignee name
  const getAssigneeDisplayName = (assignedTo: string | null | undefined): string => {
    if (!assignedTo) return 'Unassigned';
    
    const userName = displayNames[assignedTo] || `User ${assignedTo}`;
    
    // If the assignee is the current user, add "(YOU)"
    if (currentUser && assignedTo === currentUser.id) {
      return `${userName} (YOU)`;
    }
    
    return userName;
  };

  // Fetch real-time data
  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        // Fetch all maintenance tasks and upcoming maintenance tasks
        setMaintenanceLoading(true);
        logInfo('Dashboard', 'Attempting to fetch maintenance data...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Maintenance API timeout')), 10000); // 10 second timeout
        });
        
        // Fetch all maintenance tasks for total count with caching
        const allMaintenanceResponse = await cacheService.cachedApiCall(
          'dashboard_all_maintenance',
          () => Promise.race([maintenanceAPI.getAll(), timeoutPromise]),
          CacheConfigs.SHORT // 2 minute cache for dashboard data
        ) as any;
        
        // Fetch upcoming maintenance tasks for the upcoming section with caching
        const upcomingMaintenanceResponse = await cacheService.cachedApiCall(
          'dashboard_upcoming_maintenance',
          () => Promise.race([maintenanceAPI.getUpcoming(), timeoutPromise]),
          CacheConfigs.SHORT // 2 minute cache
        ) as any;
        
        // Fetch today's maintenance tasks with caching
        const todayMaintenanceResponse = await cacheService.cachedApiCall(
          'dashboard_today_maintenance',
          () => Promise.race([maintenanceAPI.getToday(), timeoutPromise]),
          CacheConfigs.SHORT // 2 minute cache
        ) as any;
        
        logInfo('Dashboard', 'Maintenance API responses received', { 
          allMaintenanceStatus: allMaintenanceResponse.status,
          upcomingMaintenanceStatus: upcomingMaintenanceResponse.status,
          allMaintenanceData: allMaintenanceResponse.data,
          upcomingMaintenanceData: upcomingMaintenanceResponse.data
        });
        
        // Debug: Log the structure of upcoming maintenance response
        logInfo('Dashboard', 'Upcoming maintenance response structure', {
          status: upcomingMaintenanceResponse.status,
          data: upcomingMaintenanceResponse.data,
          upcomingMaintenance: upcomingMaintenanceResponse.data?.upcomingMaintenance,
          totalCount: upcomingMaintenanceResponse.data?.totalCount
        });
        
        
        // Check if any maintenance tasks have missing device names and update them
        const allMaintenanceData = allMaintenanceResponse.data || [];
        const hasMissingDeviceNames = allMaintenanceData.some((task: any) => 
          !task.deviceName || task.deviceName === 'N/A' || task.deviceName.trim() === ''
        );
        
        if (hasMissingDeviceNames) {
          logInfo('Dashboard', 'Found maintenance tasks with missing device names, updating...');
          try {
            await maintenanceAPI.updateDeviceNames();
            logInfo('Dashboard', 'Device names updated successfully');
            // Refetch maintenance data to get updated device names
            const updatedAllMaintenanceResponse = await maintenanceAPI.getAll();
            const updatedUpcomingMaintenanceResponse = await maintenanceAPI.getUpcoming();
            const updatedTodayMaintenanceResponse = await maintenanceAPI.getToday();
            
            setMaintenanceCount(updatedAllMaintenanceResponse.data?.length || 0);
            setUpcomingMaintenance(updatedUpcomingMaintenanceResponse.data?.upcomingMaintenance || []);
            setTodayMaintenance(updatedTodayMaintenanceResponse.data || []);
            
            logInfo('Dashboard', 'Maintenance data refreshed with updated device names');
          } catch (updateErr) {
            logError('Dashboard', 'Failed to update device names', updateErr instanceof Error ? updateErr : new Error(String(updateErr)));
            // Don't fail the entire data fetch if device name update fails
          }
        }
        
        // Set total count from all maintenance tasks
        const totalMaintenanceCount = allMaintenanceResponse.data?.length || 0;
        setMaintenanceCount(totalMaintenanceCount);
        
        // Set upcoming maintenance for the upcoming section
        const upcomingTasks = upcomingMaintenanceResponse.data?.upcomingMaintenance || [];
        setUpcomingMaintenance(upcomingTasks);
        
        // Debug: Log upcoming tasks details
        logInfo('Dashboard', 'Upcoming maintenance tasks', {
          count: upcomingTasks.length,
          tasks: upcomingTasks.map((task: any) => ({
            id: task.id,
            taskName: task.taskName,
            nextMaintenance: task.nextMaintenance,
            status: task.status,
            deviceName: task.deviceName
          }))
        });
        
        // Set today's maintenance tasks
        const todayTasks = todayMaintenanceResponse.data || [];
        setTodayMaintenance(todayTasks);
        
        
        // Log sample data to verify backend data structure
        if (upcomingTasks.length > 0) {
          const sampleTask = upcomingTasks[0];
          logInfo('Dashboard', 'Sample upcoming maintenance task data from backend', {
            id: sampleTask.id,
            taskName: sampleTask.taskName,
            status: sampleTask.status,
            nextMaintenance: sampleTask.nextMaintenance,
            assignedTo: sampleTask.assignedTo,
            deviceName: sampleTask.deviceName
          });
        }
        
        if (todayTasks.length > 0) {
          const sampleTodayTask = todayTasks[0];
          logInfo('Dashboard', 'Sample today maintenance task data from backend', {
            id: sampleTodayTask.id,
            taskName: sampleTodayTask.taskName,
            status: sampleTodayTask.status,
            nextMaintenance: sampleTodayTask.nextMaintenance,
            assignedTo: sampleTodayTask.assignedTo,
            deviceName: sampleTodayTask.deviceName
          });
        }
        
        logInfo('Dashboard', 'Maintenance data fetched successfully', { 
          totalCount: totalMaintenanceCount,
          upcomingCount: upcomingTasks.length,
          todayCount: todayTasks.length
        });
        
        // Log dashboard icon updates
        logInfo('Dashboard', 'Dashboard icons updated with appropriate icons for each metric', {
          totalDevices: 'Cpu icon',
          activeDevices: 'Wifi icon', 
          totalRules: 'Zap icon',
          totalMaintenance: 'Wrench icon',
          deviceActivity: 'Activity icon',
          upcomingMaintenance: 'Wrench icon'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = error instanceof Error ? error.stack : 'No stack trace';
        
        logError('Dashboard', 'Failed to fetch upcoming maintenance', error instanceof Error ? error : new Error('Unknown error'), {
          message: errorMessage,
          details: errorDetails,
          error: error,
          timestamp: new Date().toISOString(),
          endpoint: '/api/devices/maintenance/upcoming'
        });
        
        
        setUpcomingMaintenance([]);
        setMaintenanceCount(0);
      } finally {
        setMaintenanceLoading(false);
      }

       try {
         // Fetch rules count with caching
         const rulesResponse = await cacheService.cachedApiCall(
           'dashboard_rules_count',
           () => ruleAPI.getAll(),
           CacheConfigs.MEDIUM // 5 minute cache for rules
         );
         const totalRules = rulesResponse.data?.length || 0;
         setRulesCount(totalRules);
         logInfo('Dashboard', 'Rules data fetched successfully', { totalRules });
       } catch (error) {
         logError('Dashboard', 'Failed to fetch rules count', error instanceof Error ? error : new Error('Unknown error'));
         setRulesCount(0);
       }

      try {
        // Fetch users count - using the stats endpoint for better performance with caching
        setUsersLoading(true);
        const usersStatsResponse = await cacheService.cachedApiCall(
          'dashboard_users_stats',
          () => userAPI.getStats(),
          CacheConfigs.LONG // 15 minute cache for user stats
        );
        const totalUsers = usersStatsResponse.data?.totalUsers || 0;
        setUsersCount(totalUsers);
        setUsersStats(usersStatsResponse.data);
        logInfo('Dashboard', 'Users stats fetched successfully from database', { 
          totalUsers,
          activeUsers: usersStatsResponse.data?.activeUsers || 0,
          adminUsers: usersStatsResponse.data?.adminUsers || 0,
          organizationId: usersStatsResponse.data?.organizationId
        });
      } catch (error) {
        logError('Dashboard', 'Failed to fetch users stats, falling back to getAll', error instanceof Error ? error : new Error('Unknown error'));
        
        // Fallback to getAll if stats endpoint fails
        try {
          const usersResponse = await userAPI.getAll();
          const totalUsers = usersResponse.data?.length || 0;
          setUsersCount(totalUsers);
          logInfo('Dashboard', 'Users data fetched successfully via fallback', { totalUsers });
        } catch (fallbackError) {
          logError('Dashboard', 'Failed to fetch users count via fallback', fallbackError instanceof Error ? fallbackError : new Error('Unknown error'));
          setUsersCount(0);
        }
       } finally {
         setUsersLoading(false);
       }

       // Fetch upcoming maintenance notifications (from today onwards)
       try {
         logInfo('Dashboard', 'Fetching upcoming maintenance notifications...');
         const upcomingNotificationsResponse = await maintenanceAPI.getUpcomingFromToday();
         
         if (upcomingNotificationsResponse.data) {
           // Limit to 5 most recent notifications
           const notifications = Array.isArray(upcomingNotificationsResponse.data) 
             ? upcomingNotificationsResponse.data.slice(0, 5)
             : [];
           
           setUpcomingMaintenanceNotifications(notifications);
           logInfo('Dashboard', 'Upcoming maintenance notifications fetched successfully', { 
             count: notifications.length 
           });
         }
       } catch (error) {
         logError('Dashboard', 'Failed to fetch upcoming maintenance notifications, falling back to existing data', error instanceof Error ? error : new Error('Unknown error'));
         
         // Fallback: Filter existing upcomingMaintenance data on frontend
         const currentDate = new Date();
         currentDate.setHours(0, 0, 0, 0);
         
         const fallbackNotifications = upcomingMaintenance.filter(maintenance => {
           if (!maintenance.nextMaintenance) return false;
           
           try {
             const maintenanceDate = new Date(maintenance.nextMaintenance);
             maintenanceDate.setHours(0, 0, 0, 0);
             return maintenanceDate.getTime() >= currentDate.getTime();
           } catch (error) {
             return false;
           }
         }).slice(0, 5);
         
         setUpcomingMaintenanceNotifications(fallbackNotifications);
       }
     };

     // Initial fetch
     fetchRealTimeData();

    // Set up periodic refresh every 5 minutes (much less frequent)
    const intervalId = setInterval(() => {
      logInfo('Dashboard', 'Periodic refresh of maintenance data...');
      fetchRealTimeData();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Calculate metrics with real-time data
  const metrics = useMemo(() => {
    const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
    const totalDevices = devices.length;
    
    return {
      totalDevices,
      onlineDevices,
      totalRules: rulesCount, // Use real-time count from API
      totalMaintenance: maintenanceCount, // Use real-time count from API
      totalUsers: usersCount, // Use real-time count from API
      pendingMaintenance: upcomingMaintenance.length,
      todayMaintenance: todayMaintenance.length,
      completedMaintenance: 0 // This would need to be calculated from completed tasks
    };
  }, [devices, rulesCount, maintenanceCount, usersCount, upcomingMaintenance, todayMaintenance]);

  // Handle maintenance card click
  const handleMaintenanceClick = () => {
    navigate('/device-care?tab=maintenance');
  };

  // Format maintenance date
  const formatMaintenanceDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not scheduled';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        logError('Dashboard', 'Invalid date format received from backend', new Error(`Invalid date: ${dateString}`));
        return 'Invalid date';
      }
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Reset time to compare only dates
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      if (date.getTime() === today.getTime()) {
        return 'Today';
      } else if (date.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      logError('Dashboard', 'Error formatting maintenance date', error instanceof Error ? error : new Error('Unknown error'));
      return 'Invalid date';
    }
  };

  // Navigation handlers
  const handleNavigateDevices = () => navigate('/devices');
  const handleNavigateUsers = () => navigate('/users');
  const handleNavigateRules = () => navigate('/device-care');

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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">
            Command Center
          </h1>
          <p className="text-secondary text-sm sm:text-lg">
            Welcome back! Here's what's happening with your smart assets.
          </p>
        </div>
        
        {/* <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddDevice}
            className="btn-secondary"
          >
            Add Asset
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Eye className="w-4 h-4" />}
            onClick={() => navigate('/analytics')}
            className="btn-primary"
          >
            View Intelligence
          </Button>
        </div> */}
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Assets"
          value={metrics.totalDevices}
          subtitle={`${metrics.onlineDevices} active`}
          icon={Cpu}
          color="blue"
          onClick={handleNavigateDevices}
          className="hover-lift animate-fade-in"
        />
        <StatsCard
          title="Total Users"
          value={usersLoading ? '...' : (metrics.totalUsers > 0 ? metrics.totalUsers : '0')}
          subtitle={usersLoading ? 'Loading...' : (usersStats ? `${usersStats.activeUsers || 0} active, ${usersStats.adminUsers || 0} admins` : 'Registered users')}
          icon={User}
          color="green"
          onClick={handleNavigateUsers}
          className="hover-lift animate-fade-in cursor-pointer"
        />
        <StatsCard
          title="Total Rules"
          value={metrics.totalRules}
          subtitle="Automation rules"
          icon={Zap}
          color="purple"
          onClick={handleNavigateRules}
          className="hover-lift animate-fade-in cursor-pointer"
        />
        <StatsCard
          title="Total Maintenance"
          value={maintenanceLoading ? '...' : (metrics.totalMaintenance > 0 ? metrics.totalMaintenance : '0')}
          subtitle={maintenanceLoading ? 'Loading...' : (metrics.totalMaintenance > 0 ? `${metrics.todayMaintenance} today, ${metrics.pendingMaintenance} upcoming` : 'No maintenance tasks')}
          icon={Wrench}
          color="yellow"
          onClick={handleMaintenanceClick}
          className="hover-lift animate-fade-in cursor-pointer"
        />
      </div>

      {/* Today's Maintenance Alert */}
      {todayMaintenance.length > 0 && (
        <div className="card p-6 border-l-4 border-l-warning-400 bg-warning-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-warning-800">
                {todayMaintenance.length} Maintenance Task{todayMaintenance.length > 1 ? 's' : ''} Due Today
              </h3>
              <p className="text-warning-700 text-sm">
                {todayMaintenance.length > 1 ? 'Tasks' : 'Task'} scheduled for completion today
                {currentUser && todayMaintenance.some(task => task.assignedTo === currentUser.id) && (
                  <span className="ml-2 font-medium">• You have {todayMaintenance.filter(task => task.assignedTo === currentUser.id).length} task{todayMaintenance.filter(task => task.assignedTo === currentUser.id).length > 1 ? 's' : ''} assigned</span>
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaintenanceClick}
              className="border-warning-300 text-warning-700 hover:bg-warning-100"
            >
              View Tasks
            </Button>
          </div>
        </div>
      )}


      {/* Upcoming Maintenance Notifications */}
      {upcomingMaintenanceNotifications.length > 0 && (
        <div className="card p-6 border-l-4 border-l-blue-400 bg-blue-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-800">
                Upcoming Maintenance Notifications
              </h3>
              <p className="text-blue-700 text-sm">
                {upcomingMaintenanceNotifications.length} maintenance task{upcomingMaintenanceNotifications.length > 1 ? 's' : ''} scheduled
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaintenanceClick}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              View All
            </Button>
          </div>
          
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-blue-100 border-b border-blue-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-blue-800">Task Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-blue-800">Device Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-blue-800">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-blue-800">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {upcomingMaintenanceNotifications.map((maintenance) => (
                  <tr
                    key={maintenance.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={handleMaintenanceClick}
                  >
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {maintenance.taskName || maintenance.componentName || 'Maintenance Task'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        {maintenance.deviceName || 'Unknown Device'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        {userNamesLoading ? 'Loading...' : getAssigneeDisplayName(maintenance.assignedTo)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">
                        {formatMaintenanceDate(maintenance.nextMaintenance)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/devices')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary-600" />
          </div>
          <h4 className="font-semibold text-primary mb-2">Manage Smart Assets</h4>
          <p className="text-secondary text-sm">View and configure your smart assets</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/device-care?tab=rules')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-warning-600" />
          </div>
          <h4 className="font-semibold text-primary mb-2">Automation Rules</h4>
          <p className="text-secondary text-sm">Create and manage automation workflows</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/analytics')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-success-600" />
          </div>
          <h4 className="font-semibold text-primary mb-2">Intelligence</h4>
          <p className="text-secondary text-sm">View detailed performance insights</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/settings')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-secondary-600" />
          </div>
          <h4 className="font-semibold text-primary mb-2">Settings</h4>
          <p className="text-secondary text-sm">Configure platform preferences</p>
        </div>
      </div>
    </div>
  );
};