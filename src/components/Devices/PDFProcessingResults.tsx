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
import { IoTRule, MaintenanceData, SafetyPrecaution } from '../../services/pdfProcessingService';

export interface PDFProcessingResultsData {
  pdf_name: string;
  chunks_processed: number;
  iot_rules: IoTRule[];
  maintenance_data: MaintenanceData[];
  safety_precautions: SafetyPrecaution[];
  processing_time: string;
  summary?: string;
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
    setSelectedRules(new Set(results.iot_rules.map((rule, index) => `rule_${index}`)));
    setSelectedMaintenance(new Set(results.maintenance_data.map((m, index) => `maintenance_${index}`)));
    setSelectedSafety(new Set(results.safety_precautions.map((s, index) => `safety_${index}`)));
  }, [results]);

  const getRuleIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'monitoring':
      case 'temperature_monitoring':
      case 'performance_monitoring':
        return <Target className="w-4 h-4" />;
      case 'maintenance':
      case 'preventive_maintenance':
        return <Shield className="w-4 h-4" />;
      case 'alert':
      case 'safety_alert':
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

  const toggleRuleSelection = (ruleIndex: number) => {
    const ruleId = `rule_${ruleIndex}`;
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
  };

  const toggleMaintenanceSelection = (maintenanceIndex: number) => {
    const maintenanceId = `maintenance_${maintenanceIndex}`;
    const newSelected = new Set(selectedMaintenance);
    if (newSelected.has(maintenanceId)) {
      newSelected.delete(maintenanceId);
    } else {
      newSelected.add(maintenanceId);
    }
    setSelectedMaintenance(newSelected);
  };

  const toggleSafetySelection = (safetyIndex: number) => {
    const safetyId = `safety_${safetyIndex}`;
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
      iot_rules: editedRules.filter((rule, index) => selectedRules.has(`rule_${index}`)),
      maintenance_data: editedMaintenance.filter((m, index) => selectedMaintenance.has(`maintenance_${index}`)),
      safety_precautions: editedSafety.filter((s, index) => selectedSafety.has(`safety_${index}`))
    };
    onConfirm(selectedData);
  };

  const updateRuleField = (ruleIndex: number, field: keyof IoTRule, value: any) => {
    setEditedRules(prev => prev.map((rule, index) => 
      index === ruleIndex ? { ...rule, [field]: value } : rule
    ));
  };

  const updateMaintenanceField = (maintenanceIndex: number, field: keyof MaintenanceData, value: any) => {
    setEditedMaintenance(prev => prev.map((maintenance, index) => 
      index === maintenanceIndex ? { ...maintenance, [field]: value } : maintenance
    ));
  };

  const updateSafetyField = (safetyIndex: number, field: keyof SafetyPrecaution, value: any) => {
    setEditedSafety(prev => prev.map((safety, index) => 
      index === safetyIndex ? { ...safety, [field]: value } : safety
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
            <span className="text-slate-700">{results.chunks_processed} chunks processed</span>
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
        <p className="text-xs text-slate-600 mt-2">{results.summary || `Processing completed in ${results.processing_time}`}</p>
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
              <div key={`rule-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleRuleSelection(index)}
                    className="mt-1"
                  >
                    {selectedRules.has(`rule_${index}`) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    {editingRuleId === `rule_${index}` ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getRuleIcon(rule.category)}
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <input
                              type="text"
                              value={rule.category}
                              onChange={(e) => updateRuleField(index, 'category', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                            <select
                              value={rule.priority}
                              onChange={(e) => updateRuleField(index, 'priority', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
                          <textarea
                            value={rule.condition}
                            onChange={(e) => updateRuleField(index, 'condition', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
                          <textarea
                            value={rule.action}
                            onChange={(e) => updateRuleField(index, 'action', e.target.value)}
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
                            {getRuleIcon(rule.category)}
                            <div>
                              <h4 className="font-semibold text-slate-800">{rule.category} Rule</h4>
                              <p className="text-sm text-slate-600 capitalize">{rule.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(rule.priority)}`}>
                              {rule.priority}
                            </span>
                            <button
                              onClick={() => setEditingRuleId(`rule_${index}`)}
                              className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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
              <div key={`maintenance-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleMaintenanceSelection(index)}
                    className="mt-1"
                  >
                    {selectedMaintenance.has(`maintenance_${index}`) ? (
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
                          <h4 className="font-semibold text-slate-800">{maintenance.task}</h4>
                          <p className="text-sm text-slate-600 capitalize">{maintenance.category} Maintenance</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingMaintenanceId(`maintenance_${index}`)}
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
              <div key={`safety-${index}`} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSafetySelection(index)}
                    className="mt-1"
                  >
                    {selectedSafety.has(`safety_${index}`) ? (
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
                        <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(safety.type)}`}>
                          {safety.type}
                        </span>
                        <button
                          onClick={() => setEditingSafetyId(`safety_${index}`)}
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
