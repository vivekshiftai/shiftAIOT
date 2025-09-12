import React, { useState, useEffect } from 'react';
import { UnifiedOnboardingProgress } from '../../services/unifiedOnboardingService';

interface SSEEventDisplayProps {
  sseProgress: UnifiedOnboardingProgress | null;
  isProcessing: boolean;
}

export const SSEEventDisplay: React.FC<SSEEventDisplayProps> = ({ sseProgress, isProcessing }) => {
  const [events, setEvents] = useState<UnifiedOnboardingProgress[]>([]);
  const [rawLogs, setRawLogs] = useState<string[]>([]);

  console.log('📱 SSEEventDisplay: Component rendered', {
    sseProgress,
    isProcessing,
    eventsCount: events.length,
    events: events
  });

  // Capture console logs for SSE debugging
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('🌐 SSE:')) {
        const logMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        setRawLogs(prev => [...prev.slice(-49), logMessage]); // Keep last 50 logs
      }
    };
    
    console.error = (...args) => {
      originalError(...args);
      if (args[0] && typeof args[0] === 'string' && args[0].includes('🌐 SSE:')) {
        const logMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        setRawLogs(prev => [...prev.slice(-49), logMessage]);
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

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
      case 'rules': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🌐 SSE Live Logs Monitor</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isProcessing ? 'Processing...' : 'Idle'}
            </span>
          </div>
          <button 
            onClick={() => {
              console.log('🧪 Test: Manual SSE test triggered');
              console.log('🧪 Test: Current state', { sseProgress, isProcessing, eventsCount: events.length });
              // Add some test SSE logs
              console.log('🌐 SSE: Test log 1 - Connection established');
              console.log('🌐 SSE: Test log 2 - Processing chunk', { chunkSize: 1024, dataType: 'text/event-stream' });
              console.log('🌐 SSE: Test log 3 - Event received', { eventType: 'progress', dataLength: 256 });
            }}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 text-sm transition-colors"
          >
            Test Logs
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Raw SSE Logs Display */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white">🌐 SSE Console Logs</h3>
            <div className="flex gap-2">
              <span className="text-xs text-gray-400">
                {rawLogs.length} logs
              </span>
              <button
                onClick={() => setRawLogs([])}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="h-96 overflow-y-auto border border-gray-700 rounded p-2 bg-black">
            {rawLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                <div className="text-2xl mb-2">📡</div>
                <p>Waiting for SSE logs...</p>
                <p className="text-xs mt-2">Start device onboarding to see logs</p>
              </div>
            ) : (
              rawLogs.map((log, index) => (
                <div key={index} className="mb-1 text-xs leading-relaxed">
                  <span className="text-gray-500">[{index + 1}]</span> {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Processed Events Display */}
        {events.length > 0 && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Processed Events ({events.length})</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {events.map((event, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStageColor(event.stage)}`}></div>
                      <span className="font-semibold text-gray-800">{event.stage.toUpperCase()}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{event.message}</p>
                  {event.subMessage && <p className="text-xs text-gray-600 mb-2">{event.subMessage}</p>}
                  {event.stepDetails && (
                    <div className="text-xs text-gray-500 mb-2">
                      Step {event.stepDetails.currentStep}/{event.stepDetails.totalSteps}: {event.stepDetails.stepName}
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                      style={{ width: `${event.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block text-right">{event.progress}%</span>
                  {event.error && (
                    <p className="text-xs text-red-600 mt-2">Error: {event.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSEEventDisplay;