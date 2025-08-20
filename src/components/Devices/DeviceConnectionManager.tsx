import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Eye, EyeOff, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { DeviceConnection } from '../../types';
import { deviceConnectionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface DeviceConnectionManagerProps {
  deviceId: string;
  onClose: () => void;
}

export const DeviceConnectionManager: React.FC<DeviceConnectionManagerProps> = ({ deviceId, onClose }) => {
  const { hasPermission } = useAuth();
  const [connections, setConnections] = useState<DeviceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newConnection, setNewConnection] = useState({
    connectionType: 'MQTT' as DeviceConnection['connectionType'],
    brokerUrl: '',
    username: '',
    password: '',
    topic: '',
    port: 1883,
    apiKey: '',
    webhookUrl: ''
  });

  useEffect(() => {
    loadConnections();
  }, [deviceId]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await deviceConnectionAPI.getAll();
      const deviceConnections = response.data.filter((conn: DeviceConnection) => conn.deviceId === deviceId);
      setConnections(deviceConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConnection = async () => {
    if (!hasPermission('DEVICE_WRITE')) {
      alert('You do not have permission to add connections.');
      return;
    }

    try {
      const connectionData = {
        ...newConnection,
        deviceId,
        status: 'DISCONNECTED' as DeviceConnection['status']
      };

      await deviceConnectionAPI.create(connectionData);
      setShowAddForm(false);
      setNewConnection({
        connectionType: 'MQTT',
        brokerUrl: '',
        username: '',
        password: '',
        topic: '',
        port: 1883,
        apiKey: '',
        webhookUrl: ''
      });
      loadConnections();
    } catch (error) {
      console.error('Failed to add connection:', error);
      alert('Failed to add connection');
    }
  };

  const handleConnect = async (connectionId: string) => {
    if (!hasPermission('DEVICE_WRITE')) {
      alert('You do not have permission to connect devices.');
      return;
    }

    try {
      await deviceConnectionAPI.connect(deviceId);
      loadConnections();
    } catch (error) {
      console.error('Failed to connect device:', error);
      alert('Failed to connect device');
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!hasPermission('DEVICE_WRITE')) {
      alert('You do not have permission to disconnect devices.');
      return;
    }

    try {
      await deviceConnectionAPI.disconnect(deviceId);
      loadConnections();
    } catch (error) {
      console.error('Failed to disconnect device:', error);
      alert('Failed to disconnect device');
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!hasPermission('DEVICE_DELETE')) {
      alert('You do not have permission to delete connections.');
      return;
    }

    if (confirm('Are you sure you want to delete this connection?')) {
      try {
        await deviceConnectionAPI.delete(deviceId);
        loadConnections();
      } catch (error) {
        console.error('Failed to delete connection:', error);
        alert('Failed to delete connection');
      }
    }
  };

  const getStatusIcon = (status: DeviceConnection['status']) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'DISCONNECTED':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'CONNECTING':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: DeviceConnection['status']) => {
    switch (status) {
      case 'CONNECTED':
        return 'text-green-600 bg-green-50';
      case 'DISCONNECTED':
        return 'text-slate-600 bg-slate-50';
      case 'CONNECTING':
        return 'text-blue-600 bg-blue-50';
      case 'ERROR':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Device Connections</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-5 h-5 text-slate-600">×</div>
            </button>
          </div>
          <p className="text-slate-600 mt-2">Manage IoT device connections and communication protocols.</p>
        </div>

        <div className="p-6">
          {/* Connection List */}
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(connection.status)}
                    <div>
                      <h3 className="font-semibold text-slate-800">{connection.connectionType}</h3>
                      <p className="text-sm text-slate-600">
                        {connection.brokerUrl || connection.webhookUrl || 'No URL configured'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(connection.status)}`}>
                      {connection.status}
                    </span>
                    
                                         {hasPermission('DEVICE_WRITE') && (
                      <>
                        {connection.status === 'DISCONNECTED' ? (
                          <button
                            onClick={() => handleConnect(connection.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Connect"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDisconnect(connection.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Disconnect"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                    
                    {hasPermission('DEVICE_DELETE') && (
                      <button
                        onClick={() => handleDeleteConnection(connection.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

                     {/* Add Connection Form */}
           {showAddForm && hasPermission('DEVICE_WRITE') && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-slate-800 mb-4">Add New Connection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Connection Type</label>
                  <select
                    value={newConnection.connectionType}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, connectionType: e.target.value as DeviceConnection['connectionType'] }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MQTT">MQTT</option>
                    <option value="HTTP">HTTP</option>
                    <option value="WEBSOCKET">WebSocket</option>
                    <option value="COAP">COAP</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                  </select>
                </div>

                {newConnection.connectionType === 'MQTT' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Broker URL</label>
                      <input
                        type="text"
                        value={newConnection.brokerUrl}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, brokerUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="mqtt.broker.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                      <input
                        type="text"
                        value={newConnection.topic}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, topic: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="sensors/temperature"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={newConnection.username}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="mqtt_user"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newConnection.password}
                          onChange={(e) => setNewConnection(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="mqtt_password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                      <input
                        type="number"
                        value={newConnection.port}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1883"
                      />
                    </div>
                  </>
                )}

                {newConnection.connectionType === 'HTTP' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Webhook URL</label>
                      <input
                        type="text"
                        value={newConnection.webhookUrl}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://webhook.site/your-url"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                      <input
                        type="text"
                        value={newConnection.apiKey}
                        onChange={(e) => setNewConnection(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="your-api-key"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddConnection}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add Connection
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

                     {/* Add Connection Button */}
           {!showAddForm && hasPermission('DEVICE_WRITE') && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Connection
            </button>
          )}

          {connections.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">No connections configured</h3>
              <p className="text-slate-600 mb-4">
                                 {hasPermission('DEVICE_WRITE') 
                   ? 'Add a connection to enable communication with this device.'
                   : 'No connections are configured for this device.'
                 }
              </p>
                             {hasPermission('DEVICE_WRITE') && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add First Connection
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
