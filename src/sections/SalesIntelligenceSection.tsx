import React, { useState, useEffect } from 'react';
import { 
  Download,
  User,
  CheckCircle,
  X,
  Search,
  Brain,
  ArrowLeft
} from 'lucide-react';
import { logError, logInfo } from '../utils/logger';
import { StrategyAgentService, StrategyAgentResponse } from '../services/strategyAgentService';
import { CustomerRecommendationsDisplay } from '../components/SalesIntelligence/CustomerRecommendationsDisplay';
import '../styles/knowledge.css';

interface SalesIntelligenceSectionProps {
  onBack?: () => void;
}

export const SalesIntelligenceSection: React.FC<SalesIntelligenceSectionProps> = ({ onBack }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<StrategyAgentResponse | null>(null);
  const [allRecommendations, setAllRecommendations] = useState<StrategyAgentResponse[] | null>(null);
  const [error, setError] = useState<string>('');
  const [availableCustomers, setAvailableCustomers] = useState<Array<{ id: string; name: string; type?: string; country?: string; region?: string; totalStores?: number }>>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isAllCustomers, setIsAllCustomers] = useState<boolean>(false);
  const [regenerateMessage] = useState<string>('');
  const [activeCustomerTab, setActiveCustomerTab] = useState<string>('');
  const [isRegeneratingData, setIsRegeneratingData] = useState<boolean>(false);
  const [regenerationMessage, setRegenerationMessage] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  // Filter customers based on search query
  const filteredCustomers = searchQuery.length > 0 
    ? availableCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableCustomers;

  // Set first customer as active when all recommendations are loaded
  useEffect(() => {
    if (allRecommendations && allRecommendations.length > 0 && !activeCustomerTab) {
      setActiveCustomerTab(allRecommendations[0].customer_id || '');
    }
  }, [allRecommendations, activeCustomerTab]);

  // Handle customer selection
  const handleCustomerSelect = (customer: { id: string; name: string; type?: string; country?: string; region?: string; totalStores?: number } | 'all') => {
    if (customer === 'all') {
      setSelectedCustomer('all');
      setSearchQuery('All Customers');
      setIsAllCustomers(true);
    } else {
      setSelectedCustomer(customer.id);
      setSearchQuery(customer.name);
      setIsAllCustomers(false);
    }
    setShowDropdown(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowDropdown(true); // Always show dropdown when typing
    
    // Clear selection if search doesn't match selected customer
    if (selectedCustomer && query.length > 0) {
      const selectedCustomerData = availableCustomers.find(c => c.id === selectedCustomer);
      if (!selectedCustomerData || !selectedCustomerData.name.toLowerCase().includes(query.toLowerCase())) {
        setSelectedCustomer('');
      }
    }
  };

  // Handle customer-specific tab changes

  // Load available customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        logInfo('Process', 'Loading available customers');
        const customers = await StrategyAgentService.getAvailableCustomers();
        setAvailableCustomers(customers);
        logInfo('Process', `Loaded ${customers.length} customers`);
      } catch (error) {
        logError('Process', 'Failed to load customers', error instanceof Error ? error : new Error('Unknown error'));
        setError('Failed to load customers');
      }
    };

    loadCustomers();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const downloadPDFReport = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer first');
      return;
    }

    try {
      logInfo('Process', 'Downloading PDF report');
      
      if (isAllCustomers) {
        // Download PDF for all customers
        const pdfBlob = await StrategyAgentService.downloadAllCustomersPDFReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        StrategyAgentService.triggerAllCustomersPDFDownload(pdfBlob, timestamp);
        logInfo('Process', 'All customers PDF report downloaded successfully');
      } else {
        // Download PDF for single customer
        const pdfBlob = await StrategyAgentService.downloadPDFReport(selectedCustomer);
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales-intelligence-report-${selectedCustomer}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        logInfo('Process', 'PDF report downloaded successfully');
      }
    } catch (error) {
      logError('Process', 'Failed to download PDF report via backend', error instanceof Error ? error : new Error('Unknown error'));
      setError('Failed to download PDF report');
    }
  };


  // Handle regeneration for all customers (Refresh Intelligence)
  const handleRegenerateData = async () => {
    setIsRegeneratingData(true);
    setRegenerationMessage('');
    setShowSuccessMessage(false);
    setError('');

    try {
      logInfo('Process', 'Starting regeneration for all customers via Refresh Intelligence');
      setRegenerationMessage('🔄 Starting Sales Intelligence refresh process... Please wait while we contact the external service.');
      
      const result = await StrategyAgentService.regenerateAllRecommendations(true);
      
      if (result.success === true) {
        setRegenerationMessage('🔄 Sales Intelligence refresh process started successfully! The system is now refreshing recommendations for all customers. This process may take several minutes to complete.');
        logInfo('Process', 'All customers regeneration triggered successfully via Refresh Intelligence - external service returned success: true', { 
          success: result.success,
          message: result.message 
        });
        
        // Clear existing recommendations since they're being regenerated
        setRecommendations(null);
        setAllRecommendations(null);
        
        // Start polling for completion
        await pollForCompletion();
        
      } else {
        // External service did not return success: true
        const errorMsg = result.message || 'External service did not return success status';
        setError(`Failed to start Sales Intelligence refresh process: ${errorMsg}`);
        setRegenerationMessage('');
        setIsRegeneratingData(false);
        logError('Process', 'External service did not return success: true', new Error(`Service response: ${JSON.stringify(result)}`));
      }
    } catch (error) {
      logError('Process', 'Failed to refresh Sales Intelligence', error instanceof Error ? error : new Error('Unknown error'));
      setError(`Failed to refresh Sales Intelligence. Please try again.`);
      setRegenerationMessage('');
      setIsRegeneratingData(false);
    }
  };

  // Poll for regeneration completion
  const pollForCompletion = async () => {
    const maxAttempts = 60; // Poll for up to 10 minutes (60 * 10 seconds)
    const pollInterval = 10000; // Poll every 10 seconds
    let attempts = 0;

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        setError('Regeneration process is taking longer than expected. Please check back later or contact support.');
        setRegenerationMessage('');
        setIsRegeneratingData(false);
        return;
      }

      try {
        const statusResult = await StrategyAgentService.checkRegenerationStatus();
        
        if (statusResult.success === true && statusResult.is_completed === true) {
          // Regeneration completed successfully - only show success message when service returns success: true
          setShowSuccessMessage(true);
          setRegenerationMessage('🎉 Sales Intelligence refresh completed successfully! The recommendations have been updated in the system. You can now generate new reports to see the latest data.');
          setIsRegeneratingData(false);
          
          // Clear any existing recommendations to prevent showing old data
          setRecommendations(null);
          setAllRecommendations(null);
          
          logInfo('Process', 'Sales Intelligence refresh completed successfully - external service returned success: true', { 
            success: statusResult.success, 
            is_completed: statusResult.is_completed 
          });
          return;
        } else if (statusResult.success && !statusResult.is_completed) {
          // Still in progress
          attempts++;
          const progressText = statusResult.progress ? ` (${statusResult.progress}% complete)` : '';
          setRegenerationMessage(`🔄 Sales Intelligence is still refreshing... Please wait${progressText}`);
          
          // Continue polling
          setTimeout(poll, pollInterval);
        } else {
          // External service did not return success: true or other error occurred
          const errorMsg = statusResult.message || 'External service did not return success status during polling';
          setError(`Regeneration status check failed: ${errorMsg}`);
          setRegenerationMessage('');
          setIsRegeneratingData(false);
          logError('Process', 'External service polling did not return success: true', new Error(`Status response: ${JSON.stringify(statusResult)}`));
        }
      } catch (error) {
        logError('Process', 'Failed to check regeneration status', error instanceof Error ? error : new Error('Unknown error'));
        attempts++;
        
        if (attempts >= maxAttempts) {
          setError('Failed to check regeneration status. Please try again later.');
          setRegenerationMessage('');
          setIsRegeneratingData(false);
        } else {
          // Continue polling even if status check fails
          setTimeout(poll, pollInterval);
        }
      }
    };

    // Start polling
    setTimeout(poll, pollInterval);
  };

  // Handle getting sales report - first generate the report, then show it
  const handleGetSalesReport = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (selectedCustomer === 'all') {
        logInfo('Process', 'Generating sales report for all customers');
        const response = await StrategyAgentService.getAllCustomerRecommendations();
        setAllRecommendations(response.recommendations);
        setIsAllCustomers(true);
        logInfo('Process', `Sales report generated successfully for ${response.total_customers} customers`);
      } else {
        logInfo('Process', `Generating sales report for customer: ${selectedCustomer}`);
        const response = await StrategyAgentService.generateRecommendations(selectedCustomer);
        setRecommendations(response);
        setIsAllCustomers(false);
        logInfo('Process', 'Sales report generated successfully');
      }
    } catch (error) {
      logError('Process', 'Failed to generate sales report', error instanceof Error ? error : new Error('Unknown error'));
      setError('Failed to generate sales report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="process-section flex flex-col bg-gray-50 h-full">
      {/* Sales Intelligence Dashboard Header */}
      <div className="knowledge-fixed-header flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="page-header">Sales Intelligence</h1>
              <p className="page-subtitle">AI-powered cross-sell recommendations and analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Refresh Intelligence Button */}
            <button
              onClick={handleRegenerateData}
              disabled={isRegeneratingData}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              {isRegeneratingData ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Refresh Intelligence
                </>
              )}
            </button>
            
            {/* Download Button */}
            {(recommendations || allRecommendations) && (
              <button
                onClick={downloadPDFReport}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <Download className="w-4 h-4" />
                {isAllCustomers ? 'Download All Customers Intelligence Report' : 'Download Intelligence Report'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Customer Selection Form */}
          {!recommendations && !allRecommendations && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-green-600" />
              <h2 className="text-base font-semibold text-gray-900">Select Customer</h2>
            </div>
            
            <div className="space-y-3">
              <div>
                  <label className="block text-sm text-gray-600 mb-2">
                  Choose a customer to generate sales intelligence recommendations:
                </label>
                  <div className="relative search-container">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search customers..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 text-sm shadow-sm hover:border-gray-300 transition-all duration-200"
                  disabled={isLoading}
                      />
                    </div>
                    
                    {/* Dropdown with Search */}
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input inside dropdown */}
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={handleSearchChange}
                              placeholder="Type customer name or ID..."
                              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {/* Customer List */}
                        <div className="max-h-48 overflow-auto pb-4">
                          {/* All Customers Option */}
                          <div
                            onClick={() => handleCustomerSelect('all')}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors bg-gradient-to-r from-purple-50 to-pink-50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">All Customers</p>
                                <p className="text-xs text-gray-500">Get recommendations for all available customers</p>
                              </div>
                              {selectedCustomer === 'all' && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                          </div>
                          
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                onClick={() => handleCustomerSelect(customer)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                                    <p className="text-xs text-gray-500">ID: {customer.id}</p>
                                    {customer.type && (
                                      <p className="text-xs text-gray-400">
                                        {customer.type} • {customer.country} • {customer.region}
                                        {customer.totalStores && ` • ${customer.totalStores} stores`}
                                      </p>
                                    )}
                                  </div>
                                  {selectedCustomer === customer.id && (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-gray-500 text-sm">
                              {searchQuery.length > 0 ? `No customers found matching "${searchQuery}"` : 'No customers available'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
              
                {/* Generate Intelligence Report Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGetSalesReport}
                    disabled={!selectedCustomer || isLoading}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Generate Intelligence Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sales Intelligence Refresh Status */}
          {regenerationMessage && (
            <div className={`rounded-lg p-4 border ${
              showSuccessMessage 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {showSuccessMessage ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Brain className="w-5 h-5 text-blue-600" />
                )}
                <p className={`font-medium text-sm ${
                  showSuccessMessage ? 'text-green-800' : 'text-blue-800'
                }`}>
                  {showSuccessMessage ? 'Success!' : 'Sales Intelligence Status'}
                </p>
              </div>
              <div className="flex items-start justify-between">
                <p className={`text-sm mt-1 ${
                  showSuccessMessage ? 'text-green-700' : 'text-blue-700'
                }`}>
                  {regenerationMessage}
                </p>
                {showSuccessMessage && (
                  <button
                    onClick={() => {
                      setShowSuccessMessage(false);
                      setRegenerationMessage('');
                    }}
                    className="ml-4 text-green-600 hover:text-green-800 transition-colors"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                )}
              </div>
              {!showSuccessMessage && (
                <div className="mt-3 bg-blue-100 rounded-lg p-3 border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800 font-medium">
                    🔄 Your sales intelligence is refreshing, it will take time please wait...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Single Customer Recommendations */}
          {recommendations && !showSuccessMessage && (
            <CustomerRecommendationsDisplay
              customerRec={recommendations}
            />
          )}


          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
              {error.includes('Backend API error') && (
                <p className="text-red-600 text-sm mt-2">
                  Please check if the backend service is running and accessible.
                </p>
              )}
            </div>
          )}

          {/* Regeneration Status Message */}
          {regenerateMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <p className="text-blue-800 font-medium">Regeneration Status</p>
              </div>
              <p className="text-blue-700 mt-1">{regenerateMessage}</p>
            </div>
          )}


          {/* All Customer Recommendations with Tabs */}
          {allRecommendations && !showSuccessMessage && (
            <div className="space-y-6">
              {/* Customer Tabs Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">All Customer Recommendations</h2>
                      <p className="text-sm text-gray-600">AI-powered cross-sell recommendations for all customers</p>
                    </div>
                  </div>
                </div>

                {/* Customer Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-4 overflow-x-auto">
                    {allRecommendations.map((customerRec, index) => {
                      const customerName = customerRec.CustomerInfo?.CustomerName || `Customer ${customerRec.customer_id}`;
                      const isActive = activeCustomerTab === customerRec.customer_id;
                      
                      return (
                        <button
                          key={customerRec.customer_id || index}
                          onClick={() => setActiveCustomerTab(customerRec.customer_id || '')}
                          className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                            isActive
                              ? 'border-primary-500 text-primary-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="truncate max-w-32">{customerName}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {(customerRec.Summary?.TotalCrossSell || 0) + (customerRec.Summary?.TotalRejected || 0) + (customerRec.Summary?.TotalAlreadyPurchased || 0)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Active Customer Content */}
              {allRecommendations.map((customerRec, customerIndex) => {
                if (activeCustomerTab !== customerRec.customer_id) return null;
                
                return (
                  <CustomerRecommendationsDisplay
                    key={customerRec.customer_id || customerIndex}
                    customerRec={customerRec}
                  />
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};