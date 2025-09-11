import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { ValidationRule, validateField } from '../../utils/validation';

interface ValidatedFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
  value: string | number;
  onChange: (name: string, value: string) => void;
  onBlur?: (name: string) => void;
  validationRule?: ValidationRule;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  showPasswordToggle?: boolean;
  helpText?: string;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
}

export const ValidatedField: React.FC<ValidatedFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  validationRule,
  error,
  touched = false,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  options = [],
  rows = 3,
  showPasswordToggle = false,
  helpText,
  maxLength,
  pattern,
  autoComplete
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  // Real-time validation
  useEffect(() => {
    if (validationRule && touched) {
      setIsValidating(true);
      const result = validateField(value, validationRule);
      setLocalError(result.isValid ? '' : result.error!);
      setIsValidating(false);
    }
  }, [value, validationRule, touched]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(name, newValue);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur(name);
    }
  };

  const displayError = error || localError;
  const hasError = touched && displayError;
  const isValid = touched && !displayError && value && String(value).trim();

  const getInputType = () => {
    if (type === 'password' && showPassword) {
      return showPassword ? 'text' : 'password';
    }
    return type;
  };

  const renderField = () => {
    const baseClasses = `
      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent 
      transition-colors duration-200
      ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
      ${hasError 
        ? 'border-red-500 focus:ring-red-500' 
        : isValid 
          ? 'border-green-500 focus:ring-green-500' 
          : 'border-gray-300'
      }
    `;

    switch (type) {
      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseClasses} resize-vertical`}
            rows={rows}
            maxLength={maxLength}
          />
        );

      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={baseClasses}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <div className="relative">
            <input
              type={getInputType()}
              name={name}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={baseClasses}
              maxLength={maxLength}
              pattern={pattern}
              autoComplete={autoComplete}
            />
            {type === 'password' && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderField()}
      
      {/* Character count */}
      {maxLength && (
        <div className="text-xs text-gray-500 text-right">
          {String(value).length}/{maxLength}
        </div>
      )}
      
      {/* Help text */}
      {helpText && !hasError && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {/* Error message */}
      {hasError && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
      
      {/* Success indicator */}
      {isValid && !isValidating && (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Valid</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {isValidating && (
        <div className="flex items-center gap-1 text-sm text-pink-600">
          <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Validating...</span>
        </div>
      )}
    </div>
  );
};
