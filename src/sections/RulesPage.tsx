import React, { useEffect, useMemo, useState } from 'react';
import { ruleAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Filter, CheckCircle, Activity } from 'lucide-react';

interface RuleItem {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  conditions?: Array<{ id: string; type: string; metric?: string; operator?: string; value?: any; deviceId?: string; }>;
  actions?: Array<{ id: string; type: string; config?: Record<string, any> }>;
}

export const RulesPage: React.FC = () => {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await ruleAPI.getAll();
        setRules(res.data || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load rules');
      } finally {
        setLoading(false);
      }
    };
    loadRules();
  }, []);

  const filtered = useMemo(() => {
    return rules.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || (status === 'active' ? r.active : !r.active);
      return matchesSearch && matchesStatus;
    });
  }, [rules, search, status]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rules</h1>
          <p className="text-slate-600 mt-1">Automation rules for your devices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Back to Dashboard</button>
          <Link to="/maintenance" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to Maintenance</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <input className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={status} onChange={e => setStatus(e.target.value as any)} className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-slate-600 mt-4">Loading rules...</p>
        </div>
      )}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      {/* Rules List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(rule => (
            <div key={rule.id} className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-900 truncate" title={rule.name}>{rule.name}</h3>
                {rule.active ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3" /> Active</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full">Inactive</span>
                )}
              </div>
              {rule.description && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{rule.description}</p>}

              {/* Conditions */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Conditions</h4>
                {rule.conditions && rule.conditions.length > 0 ? (
                  <ul className="space-y-2">
                    {rule.conditions.map(c => (
                      <li key={c.id} className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <span className="font-medium">{c.type}</span>
                        {c.metric && <> • {c.metric}</>} {c.operator && <> {c.operator} </>} {c.value !== undefined && <>{String(c.value)}</>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No conditions</p>
                )}
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Actions</h4>
                {rule.actions && rule.actions.length > 0 ? (
                  <ul className="space-y-2">
                    {rule.actions.map(a => (
                      <li key={a.id} className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <span className="font-medium">{a.type}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No actions</p>
                )}
              </div>

              {/* Meta */}
              <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
                <Activity className="w-3 h-3" />
                <span>Updated {rule.updatedAt ? new Date(rule.updatedAt).toLocaleString() : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RulesPage;
