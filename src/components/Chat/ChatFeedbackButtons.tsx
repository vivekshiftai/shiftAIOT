import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { logInfo, logError } from '../../utils/logger';
import { chatFeedbackService } from '../../services/chatFeedbackService';

interface ChatFeedbackButtonsProps {
  messageId: string;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  className?: string;
  disabled?: boolean;
}

export const ChatFeedbackButtons: React.FC<ChatFeedbackButtonsProps> = ({
  messageId,
  onFeedback,
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

      // Send feedback to backend API
      await chatFeedbackService.addFeedback({
        messageId,
        feedback: feedback.toUpperCase() as 'LIKE' | 'DISLIKE'
      });

      // Call the parent callback if provided
      if (onFeedback) {
        await onFeedback(messageId, feedback);
      }

      logInfo('ChatFeedbackButtons', 'Feedback submitted successfully', { 
        messageId, 
        feedback 
      });

    } catch (error) {
      logError('ChatFeedbackButtons', 'Failed to submit feedback', error instanceof Error ? error : new Error('Unknown error'));
      setActiveFeedback(null);
      
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('Feedback can only be added to assistant messages')) {
        logError('ChatFeedbackButtons', 'Invalid feedback attempt on user message', error);
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Good Button */}
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
        title="Good response"
      >
        <CheckCircle className="w-3 h-3" />
        <span>Good</span>
      </button>

      {/* Not up to the mark Button */}
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
        title="Not up to the mark"
      >
        <X className="w-3 h-3" />
        <span>Not up to the mark</span>
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
