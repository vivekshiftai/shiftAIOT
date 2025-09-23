import React, { useState } from 'react';
import { CheckCircle, X, ArrowRight } from 'lucide-react';
import { logInfo, logError } from '../../utils/logger';

interface ChatFeedbackButtonsProps {
  messageId: string;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike' | 'regenerate') => void;
  onRegenerate?: (messageId: string) => void;
  className?: string;
  disabled?: boolean;
}

export const ChatFeedbackButtons: React.FC<ChatFeedbackButtonsProps> = ({
  messageId,
  onFeedback,
  onRegenerate,
  className = '',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<'like' | 'dislike' | null>(null);

  const handleFeedback = async (feedback: 'like' | 'dislike') => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      setActiveFeedback(feedback);
      
      logInfo('ChatFeedbackButtons', 'User provided feedback', { 
        messageId, 
        feedback 
      });

      // Call the parent callback if provided
      if (onFeedback) {
        await onFeedback(messageId, feedback);
      }

      // TODO: Send feedback to backend API
      // This will be implemented when we update the frontend services

    } catch (error) {
      logError('ChatFeedbackButtons', 'Failed to submit feedback', error instanceof Error ? error : new Error('Unknown error'));
      setActiveFeedback(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      
      logInfo('ChatFeedbackButtons', 'User requested regeneration', { 
        messageId 
      });

      // Call the parent callback if provided
      if (onRegenerate) {
        await onRegenerate(messageId);
      }

      // TODO: Send regenerate request to backend API
      // This will be implemented when we update the frontend services

    } catch (error) {
      logError('ChatFeedbackButtons', 'Failed to regenerate message', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Like Button */}
      <button
        onClick={() => handleFeedback('like')}
        disabled={disabled || isLoading}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
          ${activeFeedback === 'like' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 border border-gray-200'
          }
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Like this response"
      >
        <CheckCircle className="w-3 h-3" />
        <span>Like</span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => handleFeedback('dislike')}
        disabled={disabled || isLoading}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
          ${activeFeedback === 'dislike' 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200'
          }
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Dislike this response"
      >
        <X className="w-3 h-3" />
        <span>Dislike</span>
      </button>

      {/* Regenerate Button */}
      <button
        onClick={handleRegenerate}
        disabled={disabled || isLoading}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-200
          bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-gray-200
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title="Regenerate this response"
      >
        <ArrowRight className="w-3 h-3" />
        <span>Regenerate</span>
      </button>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};
