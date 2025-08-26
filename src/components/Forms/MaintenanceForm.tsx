import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import Button from '../UI/Button';
import { LoadingSpinner } from '../Loading/LoadingComponents';
import { logInfo, logError } from '../../utils/logger';
import { MaintenanceTask } from '../../types';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance?: MaintenanceTask;
  deviceId?: string;
  onSubmit?: (maintenanceData: Omit<MaintenanceTask, 'id' | 'createdAt'>) => Promise<void>;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  isOpen,
  onClose,
  maintenance,
  deviceId,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    taskName?: string;
    description?: string;
    nextMaintenance?: string;
  }>({});

  const [formData, setFormData] = useState<{
    taskName: string;
    description: string;
    maintenanceType: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'GENERAL';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
    nextMaintenance: string;
    assignedTo: string;
    estimatedDuration: string;
    requiredTools: string;
    safetyNotes: string;
    estimatedCost: number;
    frequency: string;
  }>({
    taskName: maintenance?.taskName || '',
    description: maintenance?.description || '',
    maintenanceType: maintenance?.maintenanceType || 'PREVENTIVE',
    priority: maintenance?.priority || 'MEDIUM',
    status: maintenance?.status || 'PENDING',
    nextMaintenance: maintenance?.nextMaintenance || '',
    assignedTo: maintenance?.assignedTo || '',
    estimatedDuration: maintenance?.estimatedDuration || '',
    requiredTools: maintenance?.requiredTools || '',
    safetyNotes: maintenance?.safetyNotes || '',
    estimatedCost: maintenance?.estimatedCost || 0,
    frequency: maintenance?.frequency || ''
  });

  // Reset form when maintenance changes
  useEffect(() => {
    if (maintenance) {
      setFormData({
        taskName: maintenance.taskName,
        description: maintenance.description,
        maintenanceType: maintenance.maintenanceType || 'PREVENTIVE',
        priority: maintenance.priority,
        status: maintenance.status,
        nextMaintenance: maintenance.nextMaintenance,
        assignedTo: maintenance.assignedTo || '',
        estimatedDuration: maintenance.estimatedDuration || '',
        requiredTools: maintenance.requiredTools || '',
        safetyNotes: maintenance.safetyNotes || '',
        estimatedCost: maintenance.estimatedCost || 0,
        frequency: maintenance.frequency
      });
    } else {
      setFormData({
        taskName: '',
        description: '',
        maintenanceType: 'PREVENTIVE',
        priority: 'MEDIUM',
        status: 'PENDING',
        nextMaintenance: '',
        assignedTo: '',
        estimatedDuration: '',
        requiredTools: '',
        safetyNotes: '',
        estimatedCost: 0,
        frequency: ''
      });
    }
    setError('');
    setSuccess('');
    setFieldErrors({});
  }, [maintenance, deviceId]);

  // Validate form
  const validateForm = () => {
    const newErrors: typeof fieldErrors = {};

    if (!formData.taskName.trim()) {
      newErrors.taskName = 'Task name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.nextMaintenance) {
      newErrors.nextMaintenance = 'Next maintenance date is required';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Get user from localStorage to get organizationId
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const organizationId = user?.organizationId || 'default';

      const maintenanceData = {
        ...formData,
        deviceId: deviceId || maintenance?.deviceId,
        organizationId: organizationId
      };

      logInfo('MaintenanceForm', 'Submitting maintenance data', maintenanceData);

      if (onSubmit) {
        await onSubmit(maintenanceData);
        setSuccess('Maintenance task saved successfully!');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      logError('MaintenanceForm', 'Failed to save maintenance task', err);
      setError(err.response?.data?.message || err.message || 'Failed to save maintenance task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {maintenance ? 'Edit Maintenance Task' : 'Create New Maintenance Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter task title"
              />
              {fieldErrors.title && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="emergency">Emergency</option>
                <option value="routine">Routine</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the maintenance task"
            />
            {fieldErrors.description && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledDate}
                onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.scheduledDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {fieldErrors.scheduledDate && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.scheduledDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
          </div>

          {/* Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <input
                type="text"
                value={formData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter assignee name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration
              </label>
              <input
                type="text"
                value={formData.estimatedDuration}
                onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2 hours, 1 day"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Tools
            </label>
            <input
              type="text"
              value={formData.requiredTools}
              onChange={(e) => handleInputChange('requiredTools', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Screwdriver, Multimeter, Safety gear"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or instructions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safety Notes
            </label>
            <textarea
              value={formData.safetyNotes}
              onChange={(e) => handleInputChange('safetyNotes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Safety precautions and warnings"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Saving...
                </div>
              ) : (
                maintenance ? 'Update Task' : 'Create Task'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
