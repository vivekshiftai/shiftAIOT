import React, { useEffect, useMemo, useState } from 'react';
import { deviceAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, Search, AlertTriangle } from 'lucide-react';

interface MaintenanceItem {
  id?: string;
  device_id?: string;
  component_name: string;
  maintenance_type: string;
  frequency: string;
  last_maintenance?: string;
  next_maintenance?: string;
  description?: string;
}

// We will derive maintenance data from devices if backend doesn't expose separate endpoint
export const MaintenancePage: React.FC = () => {
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await deviceAPI.getAll();
        const devices = res.data || [];
        // Map device fields to maintenance-like items when available
        const derived: MaintenanceItem[] = devices.map((d: any, idx: number) => ({
          id: d.id || String(idx),
          device_id: d.id,
          component_name: d.name || 'Device',
          maintenance_type: d.maintenance_type || 'preventive',
          frequency: d.maintenance_schedule || '—',
          last_maintenance: d.lastMaintenance || d.updatedAt,
          next_maintenance: d.nextMaintenance || undefined,
          description: d.description || '—'
        }));
        setItems(derived);
      } catch (e: any) {
        setError(e?.message || 'Failed to load maintenance data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const s = search.toLowerCase();
      return (
        (i.component_name || '').toLowerCase().includes(s) ||
        (i.maintenance_type || '').toLowerCase().includes(s) ||
        (i.description || '').toLowerCase().includes(s)
      );
    });
  }, [items, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-600 mt-1">Preventive and corrective maintenance overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Back to Dashboard</button>
          <Link to="/rules" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to Rules</Link>
        </div>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search maintenance items..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-slate-600 mt-4">Loading maintenance data...</p>
        </div>
      )}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wrench className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 truncate" title={item.component_name}>{item.component_name}</h3>
              </div>
              <div className="text-sm text-slate-700">
                <div className="flex justify-between py-1"><span className="text-slate-500">Type</span><span>{item.maintenance_type}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-500">Frequency</span><span>{item.frequency}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-500">Last</span><span>{item.last_maintenance ? new Date(item.last_maintenance).toLocaleDateString() : '—'}</span></div>
                <div className="flex justify-between py-1"><span className="text-slate-500">Next</span><span>{item.next_maintenance ? new Date(item.next_maintenance).toLocaleDateString() : '—'}</span></div>
              </div>
              {item.description && <p className="text-sm text-slate-600 mt-3 line-clamp-3">{item.description}</p>}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center text-slate-600 py-12">
          <AlertTriangle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          No maintenance items match your filters.
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
