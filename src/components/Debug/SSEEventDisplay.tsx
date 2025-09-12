import React, { useState, useEffect } from 'react';
import { UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';

interface SSEEventDisplayProps {
  sseProgress: UnifiedOnboardingProgress | null;
  isProcessing: boolean;
}

export const SSEEventDisplay: React.FC<SSEEventDisplayProps> = ({ sseProgress, isProcessing }) => {
  const [events, setEvents] = useState<UnifiedOnboardingProgress[]>([]);

  console.log('📱 SSEEventDisplay: Component rendered', {
    sseProgress,
    isProcessing,
    eventsCount: events.length,
    events: events
  });

  useEffect(() => {
    if (sseProgress) {
      console.log('📱 SSEEventDisplay: Received SSE progress update', {
        sseProgress,
        sseProgressStringified: JSON.stringify(sseProgress, null, 2),
        currentEventsCount: events.length,
        isProcessing
      });
      setEvents(prev => {
        const newEvents = [...prev, sseProgress];
        console.log('📱 SSEEventDisplay: Updated events array', {
          previousCount: prev.length,
          newCount: newEvents.length,
          latestEvent: sseProgress,
          allEvents: newEvents
        });
        return newEvents;
      });
    }
  }, [sseProgress, events.length, isProcessing]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'device': return 'bg-blue-100 text-blue-800';
      case 'assignment': return 'bg-indigo-100 text-indigo-800';
      case 'upload': return 'bg-purple-100 text-purple-800';
      case 'rules': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'complete': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">SSE Events Monitor</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600">
            {isProcessing ? 'Processing...' : 'Idle'}
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📡</div>
          <p>Waiting for SSE events...</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {events.map((event, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(event.stage)}`}>
                    {event.stage.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    Step {event.stepDetails?.currentStep || 0}/{event.stepDetails?.totalSteps || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(event.progress)}`}
                      style={{ width: `${event.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{event.progress}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">{event.message}</p>
                {event.subMessage && (
                  <p className="text-sm text-gray-600">{event.subMessage}</p>
                )}
                {event.stepDetails?.stepName && (
                  <p className="text-xs text-gray-500">Step: {event.stepDetails.stepName}</p>
                )}
                {event.timestamp && (
                  <p className="text-xs text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total Events: {events.length}</span>
            <button 
              onClick={() => setEvents([])}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
              Clear Events
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
