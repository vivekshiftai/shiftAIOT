import React, { useState, useEffect } from 'react';
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
  Zap,
  Wrench,
  AlertCircle,
  CheckSquare,
  Square,
  Plus,
  Minus,
  FileText,
  Settings,
  Brain,
  Sparkles
} from 'lucide-react';
import { IoTRule, MaintenanceData } from '../../services/pdfProcessingService';

export interface SafetyPrecaution {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  recommended_action: string;
}

export interface PDFProcessingResultsData {
  pdf_filename: string;
  total_pages: number;
  processed_chunks: number;
  iot_rules: IoTRule[];
  maintenance_data: MaintenanceData[];
  safety_precautions: SafetyPrecaution[];
  processing_time: number;
  summary: string;
}

interface PDFProcessingResultsProps {
  results: PDFProcessingResultsData;
  onRulesUpdate: (rules: IoTRule[]) => void;
  onMaintenanceUpdate: (maintenance: MaintenanceData[]) => void;
  onSafetyUpdate: (safety: SafetyPrecaution[]) => void;
  onConfirm: (selectedData: {
    iot_rules: IoTRule[];
    maintenance_data: MaintenanceData[];
    safety_precautions: SafetyPrecaution[];
  }) => void;
}

export const PDFProcessingResults: React.FC<PDFProcessingResultsProps> = ({
  results,
  onRulesUpdate,
  onMaintenanceUpdate,
  onSafetyUpdate,
  onConfirm
}) => {
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set());
  const [selectedMaintenance, setSelectedMaintenance] = useState<Set<string>>(new Set());
  const [selectedSafety, setSelectedSafety] = useState<Set<string>>(new Set());
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [editingSafetyId, setEditingSafetyId] = useState<string | null>(null);
  const [editedRules, setEditedRules] = useState<IoTRule[]>(results.iot_rules);
  const [editedMaintenance, setEditedMaintenance] = useState<MaintenanceData[]>(results.maintenance_data);
  const [editedSafety, setEditedSafety] = useState<SafetyPrecaution[]>(results.safety_precautions);

  // Initialize all items as selected by default
  useEffect(() => {
    setSelectedRules(new Set(results.iot_rules.map(rule => rule.device_name)));
    setSelectedMaintenance(new Set(results.maintenance_data.map(m => m.component_name)));
    setSelectedSafety(new Set(results.safety_precautions.map(s => s.id)));
  }, [results]);

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
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const toggleRuleSelection = (ruleId: string) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
  };

  const toggleMaintenanceSelection = (maintenanceId: string) => {
    const newSelected = new Set(selectedMaintenance);
    if (newSelected.has(maintenanceId)) {
      newSelected.delete(maintenanceId);
    } else {
      newSelected.add(maintenanceId);
    }
    setSelectedMaintenance(newSelected);
  };

  const toggleSafetySelection = (safetyId: string) => {
    const newSelected = new Set(selectedSafety);
    if (newSelected.has(safetyId)) {
      newSelected.delete(safetyId);
    } else {
      newSelected.add(safetyId);
    }
    setSelectedSafety(newSelected);
  };

  const handleConfirm = () => {
    const selectedData = {
      iot_rules: editedRules.filter(rule => selectedRules.has(rule.device_name)),
      maintenance_data: editedMaintenance.filter(m => selectedMaintenance.has(m.component_name)),
      safety_precautions: editedSafety.filter(s => selectedSafety.has(s.id))
    };
    onConfirm(selectedData);
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

  const updateSafetyField = (safetyId: string, field: keyof SafetyPrecaution, value: any) => {
    setEditedSafety(prev => prev.map(safety => 
      safety.id === safetyId ? { ...safety, [field]: value } : safety
    ));
  };

  return (
    <div className="space-y-6">
      {/* Processing Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">AI Analysis Complete!</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-slate-700">{results.total_pages} pages processed</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-slate-700">{results.iot_rules.length} IoT Rules</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-600" />
            <span className="text-slate-700">{results.maintenance_data.length} Maintenance Items</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-slate-700">{results.safety_precautions.length} Safety Precautions</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2">{results.summary}</p>
      </div>

      {/* IoT Rules Section */}
      {editedRules.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-800">IoT Monitoring Rules</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  {selectedRules.size} of {editedRules.length} selected
                </span>
              </div>
              <button
                onClick={() => setSelectedRules(new Set(editedRules.map(r => r.device_name)))}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Select All
              </button>
            </div>
            <p className="text-slate-600 mt-1">
              Select the monitoring rules you want to apply to your device
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {editedRules.map((rule, index) => (
              <div key={`${rule.device_name}-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleRuleSelection(rule.device_name)}
                    className="mt-1"
                  >
                    {selectedRules.has(rule.device_name) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
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
                              onClick={() => {
                                setEditingRuleId(null);
                                onRulesUpdate(editedRules);
                              }}
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
                            <button
                              onClick={() => setEditingRuleId(rule.device_name)}
                              className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Data Section */}
      {editedMaintenance.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wrench className="w-6 h-6 text-orange-600" />
                <h3 className="text-lg font-semibold text-slate-800">Maintenance Schedule</h3>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
                  {selectedMaintenance.size} of {editedMaintenance.length} selected
                </span>
              </div>
              <button
                onClick={() => setSelectedMaintenance(new Set(editedMaintenance.map(m => m.component_name)))}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                Select All
              </button>
            </div>
            <p className="text-slate-600 mt-1">
              Select maintenance schedules to include with your device
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {editedMaintenance.map((maintenance, index) => (
              <div key={`${maintenance.component_name}-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleMaintenanceSelection(maintenance.component_name)}
                    className="mt-1"
                  >
                    {selectedMaintenance.has(maintenance.component_name) ? (
                      <CheckSquare className="w-5 h-5 text-orange-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-orange-600" />
                        <div>
                          <h4 className="font-semibold text-slate-800">{maintenance.component_name}</h4>
                          <p className="text-sm text-slate-600 capitalize">{maintenance.maintenance_type} Maintenance</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingMaintenanceId(maintenance.component_name)}
                        className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
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
                      <p className="text-sm text-slate-600">
                        {maintenance.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Precautions Section */}
      {editedSafety.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-slate-800">Safety Precautions</h3>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                  {selectedSafety.size} of {editedSafety.length} selected
                </span>
              </div>
              <button
                onClick={() => setSelectedSafety(new Set(editedSafety.map(s => s.id)))}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Select All
              </button>
            </div>
            <p className="text-slate-600 mt-1">
              Select safety precautions to include with your device
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {editedSafety.map((safety, index) => (
              <div key={`${safety.id}-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSafetySelection(safety.id)}
                    className="mt-1"
                  >
                    {selectedSafety.has(safety.id) ? (
                      <CheckSquare className="w-5 h-5 text-red-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <h4 className="font-semibold text-slate-800">{safety.title}</h4>
                          <p className="text-sm text-slate-600 capitalize">{safety.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(safety.severity)}`}>
                          {safety.severity}
                        </span>
                        <button
                          onClick={() => setEditingSafetyId(safety.id)}
                          className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-slate-700">
                        {safety.description}
                      </p>
                      <div>
                        <span className="font-medium text-slate-700 text-sm">Recommended Action:</span>
                        <p className="text-sm text-slate-600">{safety.recommended_action}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Button */}
      <div className="flex justify-end pt-6 border-t border-slate-200">
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          Confirm Selection ({selectedRules.size + selectedMaintenance.size + selectedSafety.size} items)
        </button>
      </div>
    </div>
  );
};
