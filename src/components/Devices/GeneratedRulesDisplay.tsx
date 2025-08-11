import React, { useState } from 'react';
import { 
  Target, 
  Shield, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import { IoTRule, MaintenanceData } from '../../services/pdfProcessingService';

interface GeneratedRulesDisplayProps {
  iotRules: IoTRule[];
  maintenanceData: MaintenanceData[];
  onRulesUpdate?: (updatedRules: IoTRule[]) => void;
  onMaintenanceUpdate?: (updatedMaintenance: MaintenanceData[]) => void;
  isEditable?: boolean;
}

export const GeneratedRulesDisplay: React.FC<GeneratedRulesDisplayProps> = ({
  iotRules,
  maintenanceData,
  onRulesUpdate,
  onMaintenanceUpdate,
  isEditable = true
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [editedRules, setEditedRules] = useState<IoTRule[]>(iotRules);
  const [editedMaintenance, setEditedMaintenance] = useState<MaintenanceData[]>(maintenanceData);

  // Debug logging
  console.log('GeneratedRulesDisplay - Received props:', {
    iotRulesCount: iotRules.length,
    maintenanceDataCount: maintenanceData.length,
    iotRules,
    maintenanceData
  });

  // Update local state when props change
  React.useEffect(() => {
    console.log('GeneratedRulesDisplay - Updating local state with new props');
    setEditedRules(iotRules);
    setEditedMaintenance(maintenanceData);
  }, [iotRules, maintenanceData]);

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

  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
  };

  const handleSaveRule = (ruleId: string) => {
    const updatedRules = editedRules.map(rule => 
      rule.device_name === ruleId ? { ...rule } : rule
    );
    setEditedRules(updatedRules);
    setEditingRuleId(null);
    onRulesUpdate?.(updatedRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = editedRules.filter(rule => rule.device_name !== ruleId);
    setEditedRules(updatedRules);
    onRulesUpdate?.(updatedRules);
  };

  const handleEditMaintenance = (maintenanceId: string) => {
    setEditingMaintenanceId(maintenanceId);
  };

  const handleSaveMaintenance = (maintenanceId: string) => {
    const updatedMaintenance = editedMaintenance.map(maintenance => 
      maintenance.component_name === maintenanceId ? { ...maintenance } : maintenance
    );
    setEditedMaintenance(updatedMaintenance);
    setEditingMaintenanceId(null);
    onMaintenanceUpdate?.(updatedMaintenance);
  };

  const handleDeleteMaintenance = (maintenanceId: string) => {
    const updatedMaintenance = editedMaintenance.filter(maintenance => maintenance.component_name !== maintenanceId);
    setEditedMaintenance(updatedMaintenance);
    onMaintenanceUpdate?.(updatedMaintenance);
  };

  const updateRuleField = (ruleId: string, field: keyof IoTRule, value: any) => {
    setEditedRules(prev => prev.map(rule => 
      rule.device_name === ruleId ? { ...rule, [field]: value } : rule
    ));
  };

  const updateMaintenanceField = (maintenanceId: string, field: keyof MaintenanceData, value: any) => {
    setEditedMaintenance(prev => prev.map(maintenance => 
      maintenance.component_name === maintenanceId ? { ...maintenance, [field]: value } : maintenance
    ));
  };

  return (
    <div className="space-y-6">
      {/* IoT Rules Section */}
      {editedRules.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-800">Generated IoT Rules</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {editedRules.length} rules
              </span>
            </div>
            <p className="text-slate-600 mt-1">
              AI-generated monitoring and alert rules for your device
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {editedRules.map((rule, index) => (
              <div key={`${rule.device_name}-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                {editingRuleId === rule.device_name ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRuleIcon(rule.rule_type)}
                        <span className="font-medium text-slate-800">Editing Rule</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveRule(rule.device_name)}
                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingRuleId(null)}
                          className="p-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Device Name</label>
                        <input
                          type="text"
                          value={rule.device_name}
                          onChange={(e) => updateRuleField(rule.device_name, 'device_name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Rule Type</label>
                        <select
                          value={rule.rule_type}
                          onChange={(e) => updateRuleField(rule.device_name, 'rule_type', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="monitoring">Monitoring</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="alert">Alert</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select
                          value={rule.priority}
                          onChange={(e) => updateRuleField(rule.device_name, 'priority', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={rule.frequency}
                          onChange={(e) => updateRuleField(rule.device_name, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                      <textarea
                        value={rule.condition}
                        onChange={(e) => updateRuleField(rule.device_name, 'condition', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
                      <textarea
                        value={rule.action}
                        onChange={(e) => updateRuleField(rule.device_name, 'action', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea
                        value={rule.description}
                        onChange={(e) => updateRuleField(rule.device_name, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getRuleIcon(rule.rule_type)}
                        <div>
                          <h4 className="font-semibold text-slate-800">{rule.device_name}</h4>
                          <p className="text-sm text-slate-600 capitalize">{rule.rule_type} Rule</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(rule.priority)}`}>
                          {rule.priority}
                        </span>
                        {isEditable && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditRule(rule.device_name)}
                              className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.device_name)}
                              className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Frequency: {rule.frequency}</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-700 mb-1">
                          <span className="font-medium">Condition:</span> {rule.condition}
                        </p>
                        <p className="text-sm text-slate-700 mb-1">
                          <span className="font-medium">Action:</span> {rule.action}
                        </p>
                        <p className="text-sm text-slate-600">
                          {rule.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Data Section */}
      {editedMaintenance.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-800">Maintenance Schedule</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                {editedMaintenance.length} items
              </span>
            </div>
            <p className="text-slate-600 mt-1">
              AI-generated preventive maintenance schedules
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {editedMaintenance.map((maintenance, index) => (
              <div key={`${maintenance.component_name}-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                {editingMaintenanceId === maintenance.component_name ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-slate-800">Editing Maintenance</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMaintenance(maintenance.component_name)}
                          className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingMaintenanceId(null)}
                          className="p-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Component Name</label>
                        <input
                          type="text"
                          value={maintenance.component_name}
                          onChange={(e) => updateMaintenanceField(maintenance.component_name, 'component_name', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Maintenance Type</label>
                        <input
                          type="text"
                          value={maintenance.maintenance_type}
                          onChange={(e) => updateMaintenanceField(maintenance.component_name, 'maintenance_type', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                        <input
                          type="text"
                          value={maintenance.frequency}
                          onChange={(e) => updateMaintenanceField(maintenance.component_name, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Maintenance</label>
                        <input
                          type="date"
                          value={maintenance.last_maintenance}
                          onChange={(e) => updateMaintenanceField(maintenance.component_name, 'last_maintenance', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <textarea
                        value={maintenance.description}
                        onChange={(e) => updateMaintenanceField(maintenance.component_name, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <div>
                          <h4 className="font-semibold text-slate-800">{maintenance.component_name}</h4>
                          <p className="text-sm text-slate-600 capitalize">{maintenance.maintenance_type} Maintenance</p>
                        </div>
                      </div>
                      {isEditable && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditMaintenance(maintenance.component_name)}
                            className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaintenance(maintenance.component_name)}
                            className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">Frequency: {maintenance.frequency}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">Last Maintenance:</span>
                          <p className="text-slate-600">{maintenance.last_maintenance}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-700">Next Maintenance:</span>
                          <p className="text-slate-600">{maintenance.next_maintenance}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">
                        {maintenance.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
