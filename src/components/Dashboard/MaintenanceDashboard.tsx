import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Target,
  Activity
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchMaintenanceTasks, fetchMaintenanceStats } from '../../store/slices/maintenanceSlice';
import { LoadingSpinner } from '../Loading/LoadingComponents';
import { maintenanceAPI } from '../../services/api';
import { MaintenanceTask } from '../../types';

/**
 * Enhanced maintenance dashboard component with detailed statistics
 * Displays maintenance tasks, schedules, and performance metrics
 */
export const MaintenanceDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, stats, loading, error } = useAppSelector(state => state.maintenance);
  const [todayTasks, setTodayTasks] = useState<MaintenanceTask[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchMaintenanceTasks());
    dispatch(fetchMaintenanceStats());
    fetchTodayMaintenance();
  }, [dispatch]);

  const fetchTodayMaintenance = async () => {
    try {
      setTodayLoading(true);
      const response = await maintenanceAPI.getToday();
      console.log('Today\'s maintenance tasks response:', response.data);
      setTodayTasks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch today\'s maintenance tasks:', error);
    } finally {
      setTodayLoading(false);
    }
  };

  /**
   * Animation variants for staggered card animations
   */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Maintenance Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={cardVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalTasks}</p>
                <p className="text-slate-500 text-sm mt-1">All maintenance tasks</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Completed This Week</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.completedThisWeek}</p>
                <p className="text-slate-500 text-sm mt-1">Tasks finished</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Upcoming Tasks</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.upcomingTasks}</p>
                <p className="text-slate-500 text-sm mt-1">Next 7 days</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.successRate}%</p>
                <p className="text-slate-500 text-sm mt-1">Task completion</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Today's Maintenance Tasks */}
      <motion.div variants={cardVariants}>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Today's Maintenance Tasks - Name, Device, Assigned To & Status
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {todayLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">No maintenance tasks scheduled for today</p>
                <p className="text-slate-500 text-sm mt-1">No tasks with today's date found in the maintenance table</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      task.priority === 'CRITICAL' ? 'bg-red-100' :
                      task.priority === 'HIGH' ? 'bg-orange-100' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100' : 'bg-green-100'
                    }`}>
                      <Wrench className={`w-4 h-4 ${
                        task.priority === 'CRITICAL' ? 'text-red-600' :
                        task.priority === 'HIGH' ? 'text-orange-600' :
                        task.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-slate-800">{task.taskName}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          task.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">Device: {task.deviceName}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Assigned to: {task.assignedTo || 'Unassigned'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">
                        {task.estimatedDuration || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {task.nextMaintenance && new Date(task.nextMaintenance).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Maintenance Performance
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Average Completion Time</span>
                  <span className="text-sm font-bold text-slate-800">{stats.averageCompletionTime}min</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">On-Time Completion</span>
                  <span className="text-sm font-bold text-green-600">88.5%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">Cost Efficiency</span>
                  <span className="text-sm font-bold text-blue-600">91.2%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {tasks
                  .filter(task => task.status === 'completed')
                  .slice(0, 4)
                  .map((task, index) => (
                    <div key={task.id} className="flex items-center gap-3 p-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.deviceName}</p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {task.completedDate && new Date(task.completedDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};