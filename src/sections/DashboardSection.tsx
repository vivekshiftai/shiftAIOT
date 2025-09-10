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

import { 
  Clock,
  Settings,
  Shield,
  ArrowRight,
  Cpu,
  Zap,
  Wrench,
  Activity,
  User
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

  // Get unique user IDs from maintenance tasks for fetching user names
  const assigneeIds = useMemo(() => {
    const allTasks = [...upcomingMaintenance, ...todayMaintenance];
    const uniqueIds = [...new Set(allTasks.map(task => task.assignedTo).filter(Boolean))];
    return uniqueIds;
  }, [upcomingMaintenance, todayMaintenance]);

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
        
        // Fetch all maintenance tasks for total count
        const allMaintenanceResponse = await Promise.race([
          maintenanceAPI.getAll(),
          timeoutPromise
        ]) as any;
        
        // Fetch upcoming maintenance tasks for the upcoming section
        const upcomingMaintenanceResponse = await Promise.race([
          maintenanceAPI.getUpcoming(),
          timeoutPromise
        ]) as any;
        
        // Fetch today's maintenance tasks
        const todayMaintenanceResponse = await Promise.race([
          maintenanceAPI.getToday(),
          timeoutPromise
        ]) as any;
        
        logInfo('Dashboard', 'Maintenance API responses received', { 
          allMaintenanceStatus: allMaintenanceResponse.status,
          upcomingMaintenanceStatus: upcomingMaintenanceResponse.status,
          allMaintenanceData: allMaintenanceResponse.data,
          upcomingMaintenanceData: upcomingMaintenanceResponse.data
        });
        
        // Debug: Log the structure of upcoming maintenance response
        console.log('🔍 DEBUG: Upcoming maintenance response structure:', {
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
        console.log('🔍 DEBUG: Upcoming maintenance tasks:', {
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
        
        logError('Dashboard', 'Failed to fetch upcoming maintenance', new Error(errorMessage));
        
        console.error('Maintenance API Error Details:', {
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
        // Fetch rules count
        const rulesResponse = await ruleAPI.getAll();
        const totalRules = rulesResponse.data?.length || 0;
        setRulesCount(totalRules);
        logInfo('Dashboard', 'Rules data fetched successfully', { totalRules });
      } catch (error) {
        logError('Dashboard', 'Failed to fetch rules count', error instanceof Error ? error : new Error('Unknown error'));
        setRulesCount(0);
      }

      try {
        // Fetch users count - using the stats endpoint for better performance
        setUsersLoading(true);
        const usersStatsResponse = await userAPI.getStats();
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
    };

    // Initial fetch
    fetchRealTimeData();

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      logInfo('Dashboard', 'Refreshing real-time data...');
      fetchRealTimeData();
    }, 30000); // 30 seconds

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
            Command Center
          </h1>
          <p className="text-secondary text-lg">
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
          className="animate-fade-in"
        />
        <StatsCard
          title="Total Rules"
          value={metrics.totalRules}
          subtitle="Automation rules"
          icon={Zap}
          color="purple"
          className="animate-fade-in"
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
        <div className="card p-6 border-l-4 border-l-yellow-400 bg-yellow-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800">
                {todayMaintenance.length} Maintenance Task{todayMaintenance.length > 1 ? 's' : ''} Due Today
              </h3>
              <p className="text-yellow-700 text-sm">
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
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              View Tasks
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Device Activity - Smaller */}
        <div className="lg:col-span-1">
          <div className="card p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">
                  Device Activity
                </h3>
                <p className="text-secondary text-sm">
                  Real-time monitoring
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                {['24h', '7d'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedTimeRange === range
                        ? 'bg-primary-300 text-white'
                        : 'text-secondary hover:bg-secondary hover:text-primary'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-6 h-6 text-primary-300" />
                </div>
                <h4 className="text-sm font-semibold text-primary mb-1">
                  Activity Monitor
                </h4>
                <p className="text-secondary text-xs">
                  Telemetry data pending
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Maintenance - Wider */}
        <div className="lg:col-span-3">
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-primary">
                  Upcoming Maintenance
                </h3>
                <p className="text-secondary">
                  All upcoming maintenance tasks
                </p>
              </div>
              <div className="text-right">
                <Wrench className="w-5 h-5 text-secondary mb-1" />
                <p className="text-xs text-secondary">
                  {upcomingMaintenance.length} of {maintenanceCount} total
                </p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {upcomingMaintenance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white border-b border-light">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
                          Task Title
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
                          Assignee
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
                          Due Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light">
                      {upcomingMaintenance.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-secondary transition-colors cursor-pointer"
                          onClick={handleMaintenanceClick}
                        >
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium text-primary">
                              {item.taskName || item.componentName}
                            </div>
                            <div className="text-xs text-secondary">
                              {item.deviceName || 'Device maintenance'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-secondary">
                              {userNamesLoading ? 'Loading...' : getAssigneeDisplayName(item.assignedTo)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              item.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                              item.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                              item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              item.status === 'CANCELLED' ? 'bg-gray-100 text-gray-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.status === 'COMPLETED' ? 'Done' : 
                               item.status === 'ACTIVE' ? 'Active' :
                               item.status === 'OVERDUE' ? 'Overdue' :
                               item.status === 'PENDING' ? 'Pending' :
                               item.status === 'CANCELLED' ? 'Cancelled' : 
                               item.status || 'Unknown'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-secondary">
                              {formatMaintenanceDate(item.nextMaintenance)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                onClick={handleMaintenanceClick}
              >
                View All Maintenance
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
          <h4 className="font-semibold text-primary mb-2">Manage Smart Assets</h4>
          <p className="text-secondary text-sm">View and configure your smart assets</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/device-care?tab=rules')}>
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
          <h4 className="font-semibold text-primary mb-2">Intelligence</h4>
          <p className="text-secondary text-sm">View detailed performance insights</p>
        </div>

        <div className="card p-6 text-center hover-lift cursor-pointer animate-slide-in" onClick={() => navigate('/settings')}>
          <div className="w-12 h-12 bg-secondary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-6 h-6 text-secondary" />
          </div>
          <h4 className="font-semibold text-primary mb-2">Settings</h4>
          <p className="text-secondary text-sm">Configure platform preferences</p>
        </div>
      </div>
    </div>
  );
};