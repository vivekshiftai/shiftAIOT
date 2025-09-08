import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Shield } from 'lucide-react';
import Button from '../UI/Button';
import { LoadingSpinner } from '../Loading/LoadingComponents';
import { logInfo, logError } from '../../utils/logger';
import { DeviceSafetyPrecaution } from '../../types';

interface SafetyFormProps {
  isOpen: boolean;
  onClose: () => void;
  safety?: DeviceSafetyPrecaution;
  deviceId?: string;
  onSubmit?: (safetyData: Omit<DeviceSafetyPrecaution, 'id' | 'createdAt' | 'updatedAt' | 'organizationId'>) => Promise<void>;
}

export const SafetyForm: React.FC<SafetyFormProps> = ({
  isOpen,
  onClose,
  safety,
  deviceId,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
    type?: string;
    category?: string;
  }>({});

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: 'warning' | 'procedure' | 'caution' | 'note';
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedAction: string;
    aboutReaction: string;
    causes: string;
    howToAvoid: string;
    safetyInfo: string;
    isActive: boolean;
  }>({
    title: safety?.title || '',
    description: safety?.description || '',
    type: safety?.type || 'warning',
    category: safety?.category || 'general',
    severity: safety?.severity || 'MEDIUM',
    recommendedAction: safety?.recommendedAction || '',
    aboutReaction: safety?.aboutReaction || '',
    causes: safety?.causes || '',
    howToAvoid: safety?.howToAvoid || '',
    safetyInfo: safety?.safetyInfo || '',
    isActive: safety?.isActive !== false
  });

  // Reset form when safety changes
  useEffect(() => {
    if (safety) {
      setFormData({
        title: safety.title,
        description: safety.description,
        type: safety.type,
        category: safety.category,
        severity: safety.severity,
        recommendedAction: safety.recommendedAction || '',
        aboutReaction: safety.aboutReaction || '',
        causes: safety.causes || '',
        howToAvoid: safety.howToAvoid || '',
        safetyInfo: safety.safetyInfo || '',
        isActive: safety.isActive
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'warning',
        category: 'general',
        severity: 'MEDIUM',
        recommendedAction: '',
        aboutReaction: '',
        causes: '',
        howToAvoid: '',
        safetyInfo: '',
        isActive: true
      });
    }
    setError('');
    setSuccess('');
    setFieldErrors({});
  }, [safety, deviceId]);

  // Validate form
  const validateForm = () => {
    const newErrors: typeof fieldErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Safety precaution title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
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

    if (!onSubmit) {
      console.warn('No onSubmit handler provided');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      logInfo('SafetyForm', 'Submitting safety precaution', { 
        isEdit: !!safety, 
        deviceId,
        title: formData.title 
      });

      const safetyData = {
        deviceId: deviceId || '',
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        severity: formData.severity,
        recommendedAction: formData.recommendedAction,
        aboutReaction: formData.aboutReaction,
        causes: formData.causes,
        howToAvoid: formData.howToAvoid,
        safetyInfo: formData.safetyInfo,
        isActive: formData.isActive
      };

      // Log the safety data being submitted
      logInfo('SafetyForm', 'Submitting safety data with enhanced fields', {
        isEdit: !!safety,
        deviceId,
        title: formData.title,
        hasAboutReaction: !!formData.aboutReaction,
        hasCauses: !!formData.causes,
        hasHowToAvoid: !!formData.howToAvoid,
        hasSafetyInfo: !!formData.safetyInfo
      });

      await onSubmit(safetyData);
      
      setSuccess(safety ? 'Safety precaution updated successfully!' : 'Safety precaution created successfully!');
      logInfo('SafetyForm', 'Safety precaution saved successfully', { isEdit: !!safety });
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save safety precaution';
      setError(errorMessage);
      logError('SafetyForm', 'Failed to save safety precaution', err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              {safety ? 'Edit Safety Precaution' : 'Add Safety Precaution'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., High Load Warning"
              />
              {fieldErrors.title && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.type ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="warning">Warning</option>
                <option value="procedure">Procedure</option>
                <option value="caution">Caution</option>
                <option value="note">Note</option>
              </select>
              {fieldErrors.type && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.type}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  fieldErrors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="thermal_hazard">Thermal Hazard</option>
                <option value="electrical_hazard">Electrical Hazard</option>
                <option value="mechanical_hazard">Mechanical Hazard</option>
                <option value="emergency_procedures">Emergency Procedures</option>
                <option value="ppe_requirements">PPE Requirements</option>
                <option value="general">General</option>
              </select>
              {fieldErrors.category && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                fieldErrors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the safety precaution..."
            />
            {fieldErrors.description && (
              <p className="text-red-600 text-sm mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Action
              </label>
              <textarea
                value={formData.recommendedAction}
                onChange={(e) => setFormData({ ...formData, recommendedAction: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What action should be taken?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Reaction
              </label>
              <textarea
                value={formData.aboutReaction}
                onChange={(e) => setFormData({ ...formData, aboutReaction: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What happens if this precaution is not followed? (e.g., Equipment can reach dangerously high loads during operation, causing mechanical failure)"
              />
              <p className="text-xs text-gray-500 mt-1">Describe the potential consequences of not following this safety precaution.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Causes
              </label>
              <textarea
                value={formData.causes}
                onChange={(e) => setFormData({ ...formData, causes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="What causes this hazard? (e.g., Continuous operation, lack of cooling, mechanical friction, electrical resistance)"
              />
              <p className="text-xs text-gray-500 mt-1">List the factors that can lead to this safety hazard.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How to Avoid
              </label>
              <textarea
                value={formData.howToAvoid}
                onChange={(e) => setFormData({ ...formData, howToAvoid: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="How can this hazard be avoided? (e.g., Monitor load sensors, ensure proper maintenance, follow operating procedures)"
              />
              <p className="text-xs text-gray-500 mt-1">Provide specific steps to prevent this safety hazard.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Information
              </label>
              <textarea
                value={formData.safetyInfo}
                onChange={(e) => setFormData({ ...formData, safetyInfo: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional safety information... (e.g., Wear protective PPE, maintain safe distance, implement load monitoring)"
              />
              <p className="text-xs text-gray-500 mt-1">Include any additional safety measures, PPE requirements, or emergency procedures.</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active (visible to users)
            </label>
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
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  {safety ? 'Update Safety Precaution' : 'Create Safety Precaution'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
