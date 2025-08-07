import React from 'react';
import { X, Bell, Plus, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useIoT } from '../../contexts/IoTContext';
import NotificationService from '../../services/notificationService';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestModal: React.FC<TestModalProps> = ({ isOpen, onClose }) => {
  const { addDevice, assignDevice } = useIoT();
  const notificationService = NotificationService.getInstance();

  if (!isOpen) return null;

  const handleTestNotification = (type: string) => {
    const testDevice = {
      id: 'test-device',
      name: 'Test Device',
      type: 'SENSOR' as const,
      status: 'online' as const,
      location: 'Test Location',
      lastSeen: new Date().toISOString(),
      batteryLevel: 85,
      firmware: 'v1.0.0',
      protocol: 'MQTT' as const,
      tags: ['test']
    };

    switch (type) {
      case 'device_added':
        addDevice({
          name: 'New Test Device',
          type: 'SENSOR',
          status: 'online',
          location: 'Test Location',
          lastSeen: new Date().toISOString(),
          batteryLevel: 100,
          firmware: 'v1.0.0',
          protocol: 'MQTT',
          tags: ['test']
        });
        break;
      case 'device_assigned':
        assignDevice('1', '1');
        break;
      case 'temperature_alert':
        notificationService.onTemperatureAlert(testDevice, 35, '1');
        break;
      case 'battery_low':
        notificationService.onBatteryLow(testDevice, 15, '1');
        break;
      case 'device_offline':
        notificationService.onDeviceStatusChange({ ...testDevice, status: 'offline' }, '1');
        break;
      case 'device_online':
        notificationService.onDeviceStatusChange({ ...testDevice, status: 'online' }, '1');
        break;
      case 'maintenance_due':
        notificationService.onMaintenanceDue(testDevice, '1');
        break;
      case 'rule_triggered':
        notificationService.createNotification({
          type: 'rule_triggered',
          userId: '1',
          data: {
            ruleName: 'Test Rule',
            message: 'This is a test rule notification'
          }
        });
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Test Notifications</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-600 mb-4">
            Click the buttons below to test different types of notifications:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleTestNotification('device_added')}
              className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Add Device</span>
            </button>

            <button
              onClick={() => handleTestNotification('device_assigned')}
              className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Assign Device</span>
            </button>

            <button
              onClick={() => handleTestNotification('temperature_alert')}
              className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Temperature Alert</span>
            </button>

            <button
              onClick={() => handleTestNotification('battery_low')}
              className="flex items-center gap-2 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Low Battery</span>
            </button>

            <button
              onClick={() => handleTestNotification('device_offline')}
              className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Device Offline</span>
            </button>

            <button
              onClick={() => handleTestNotification('device_online')}
              className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Device Online</span>
            </button>

            <button
              onClick={() => handleTestNotification('maintenance_due')}
              className="flex items-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Maintenance Due</span>
            </button>

            <button
              onClick={() => handleTestNotification('rule_triggered')}
              className="flex items-center gap-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <Info className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Rule Triggered</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
