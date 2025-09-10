import React, { useState } from 'react';
import { 
  BarChart3
} from 'lucide-react';
import { SalesIntelligenceSection } from './SalesIntelligenceSection';

export const ProcessSection: React.FC = () => {
  const [selectedProcess, setSelectedProcess] = useState<string>('');

  // Available smart processes
  const availableProcesses = [
    {
      id: 'sales-intelligence',
      name: 'Sales Intelligence',
      description: 'AI-powered cross-sell recommendations and analysis',
      icon: BarChart3,
      color: 'blue'
    }
    // Future processes can be added here
  ];

  // Handle process selection
  const handleProcessSelect = (processId: string) => {
    setSelectedProcess(processId);
  };

  // Handle back to process selection
  const handleBackToProcesses = () => {
    setSelectedProcess('');
  };

  // If a process is selected, render the appropriate component
  if (selectedProcess === 'sales-intelligence') {
    return <SalesIntelligenceSection onBack={handleBackToProcesses} />;
  }

  // If no process selected, show the process selection screen
  return (
    <div className="process-section flex flex-col bg-gray-50 h-full">
      {/* Smart Process Header */}
      <div className="knowledge-fixed-header flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-gray-900">Smart Process</h1>
            <p className="text-sm text-gray-600 mt-1">Select a smart process to get started</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Process Selection */}
          <div className="space-y-6">
            <div className="w-full">
              {availableProcesses.map((process) => {
                const IconComponent = process.icon;
                return (
                  <div
                    key={process.id}
                    onClick={() => handleProcessSelect(process.id)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg transition-colors">
                        <IconComponent className="w-6 h-6 text-primary-600" />
                </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {process.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {process.description}
                        </p>
                  </div>
                    </div>
                  </div>
                );
              })}
                  </div>
                </div>
                
        </div>
      </div>
    </div>
  );
};