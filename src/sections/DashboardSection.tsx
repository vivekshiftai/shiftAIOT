import React, { useMemo } from 'react';
import { Cpu, Wifi, CheckCircle2, Wrench, CalendarDays, ChevronRight } from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RealtimeChart } from '../components/Dashboard/RealtimeChart';
import { useIoT } from '../contexts/IoTContext';
import { useNavigate } from 'react-router-dom';

export const DashboardSection: React.FC = () => {
  const { devices, notifications, rules } = useIoT();
  const navigate = useNavigate();

  const onlineDevices = useMemo(() => devices.filter(d => d.status === 'ONLINE').length, [devices]);
  const totalDevices = devices.length;

  // Placeholder derived values from existing data (no new API):
  // Maintenance schedules are not a separate entity in types; use notifications tagged as maintenance as proxy
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

  const rulesCompletedThisWeek = rules.filter(r => r.lastTriggered && new Date(r.lastTriggered) >= startOfWeek && new Date(r.lastTriggered) < endOfWeek).length;

  const upcomingMaintenance = notifications
    .filter(n => n.title?.toLowerCase().includes('maintenance'))
    .map(n => ({
      id: n.id as string,
      title: n.title,
      message: n.message,
      timestamp: (n.createdAt || (n as any).timestamp || new Date().toISOString()) as string,
      priority: derivePriority(n.createdAt || (n as any).timestamp)
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(0, 8);

  function derivePriority(dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const diffMs = date.getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 0) return 'overdue';
    if (diffHours <= 24) return 'soon';
    return 'later';
  }

  const handleNavigateDevices = () => navigate('/devices');
  const handleShowActiveDevices = () => navigate('/devices?status=ONLINE');
  const handleShowMaintenanceWeek = () => navigate('/notifications?filter=maintenance&range=this-week');
  const handleShowRules = () => navigate('/rules');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-2">Overview of devices, maintenance, and automation</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Devices"
          value={totalDevices}
          subtitle={`${onlineDevices} online`}
          icon={Cpu}
          color="blue"
          onClick={handleNavigateDevices}
        />
        <StatsCard
          title="Active Devices"
          value={onlineDevices}
          subtitle="Currently online"
          icon={Wifi}
          color="green"
          onClick={handleShowActiveDevices}
        />
        <StatsCard
          title="Maintenance (This Week)"
          value={maintenanceThisWeek.length}
          subtitle="Scheduled tasks"
          icon={Wrench}
          color="yellow"
          onClick={handleShowMaintenanceWeek}
        />
        <StatsCard
          title="Rules Completed"
          value={rulesCompletedThisWeek}
          subtitle="This week"
          icon={CheckCircle2}
          color="red"
          onClick={handleShowRules}
        />
      </div>

      {/* Upcoming Maintenance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">Upcoming Maintenance Schedules</h3>
            <button onClick={handleShowMaintenanceWeek} className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center gap-1">
              View this week <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-3">
            {upcomingMaintenance.length === 0 && (
              <p className="text-slate-500 text-sm">No upcoming maintenance found.</p>
            )}
            {upcomingMaintenance.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  item.priority === 'overdue' ? 'bg-red-100' : item.priority === 'soon' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  <Wrench className={`${item.priority === 'overdue' ? 'text-red-600' : item.priority === 'soon' ? 'text-orange-600' : 'text-blue-600'} w-5 h-5`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{item.title}</p>
                  <p className="text-sm text-slate-600 truncate">{item.message}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays className="w-4 h-4" />
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini chart summary */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">This Week Overview</h4>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              const day = new Date(startOfWeek);
              day.setDate(startOfWeek.getDate() + idx);
              const count = maintenanceThisWeek.filter(n => getNotifDate(n).getDay() === day.getDay()).length;
              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="text-xs text-slate-500">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                  <div className="w-full h-24 bg-slate-100 rounded-md relative overflow-hidden">
                    <div className={`absolute bottom-0 left-0 right-0 bg-yellow-400`} style={{ height: `${Math.min(100, count * 25)}%` }}></div>
                  </div>
                  <div className="text-xs text-slate-600">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Grid (keep simple visuals) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimeChart metric="temperature" title="Temperature Trends" color="#3b82f6" />
        <RealtimeChart metric="humidity" title="Humidity Levels" color="#10b981" />
      </div>
    </div>
  );
};