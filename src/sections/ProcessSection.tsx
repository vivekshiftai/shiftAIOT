import React, { useState } from 'react';
import { 
  BarChart3,
  Plus,
  Search,
  Filter,
  Brain,
  TrendingUp
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
      color: 'blue',
      enabled: true
    },
    {
      id: 'vendor-intelligence',
      name: 'Sales Process Vendor Intelligence',
      description: 'Advanced vendor analysis and procurement optimization (Coming Soon)',
      icon: Brain,
      color: 'gray',
      enabled: false
    }
    // Future processes can be added here
  ];

  // Handle process selection
  const handleProcessSelect = (processId: string) => {
    // Only allow selection if process is enabled
    const process = availableProcesses.find(p => p.id === processId);
    if (process?.enabled) {
      setSelectedProcess(processId);
    }
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
            <h1 className="page-header">Smart Process</h1>
            <p className="page-subtitle">Monitor and manage your sales processes</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed opacity-50"
              title="Add Process feature coming soon"
            >
              <Plus className="w-4 h-4" />
              Add Process
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search sales processes..."
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-2">
                <select 
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-100 text-gray-500 cursor-not-allowed"
                  disabled
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                
                <button 
                  disabled
                  className="p-2 text-neutral-400 bg-gray-100 rounded-lg cursor-not-allowed"
                  title="Filters coming soon"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Process Grid - Full Width Like Smart Assets */}
          <div className="grid grid-cols-1 gap-6">
            {availableProcesses.map((process) => {
              const IconComponent = process.icon;
              const isEnabled = process.enabled;
              
              return (
                <div
                  key={process.id}
                  onClick={() => handleProcessSelect(process.id)}
                  className={`bg-white rounded-xl shadow-sm border border-neutral-200 transition-all cursor-pointer group overflow-hidden ${
                    isEnabled 
                      ? 'hover:shadow-md hover:border-primary-300'
                      : 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-300'
                  }`}
                >
                  {/* Card Content */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-xl ${
                          isEnabled 
                            ? 'bg-primary-50 group-hover:bg-primary-100' 
                            : 'bg-gray-200'
                        } transition-colors`}>
                          <IconComponent className={`w-6 h-6 ${
                            isEnabled ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg font-semibold mb-2 ${
                            isEnabled 
                              ? 'text-neutral-800 group-hover:text-primary-600' 
                              : 'text-gray-500'
                          } transition-colors`}>
                            {process.name}
                          </h3>
                          
                          <p className={`text-sm ${
                            isEnabled ? 'text-neutral-600' : 'text-gray-400'
                          }`}>
                            {process.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className={`${
                        isEnabled ? 'text-neutral-400 group-hover:text-primary-600' : 'text-gray-300'
                      } transition-colors`}>
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <div>
                        {!isEnabled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            Coming Soon
                          </span>
                        )}
                        
                        {isEnabled && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
                
        </div>
      </div>
    </div>
  );
};