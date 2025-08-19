import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Shield, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Plus,
  Clock,
  Zap,
  Settings
} from 'lucide-react';
import { IoTRule, MaintenanceTask } from '../../services/pdfprocess';

interface DeviceRulesManagerProps {
  deviceId: string;
  deviceName: string;
  onClose: () => void;
}

// Mock data - in real app, this would come from API
const mockDeviceRules: IoTRule[] = [
  {
    condition: 'Temperature exceeds 85°C',
    action: 'Send alert to maintenance team',
    category: 'monitoring',
    priority: 'high'
  },
  {
    condition: 'Operating hours reach 1000',
    action: 'Schedule preventive maintenance',
    category: 'maintenance',
    priority: 'medium'
  },
  {
    condition: 'Pressure drops below 2.5 bar',
    action: 'Activate backup pump system',
    category: 'alert',
    priority: 'high'
  }
];

const mockMaintenanceData: MaintenanceTask[] = [
  {
    task: 'Filter Assembly',
    frequency: 'Every 3 months',
    category: 'preventive',
    description: 'Replace air filters to maintain optimal performance'
  },
  {
    task: 'Motor Bearings',
    frequency: 'Every 6 months',
    category: 'preventive',
    description: 'Lubricate and inspect motor bearings for wear'
  }
];

export const DeviceRulesManager: React.FC<DeviceRulesManagerProps> = ({
  deviceId,
  deviceName,
  onClose
}) => {
  const [rules, setRules] = useState<IoTRule[]>(mockDeviceRules);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceTask[]>(mockMaintenanceData);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newRule, setNewRule] = useState<Partial<IoTRule>>({
    category: 'monitoring',
    priority: 'medium'
  });
  const [newMaintenance, setNewMaintenance] = useState<Partial<MaintenanceTask>>({
    task: '',
    category: 'preventive',
    frequency: 'Monthly'
  });

  const getRuleIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'monitoring':
        return <Target className="w-4 h-4" />;
      case 'maintenance':
        return <Shield className="w-4 h-4" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleAddRule = () => {
    if (newRule.condition && newRule.action) {
      const rule: IoTRule = {
        condition: newRule.condition,
        action: newRule.action,
        category: newRule.category || 'monitoring',
        priority: newRule.priority || 'medium'
      };
      setRules([...rules, rule]);
      setNewRule({
        category: 'monitoring',
        priority: 'medium'
      });
      setShowAddRule(false);
    }
  };

  const handleAddMaintenance = () => {
    if (newMaintenance.task && newMaintenance.frequency) {
      const maintenance: MaintenanceTask = {
        task: newMaintenance.task,
        frequency: newMaintenance.frequency,
        category: newMaintenance.category || 'preventive',
        description: newMaintenance.description || ''
      };
      setMaintenanceData([...maintenanceData, maintenance]);
      setNewMaintenance({
        task: '',
        category: 'preventive',
        frequency: 'Monthly'
      });
      setShowAddMaintenance(false);
    }
  };

  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
  };

  const handleSaveRule = (ruleId: string) => {
    setEditingRuleId(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.condition !== ruleId));
  };

  const handleEditMaintenance = (maintenanceId: string) => {
    setEditingMaintenanceId(maintenanceId);
  };

  const handleSaveMaintenance = (maintenanceId: string) => {
    setEditingMaintenanceId(null);
  };

  const handleDeleteMaintenance = (maintenanceId: string) => {
    setMaintenanceData(maintenanceData.filter(maintenance => maintenance.task !== maintenanceId));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Device Rules Manager</h2>
              <p className="text-slate-600 mt-1">Manage rules and maintenance for {deviceName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* IoT Rules Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">IoT Rules</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {rules.length} rules
                  </span>
                </div>
                <button
                  onClick={() => setShowAddRule(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Add New Rule Form */}
              {showAddRule && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-blue-800">Add New Rule</h4>
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                         <div>
                       <label className="block text-sm font-medium text-blue-700 mb-1">Category</label>
                       <select
                         value={newRule.category}
                         onChange={(e) => setNewRule({...newRule, category: e.target.value as any})}
                         className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       >
                         <option value="monitoring">Monitoring</option>
                         <option value="maintenance">Maintenance</option>
                         <option value="alert">Alert</option>
                       </select>
                     </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Priority</label>
                      <select
                        value={newRule.priority}
                        onChange={(e) => setNewRule({...newRule, priority: e.target.value as any})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Condition</label>
                      <textarea
                        value={newRule.condition || ''}
                        onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                        placeholder="e.g., Temperature exceeds 85°C"
                        rows={2}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Action</label>
                      <textarea
                        value={newRule.action || ''}
                        onChange={(e) => setNewRule({...newRule, action: e.target.value})}
                        placeholder="e.g., Send alert to maintenance team"
                        rows={2}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddRule}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Add Rule
                    </button>
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

                             {/* Existing Rules */}
               {rules.map((rule, index) => (
                 <div key={`${rule.condition}-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                       {getRuleIcon(rule.category)}
                       <div>
                         <h4 className="font-semibold text-slate-800">{deviceName}</h4>
                         <p className="text-sm text-slate-600 capitalize">{rule.category} Rule</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(rule.priority)}`}>
                         {rule.priority}
                       </span>
                       <div className="flex gap-1">
                         <button
                           onClick={() => handleEditRule(rule.condition)}
                           className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                         >
                           <Edit className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleDeleteRule(rule.condition)}
                           className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <div>
                       <p className="text-sm text-slate-700 mb-1">
                         <span className="font-medium">Condition:</span> {rule.condition}
                       </p>
                       <p className="text-sm text-slate-700 mb-1">
                         <span className="font-medium">Action:</span> {rule.action}
                       </p>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>

          {/* Maintenance Schedule Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Maintenance Schedule</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                    {maintenanceData.length} items
                  </span>
                </div>
                <button
                  onClick={() => setShowAddMaintenance(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Maintenance
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Add New Maintenance Form */}
              {showAddMaintenance && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-purple-800">Add Maintenance Item</h4>
                    <button
                      onClick={() => setShowAddMaintenance(false)}
                      className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                     <div>
                       <label className="block text-sm font-medium text-purple-700 mb-1">Task</label>
                       <input
                         type="text"
                         value={newMaintenance.task || ''}
                         onChange={(e) => setNewMaintenance({...newMaintenance, task: e.target.value})}
                         placeholder="e.g., Filter Assembly"
                         className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-purple-700 mb-1">Category</label>
                       <select
                         value={newMaintenance.category}
                         onChange={(e) => setNewMaintenance({...newMaintenance, category: e.target.value})}
                         className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                       >
                         <option value="preventive">Preventive</option>
                         <option value="corrective">Corrective</option>
                         <option value="predictive">Predictive</option>
                       </select>
                     </div>
                   </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={newMaintenance.frequency || ''}
                        onChange={(e) => setNewMaintenance({...newMaintenance, frequency: e.target.value})}
                        placeholder="e.g., Every 3 months"
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">Description</label>
                      <textarea
                        value={newMaintenance.description || ''}
                        onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                        placeholder="Description of maintenance task"
                        rows={3}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleAddMaintenance}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      Add Maintenance
                    </button>
                    <button
                      onClick={() => setShowAddMaintenance(false)}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

                             {/* Existing Maintenance Items */}
               {maintenanceData.map((maintenance, index) => (
                 <div key={`${maintenance.task}-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                       <Shield className="w-4 h-4 text-purple-600" />
                       <div>
                         <h4 className="font-semibold text-slate-800">{maintenance.task}</h4>
                         <p className="text-sm text-slate-600 capitalize">{maintenance.category} Maintenance</p>
                       </div>
                     </div>
                     <div className="flex gap-1">
                       <button
                         onClick={() => handleEditMaintenance(maintenance.task)}
                         className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button
                         onClick={() => handleDeleteMaintenance(maintenance.task)}
                         className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <div className="flex items-center gap-2 text-sm">
                       <Clock className="w-4 h-4 text-slate-400" />
                       <span className="text-slate-600">Frequency: {maintenance.frequency}</span>
                     </div>
                     {maintenance.description && (
                       <p className="text-sm text-slate-600 mt-2">
                         {maintenance.description}
                       </p>
                     )}
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
