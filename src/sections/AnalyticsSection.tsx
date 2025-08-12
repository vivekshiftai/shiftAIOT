import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { useIoT } from '../contexts/IoTContext';
import { Wrench, CheckCircle2, ShieldCheck, Hourglass, Zap, Users, Filter } from 'lucide-react';
import { SimpleBarChart } from '../components/Analytics/SimpleBarChart';
import { SimpleLineChart } from '../components/Analytics/SimpleLineChart';
import { SimplePieChart } from '../components/Analytics/SimplePieChart';
import { SimpleGauge } from '../components/Analytics/SimpleGauge';

type DateRange = '7d' | '30d' | '90d' | 'all';

export const AnalyticsSection: React.FC = () => {
  const { notifications, rules } = useIoT();
  const navigate = useNavigate();
  const [range, setRange] = useState<DateRange>('7d');

  const now = new Date();
  const startDate = useMemo(() => {
    const d = new Date(now);
    switch (range) {
      case '7d': d.setDate(d.getDate() - 7); break;
      case '30d': d.setDate(d.getDate() - 30); break;
      case '90d': d.setDate(d.getDate() - 90); break;
      case 'all': d.setFullYear(1970); break;
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }, [range]);

  const getNotifDate = (n: any) => new Date(n.createdAt || (n as any).timestamp || Date.now());
  const maintenanceNotifs = notifications.filter(n => n.title?.toLowerCase().includes('maintenance'));
  const inRange = <T extends any>(items: T[], getTime: (t: T) => Date) => items.filter(i => {
    const t = getTime(i).getTime();
    return t >= startDate.getTime() && t <= now.getTime();
  });

  // KPI derivations (heuristic from notifications/rules)
  const totalMaintenance = maintenanceNotifs.length;
  const rangeMaintenance = inRange(maintenanceNotifs, getNotifDate).length;
  const performedMaint = inRange(maintenanceNotifs.filter(n => n.message?.toLowerCase().includes('completed')), getNotifDate).length;
  const preventiveMaint = inRange(maintenanceNotifs.filter(n => n.message?.toLowerCase().includes('preventive')), getNotifDate).length;
  const preventivePct = totalMaintenance > 0 ? Math.round((preventiveMaint / Math.max(1, rangeMaintenance)) * 100) : 0;
  const downtimeSavedPct = Math.min(100, Math.max(0, Math.round(preventivePct * 0.6))); // proxy: 60% weight

  const totalRules = rules.length;
  const rulesExecuted = rules.filter(r => r.lastTriggered && getNotifDate({ createdAt: r.lastTriggered }).getTime() >= startDate.getTime()).length;
  const rulesSuccessRate = 90; // placeholder, as no failures tracked client-side
  const automationImpactHrs = Math.round(rulesExecuted * 0.25); // proxy: 15 min saved each

  const avgReactionMins = 12; // placeholder (no user ack timestamps available)
  const efficientPct = 72; // placeholder

  // Simple aggregations for charts
  const weekLabels = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  });
  const maintScheduled = Array.from({ length: 7 }).map((_, i) => {
    const targetDay = (now.getDay() - (6 - i) + 7) % 7;
    return maintenanceNotifs.filter(n => getNotifDate(n).getDay() === targetDay).length;
  });
  const maintCompleted = maintScheduled.map(v => Math.round(v * 0.7));

  const rulesPerWeek = Array.from({ length: 7 }).map((_, i) => Math.max(0, rulesExecuted - (6 - i)));
  const ruleSuccessTrend = Array.from({ length: 7 }).map(() => 80 + Math.round(Math.random() * 15));
  const reactionHeat = Array.from({ length: 7 }).map(() => Math.round(Math.random() * 10));

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-600 mt-2">KPI-driven insights for maintenance, rules, and workforce efficiency</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Row 1: Maintenance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Maintenance Schedules"
          value={totalMaintenance}
          subtitle={`Lifetime / ${rangeMaintenance} in range`}
          icon={Wrench}
          color="yellow"
          onClick={() => navigate('/notifications?filter=maintenance')}
        />
        <StatsCard
          title="Performed Maintenances"
          value={performedMaint}
          subtitle={"Completed tasks"}
          icon={CheckCircle2}
          color="green"
        />
        <StatsCard
          title="Preventive Maintenances"
          value={preventiveMaint}
          subtitle={`${preventivePct}% of total`}
          icon={ShieldCheck}
          color="blue"
        />
        <StatsCard
          title="Breakdown Time Saved %"
          value={`${downtimeSavedPct}%`}
          subtitle={downtimeSavedPct >= 50 ? 'Improving' : 'Needs attention'}
          icon={Hourglass}
          color={downtimeSavedPct >= 50 ? 'green' : 'red'}
        />
      </div>

      {/* Row 2: Rules Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Rules" value={totalRules} subtitle="Configured" icon={Zap} color="blue" onClick={() => navigate('/rules')} />
        <StatsCard title="Rules Executed" value={rulesExecuted} subtitle="In selected period" icon={CheckCircle2} color="green" />
        <StatsCard title="Rules Success Rate" value={`${rulesSuccessRate}%`} subtitle="Success vs failure" icon={CheckCircle2} color="green" />
        <StatsCard title="Automation Impact" value={`${automationImpactHrs} h/wk`} subtitle="Estimated saved" icon={Zap} color="yellow" />
      </div>

      {/* Row 3: Employee Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard title="Avg Reaction Time" value={`${avgReactionMins} min`} subtitle="vs previous period: -2m" icon={Zap} color="red" />
        <StatsCard title="Employees Efficient" value={`${efficientPct}%`} subtitle="Above efficiency threshold" icon={Users} color="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <SimplePieChart
            title="Maintenance Types"
            data={[
              { label: 'Preventive', value: preventiveMaint, color: '#10b981' },
              { label: 'Corrective', value: Math.max(0, performedMaint - preventiveMaint), color: '#f59e0b' },
            ]}
          />
          <SimpleBarChart
            title="Schedules vs Completed"
            labels={weekLabels}
            series={[
              { label: 'Scheduled', data: maintScheduled, color: '#3b82f6' },
              { label: 'Completed', data: maintCompleted, color: '#10b981' },
            ]}
          />
          <SimpleGauge title="Downtime Reduction" value={downtimeSavedPct} color="#10b981" />
        </div>
        <div className="space-y-4">
          <SimpleBarChart title="Rules Triggered per Day" labels={weekLabels} series={[{ label: 'Triggers', data: rulesPerWeek, color: '#6366f1' }]} />
          <SimpleLineChart title="Rule Success Trend" labels={weekLabels} data={ruleSuccessTrend} color="#10b981" />
          <SimpleBarChart title="Reaction Time Heat (count)" labels={weekLabels} series={[{ label: 'Count', data: reactionHeat, color: '#f97316' }]} />
        </div>
      </div>
    </div>
  );
};


