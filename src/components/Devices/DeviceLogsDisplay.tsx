import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  Info, 
  XCircle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import { logAPI } from '../../services/api';

interface DeviceLog {
  id: string;
  deviceId: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  message: string;
  category: string;
  source: string;
  metadata?: Record<string, any>;
}

interface DeviceLogsDisplayProps {
  deviceId: string;
}

const DeviceLogsDisplay: React.FC<DeviceLogsDisplayProps> = ({ deviceId }) => {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [deviceId, filterLevel, filterCategory, page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await logAPI.getByDevice(deviceId);
      
      // Filter logs on the client side since the API doesn't support filtering
      let filteredData = response.data;
      
      if (filterLevel !== 'all') {
        filteredData = filteredData.filter((log: DeviceLog) => log.level === filterLevel);
      }
      
      if (filterCategory !== 'all') {
        filteredData = filteredData.filter((log: DeviceLog) => log.category === filterCategory);
      }
      
      // Simple pagination on client side
      const startIndex = (page - 1) * 50;
      const endIndex = startIndex + 50;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      if (page === 1) {
        setLogs(paginatedData);
      } else {
        setLogs(prev => [...prev, ...paginatedData]);
      }
      
      setHasMore(endIndex < filteredData.length);
      setError(null);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError('Failed to load device logs');
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'DEBUG':
        return <FileText className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setLogs([]);
    loadLogs();
  };

  const handleExport = () => {
    const csvContent = [
      'Timestamp,Level,Category,Source,Message',
      ...filteredLogs.map(log => 
        `"${log.timestamp}","${log.level}","${log.category}","${log.source}","${log.message.replace(/"/g, '""')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-logs-${deviceId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Device Logs</h3>
          <p className="text-sm text-gray-600">
            {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Levels</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            <option value="system">System</option>
            <option value="communication">Communication</option>
            <option value="sensor">Sensor</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No logs found</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getLevelIcon(log.level)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-sm text-gray-500">{log.category}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{log.source}</span>
                  </div>
                  
                  <p className="text-sm text-gray-900 mb-2">{log.message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span className="text-blue-600 cursor-pointer hover:underline">
                        View Details
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </div>
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceLogsDisplay;
