import React, { useState, useEffect } from 'react';
import { 
  Download,
  Send,
  User,
  CheckCircle,
  X,
  Search,
  Brain,
  Bot,
  ArrowLeft
} from 'lucide-react';
import { logError, logInfo } from '../utils/logger';
import { StrategyAgentService, StrategyAgentResponse } from '../services/strategyAgentService';
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
  const [activeTab, setActiveTab] = useState<'accepted' | 'rejected' | 'purchased'>('accepted');
  const [isAllCustomers, setIsAllCustomers] = useState<boolean>(false);
  const [customerActiveTabs, setCustomerActiveTabs] = useState<Record<string, 'accepted' | 'rejected' | 'purchased'>>({});
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenerateMessage, setRegenerateMessage] = useState<string>('');
  const [regeneratingCustomers, setRegeneratingCustomers] = useState<Set<string>>(new Set());
  const [customerRegenerateMessages, setCustomerRegenerateMessages] = useState<Record<string, string>>({});

  // Filter customers based on search query
  const filteredCustomers = searchQuery.length > 0 
    ? availableCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableCustomers;

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
  const handleCustomerTabChange = (customerId: string, tab: 'accepted' | 'rejected' | 'purchased') => {
    setCustomerActiveTabs(prev => ({
      ...prev,
      [customerId]: tab
    }));
  };

  // Get active tab for a specific customer
  const getCustomerActiveTab = (customerId: string): 'accepted' | 'rejected' | 'purchased' => {
    return customerActiveTabs[customerId] || 'accepted';
  };

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

  const generateRecommendations = async () => {
    if (!selectedCustomer) {
      setError('Please select a customer first');
      return;
    }

    setIsLoading(true);
    setError('');
    setRecommendations(null);
    setAllRecommendations(null);

    try {
      if (isAllCustomers) {
        logInfo('Process', 'Generating recommendations for all customers');
        const response = await StrategyAgentService.getAllCustomerRecommendations();
        setAllRecommendations(response.recommendations);
        logInfo('Process', `Recommendations generated successfully for ${response.total_customers} customers`);
      } else {
        logInfo('Process', `Generating recommendations for customer: ${selectedCustomer}`);
        const response = await StrategyAgentService.generateRecommendations(selectedCustomer);
        setRecommendations(response);
        logInfo('Process', 'Recommendations generated successfully');
      }
    } catch (error) {
      logError('Process', 'Failed to generate recommendations', error instanceof Error ? error : new Error('Unknown error'));
      setError('Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const regenerateAllRecommendations = async () => {
    setIsRegenerating(true);
    setRegenerateMessage('');
    setError('');

    try {
      logInfo('Process', 'Starting regeneration of all customer recommendations');
      setRegenerateMessage('🔄 Regeneration process started... This will take some time. Please wait.');
      
      const result = await StrategyAgentService.regenerateAllRecommendations(true);
      
      if (result.success) {
        setRegenerateMessage('✅ Regeneration process started successfully! The system is now regenerating recommendations for all customers. This process may take several minutes to complete.');
        logInfo('Process', 'Regeneration triggered successfully', result);
        
        // Clear existing recommendations since they're being regenerated
        setRecommendations(null);
        setAllRecommendations(null);
      } else {
        setError(result.message || 'Failed to start regeneration process');
        setRegenerateMessage('');
      }
    } catch (error) {
      logError('Process', 'Failed to regenerate recommendations', error instanceof Error ? error : new Error('Unknown error'));
      setError('Failed to regenerate recommendations. Please try again.');
      setRegenerateMessage('');
    } finally {
      setIsRegenerating(false);
    }
  };

  const regenerateCustomerRecommendations = async (customerId: string) => {
    setRegeneratingCustomers(prev => new Set(prev).add(customerId));
    setCustomerRegenerateMessages(prev => ({ ...prev, [customerId]: '' }));
    setError('');

    try {
      logInfo('Process', 'Starting regeneration for customer', { customerId });
      setCustomerRegenerateMessages(prev => ({ 
        ...prev, 
        [customerId]: '🔄 Regeneration process started... This will take some time. Please wait.' 
      }));
      
      const result = await StrategyAgentService.regenerateCustomerRecommendations(customerId, true);
      
      if (result.success) {
        setCustomerRegenerateMessages(prev => ({ 
          ...prev, 
          [customerId]: '✅ Regeneration process started successfully! The system is now regenerating recommendations for this customer. This process may take several minutes to complete.' 
        }));
        logInfo('Process', 'Customer regeneration triggered successfully', result);
        
        // Clear existing recommendations for this customer since they're being regenerated
        if (selectedCustomer === customerId) {
          setRecommendations(null);
        }
        if (allRecommendations) {
          setAllRecommendations(prev => prev?.filter(rec => rec.customer_id !== customerId) || null);
        }
      } else {
        setError(result.message || `Failed to start regeneration process for customer ${customerId}`);
        setCustomerRegenerateMessages(prev => ({ ...prev, [customerId]: '' }));
      }
    } catch (error) {
      logError('Process', 'Failed to regenerate customer recommendations', error instanceof Error ? error : new Error('Unknown error'), { customerId });
      setError(`Failed to regenerate recommendations for customer ${customerId}. Please try again.`);
      setCustomerRegenerateMessages(prev => ({ ...prev, [customerId]: '' }));
    } finally {
      setRegeneratingCustomers(prev => {
        const newSet = new Set(prev);
        newSet.delete(customerId);
        return newSet;
      });
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
              <h1 className="text-2xl font-bold text-gray-900">Sales Intelligence</h1>
              <p className="text-sm text-gray-600 mt-1">AI-powered cross-sell recommendations and analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Regenerate Button */}
            <button
              onClick={regenerateAllRecommendations}
              disabled={isRegenerating}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              {isRegenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Regenerating...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Regenerate All Data
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
                {isAllCustomers ? 'Download All Customers Report' : 'Download Opportunity Report'}
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
                        <div className="max-h-48 overflow-auto">
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
              
                <div>
                <button
                  onClick={generateRecommendations}
                  disabled={!selectedCustomer || isLoading}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                        <Send className="w-4 h-4" />
                      Generate Sales Intelligence
                    </>
                  )}
                </button>
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          {recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cross-sell Accepted</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.Summary?.TotalCrossSell || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <X className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rejected Recommendations</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.Summary?.TotalRejected || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Already Purchased</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.Summary?.TotalAlreadyPurchased || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Brain className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {recommendations.Summary?.TotalRecommendations || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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

          {/* Sales Intelligence Dashboard Layout */}
          {recommendations && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left Column - Customer Information and Classification (25% width) */}
              <div className="lg:col-span-1 space-y-4">
                {/* Combined Customer Information and Classification */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-base font-semibold text-gray-900">{recommendations.CustomerInfo?.CustomerName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer ID</p>
                      <p className="text-base font-semibold text-gray-900">{recommendations.CustomerInfo?.CustomerID || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Individual Customer Regenerate Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => regenerateCustomerRecommendations(selectedCustomer)}
                      disabled={regeneratingCustomers.has(selectedCustomer)}
                      className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                    >
                      {regeneratingCustomers.has(selectedCustomer) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4" />
                          Regenerate Recommendations
                        </>
                      )}
                    </button>
                    
                    {/* Customer Regeneration Status Message */}
                    {customerRegenerateMessages[selectedCustomer] && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <p className="text-blue-800 font-medium text-sm">Regeneration Status</p>
                        </div>
                        <p className="text-blue-700 text-sm mt-1">{customerRegenerateMessages[selectedCustomer]}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Classification Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Brain className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Classification</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Type</p>
                      <p className="text-base font-semibold text-gray-900">{recommendations.CustomerClassification?.CustomerType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Stores</p>
                      <p className="text-base font-semibold text-gray-900">{recommendations.CustomerClassification?.NumberOfStores || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Quantity Sold</p>
                      <p className="text-base font-semibold text-gray-900">{(recommendations.CustomerClassification?.TotalQuantitySold || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Recommendations (75% width) */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  {/* Search and Filter Bar */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search products or category..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        />
                      </div>
                      <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <Search className="w-4 h-4" />
                        Filters
                      </button>
                    </div>
                  </div>

                  {/* Recommendation Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-4">
                      <button
                        onClick={() => setActiveTab('accepted')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'accepted'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Top Matches ({recommendations.Summary?.TotalCrossSell || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab('rejected')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'rejected'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Needs Review ({recommendations.Summary?.TotalRejected || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab('purchased')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'purchased'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Already Purchased ({recommendations.Summary?.TotalAlreadyPurchased || 0})
                      </button>
                    </nav>
                  </div>

                  {/* Recommendation Content */}
                  <div className="p-4">
                    {activeTab === 'accepted' && (
                      <div className="space-y-6">
                        {recommendations.AcceptedRecommendations && recommendations.AcceptedRecommendations.length > 0 ? (
                          recommendations.AcceptedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  {rec.ProductName} (ID: {rec.CustomerCatalogueItemID})
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  Quantity Required: {rec.QuantityRequired} | 
                                  Ingredients: {rec.Ingredients?.join(', ')}
                                </p>
                                <p className="text-sm font-medium text-green-700">
                                  Presents {rec.CrossSell?.length || 0} cross-sell opportunities:
                                </p>
                              </div>
                              
                              {rec.CrossSell && rec.CrossSell.length > 0 && (
                                <div className="space-y-4">
                                  {rec.CrossSell.map((crossSell, csIndex) => (
                                    <div key={csIndex} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                                            {crossSell.SuggestedProduct}
                                          </h5>
                                          <p className="text-xs text-gray-500 mb-2">ID: {crossSell.ProductID}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                          {crossSell.Status}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Category</span>
                                          <span className="text-sm font-medium text-gray-900">{crossSell.Category}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Price</span>
                                          <span className="text-sm font-medium text-gray-900">${crossSell.Price}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Similarity</span>
                                          <span className="text-sm font-medium text-gray-900">{Math.round((crossSell.Similarity || 0) * 100)}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Ingredient</span>
                                          <span className="text-sm font-medium text-gray-900">{crossSell.Ingredient}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-400">
                                        <p className="text-xs text-gray-700">
                                          <strong className="text-green-700">AI Reasoning:</strong> {crossSell.AIReasoning}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No accepted cross-sell opportunities found.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'rejected' && (
                      <div className="space-y-6">
                        {recommendations.RejectedRecommendations && recommendations.RejectedRecommendations.length > 0 ? (
                          recommendations.RejectedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  {rec.ProductName} (ID: {rec.CustomerCatalogueItemID})
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  Quantity Required: {rec.QuantityRequired} | 
                                  Ingredients: {rec.Ingredients?.join(', ')}
                                </p>
                                <p className="text-sm font-medium text-red-700">
                                  Had {rec.RejectedCrossSell?.length || 0} potential cross-sell opportunities that were rejected:
                                </p>
                              </div>
                              
                              {rec.RejectedCrossSell && rec.RejectedCrossSell.length > 0 && (
                                <div className="space-y-4">
                                  {rec.RejectedCrossSell.map((crossSell, csIndex) => (
                                    <div key={csIndex} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                                            {crossSell.SuggestedProduct}
                                          </h5>
                                          <p className="text-xs text-gray-500 mb-2">ID: {crossSell.ProductID}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                          {crossSell.Status}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Category</span>
                                          <span className="text-sm font-medium text-gray-900">{crossSell.Category}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Price</span>
                                          <span className="text-sm font-medium text-gray-900">${crossSell.Price}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Similarity</span>
                                          <span className="text-sm font-medium text-gray-900">{Math.round((crossSell.Similarity || 0) * 100)}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Ingredient</span>
                                          <span className="text-sm font-medium text-gray-900">{crossSell.Ingredient}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-red-50 rounded-lg p-3 border-l-4 border-red-400">
                                        <p className="text-xs text-red-700">
                                          <strong className="text-red-800">Rejection Reason:</strong> {crossSell.AIReasoning}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <X className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No rejected cross-sell opportunities found.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'purchased' && (
                      <div className="space-y-6">
                        {recommendations.AlreadyPurchasedRecommendations && recommendations.AlreadyPurchasedRecommendations.length > 0 ? (
                          recommendations.AlreadyPurchasedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="mb-4">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  {rec.ProductName} (ID: {rec.CustomerCatalogueItemID})
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  Quantity Required: {rec.QuantityRequired} | 
                                  Ingredients: {rec.Ingredients?.join(', ')}
                                </p>
                                <p className="text-sm font-medium text-primary-700">
                                  Has {rec.AlreadyPurchasedCrossSell?.length || 0} cross-sell products already purchased:
                                </p>
                              </div>
                              
                              {rec.AlreadyPurchasedCrossSell && rec.AlreadyPurchasedCrossSell.length > 0 && (
                                <div className="space-y-4">
                                  {rec.AlreadyPurchasedCrossSell.map((crossSell, csIndex) => (
                                    <div key={csIndex} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-gray-900 mb-2 text-sm">
                                            {crossSell.SuggestedProduct}
                                          </h5>
                                          <p className="text-xs text-gray-500 mb-2">ID: {crossSell.ProductID}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                                          {crossSell.Status}
                                        </span>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Category</span>
                                          <span className="text-sm font-medium text-gray-900">{crossSell.Category}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Price</span>
                                          <span className="text-sm font-medium text-gray-900">${crossSell.Price}</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Similarity</span>
                                          <span className="text-sm font-medium text-gray-900">{Math.round((crossSell.Similarity || 0) * 100)}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="text-xs text-gray-500">Ingredient</span>
                                          <span className="text-sm font-medium text-gray-900">{crossSell.Ingredient}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-primary-400">
                                        <p className="text-xs text-gray-700">
                                          <strong className="text-primary-700">AI Reasoning:</strong> {crossSell.AIReasoning}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No already purchased cross-sell opportunities found.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Customer Recommendations */}
          {allRecommendations && (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">All Customer Recommendations</h2>
                    <p className="text-sm text-gray-600">AI-powered cross-sell recommendations for all customers</p>
                  </div>
                </div>
              </div>

              {/* Individual Customer Sections */}
              {allRecommendations.map((customerRec, customerIndex) => (
                <div key={customerRec.customer_id || customerIndex} className="space-y-6">
                  {/* Customer Header */}
                  <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <User className="w-8 h-8 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">{customerRec.CustomerInfo?.CustomerName || 'Unknown Customer'}</h3>
                        <p className="text-sm text-gray-600">Customer ID: {customerRec.customer_id}</p>
                        {customerRec.CustomerClassification && (
                          <div className="mt-2 flex flex-wrap gap-4 text-sm">
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 border">
                              <strong>Type:</strong> {customerRec.CustomerClassification.CustomerType}
                            </span>
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 border">
                              <strong>Stores:</strong> {customerRec.CustomerClassification.NumberOfStores}
                            </span>
                            <span className="px-3 py-1 bg-white rounded-full text-gray-700 border">
                              <strong>Quantity Sold:</strong> {customerRec.CustomerClassification.TotalQuantitySold?.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Individual Customer Regenerate Button */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => regenerateCustomerRecommendations(customerRec.customer_id)}
                          disabled={regeneratingCustomers.has(customerRec.customer_id)}
                          className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                        >
                          {regeneratingCustomers.has(customerRec.customer_id) ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4" />
                              Regenerate
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Customer Regeneration Status Message */}
                    {customerRegenerateMessages[customerRec.customer_id] && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <p className="text-blue-800 font-medium text-sm">Regeneration Status</p>
                        </div>
                        <p className="text-blue-700 text-sm mt-1">{customerRegenerateMessages[customerRec.customer_id]}</p>
                      </div>
                    )}
                  </div>

                  {/* Summary Cards for this Customer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Accepted</p>
                          <p className="text-2xl font-bold text-green-600">{customerRec.Summary?.TotalCrossSell || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <X className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Rejected</p>
                          <p className="text-2xl font-bold text-red-600">{customerRec.Summary?.TotalRejected || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Bot className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Already Purchased</p>
                          <p className="text-2xl font-bold text-blue-600">{customerRec.Summary?.TotalAlreadyPurchased || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Brain className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total</p>
                          <p className="text-2xl font-bold text-purple-600">{customerRec.Summary?.TotalRecommendations || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sales Intelligence Dashboard Layout for this Customer */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Left Column - Customer Information and Classification (25% width) */}
                    <div className="lg:col-span-1 space-y-4">
                      {/* Combined Customer Information and Classification */}
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-4 h-4 text-primary-600" />
                          <h3 className="text-sm font-semibold text-gray-900">Customer Details</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">Customer ID</p>
                            <p className="text-sm font-medium text-gray-900">{customerRec.CustomerInfo?.CustomerID || 'N/A'}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Customer Name</p>
                            <p className="text-sm font-medium text-gray-900">{customerRec.CustomerInfo?.CustomerName || 'N/A'}</p>
                          </div>
                          
                          {customerRec.CustomerClassification && (
                            <>
                              <div>
                                <p className="text-xs text-gray-500">Customer Type</p>
                                <p className="text-sm font-medium text-gray-900">{customerRec.CustomerClassification.CustomerType}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Total Quantity Sold</p>
                                <p className="text-sm font-medium text-gray-900">{customerRec.CustomerClassification.TotalQuantitySold?.toLocaleString() || 'N/A'}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">Number of Stores</p>
                                <p className="text-sm font-medium text-gray-900">{customerRec.CustomerClassification.NumberOfStores || 'N/A'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Recommendations (75% width) */}
                    <div className="lg:col-span-3">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        
                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200">
                          <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                              onClick={() => handleCustomerTabChange(customerRec.customer_id || '', 'accepted')}
                              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                getCustomerActiveTab(customerRec.customer_id || '') === 'accepted'
                                  ? 'border-primary-500 text-primary-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              Accepted Recommendations ({customerRec.AcceptedRecommendations?.length || 0})
                            </button>
                            <button
                              onClick={() => handleCustomerTabChange(customerRec.customer_id || '', 'rejected')}
                              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                getCustomerActiveTab(customerRec.customer_id || '') === 'rejected'
                                  ? 'border-primary-500 text-primary-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              Rejected Recommendations ({customerRec.RejectedRecommendations?.length || 0})
                            </button>
                            <button
                              onClick={() => handleCustomerTabChange(customerRec.customer_id || '', 'purchased')}
                              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                getCustomerActiveTab(customerRec.customer_id || '') === 'purchased'
                                  ? 'border-primary-500 text-primary-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              Already Purchased ({customerRec.AlreadyPurchasedRecommendations?.length || 0})
                            </button>
                          </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                          {/* Accepted Recommendations */}
                          {getCustomerActiveTab(customerRec.customer_id || '') === 'accepted' && (
                            <div className="space-y-4">
                              {customerRec.AcceptedRecommendations && customerRec.AcceptedRecommendations.length > 0 ? (
                                customerRec.AcceptedRecommendations.map((recommendation, index) => (
                                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-1">{recommendation.ProductName}</h4>
                                        <p className="text-sm text-gray-600">Quantity Required: {recommendation.QuantityRequired}</p>
                                        <p className="text-sm text-gray-600">Customer Catalogue Item ID: {recommendation.CustomerCatalogueItemID}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                          Accepted
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {recommendation.Ingredients && recommendation.Ingredients.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Ingredients:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {recommendation.Ingredients.map((ingredient, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                              {ingredient}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {recommendation.CrossSell && recommendation.CrossSell.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Cross-Sell Opportunities:</p>
                                        <div className="space-y-3">
                                          {recommendation.CrossSell.map((crossSell, csIndex) => (
                                            <div key={csIndex} className="bg-white rounded-lg p-3 border border-green-200">
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Suggested Product</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.SuggestedProduct}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Category</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.Category}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Price</span>
                                                  <span className="text-sm font-medium text-gray-900">${crossSell.Price}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Similarity</span>
                                                  <span className="text-sm font-medium text-gray-900">{(crossSell.Similarity * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Product ID</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.ProductID}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Ingredient</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.Ingredient}</span>
                                                </div>
                                              </div>
                                              
                                              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-primary-400">
                                                <p className="text-xs text-gray-700">
                                                  <strong className="text-primary-700">AI Reasoning:</strong> {crossSell.AIReasoning}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-600">No accepted cross-sell opportunities found.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rejected Recommendations */}
                          {getCustomerActiveTab(customerRec.customer_id || '') === 'rejected' && (
                            <div className="space-y-4">
                              {customerRec.RejectedRecommendations && customerRec.RejectedRecommendations.length > 0 ? (
                                customerRec.RejectedRecommendations.map((recommendation, index) => (
                                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-red-50">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-1">{recommendation.ProductName}</h4>
                                        <p className="text-sm text-gray-600">Quantity Required: {recommendation.QuantityRequired}</p>
                                        <p className="text-sm text-gray-600">Customer Catalogue Item ID: {recommendation.CustomerCatalogueItemID}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                          Rejected
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {recommendation.Ingredients && recommendation.Ingredients.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Ingredients:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {recommendation.Ingredients.map((ingredient, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                              {ingredient}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {recommendation.RejectedCrossSell && recommendation.RejectedCrossSell.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Rejected Cross-Sell Opportunities:</p>
                                        <div className="space-y-3">
                                          {recommendation.RejectedCrossSell.map((crossSell, csIndex) => (
                                            <div key={csIndex} className="bg-white rounded-lg p-3 border border-red-200">
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Suggested Product</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.SuggestedProduct}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Category</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.Category}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Price</span>
                                                  <span className="text-sm font-medium text-gray-900">${crossSell.Price}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Similarity</span>
                                                  <span className="text-sm font-medium text-gray-900">{(crossSell.Similarity * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Product ID</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.ProductID}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Ingredient</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.Ingredient}</span>
                                                </div>
                                              </div>
                                              
                                              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-red-400">
                                                <p className="text-xs text-gray-700">
                                                  <strong className="text-red-700">AI Reasoning:</strong> {crossSell.AIReasoning}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                  <X className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-600">No rejected cross-sell opportunities found.</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Already Purchased Recommendations */}
                          {getCustomerActiveTab(customerRec.customer_id || '') === 'purchased' && (
                            <div className="space-y-4">
                              {customerRec.AlreadyPurchasedRecommendations && customerRec.AlreadyPurchasedRecommendations.length > 0 ? (
                                customerRec.AlreadyPurchasedRecommendations.map((recommendation, index) => (
                                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-1">{recommendation.ProductName}</h4>
                                        <p className="text-sm text-gray-600">Quantity Required: {recommendation.QuantityRequired}</p>
                                        <p className="text-sm text-gray-600">Customer Catalogue Item ID: {recommendation.CustomerCatalogueItemID}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                          Already Purchased
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {recommendation.Ingredients && recommendation.Ingredients.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Ingredients:</p>
                                        <div className="flex flex-wrap gap-1">
                                          {recommendation.Ingredients.map((ingredient, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                              {ingredient}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {recommendation.AlreadyPurchasedCrossSell && recommendation.AlreadyPurchasedCrossSell.length > 0 && (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Already Purchased Cross-Sell Opportunities:</p>
                                        <div className="space-y-3">
                                          {recommendation.AlreadyPurchasedCrossSell.map((crossSell, csIndex) => (
                                            <div key={csIndex} className="bg-white rounded-lg p-3 border border-blue-200">
                                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Suggested Product</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.SuggestedProduct}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Category</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.Category}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Price</span>
                                                  <span className="text-sm font-medium text-gray-900">${crossSell.Price}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Similarity</span>
                                                  <span className="text-sm font-medium text-gray-900">{(crossSell.Similarity * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Product ID</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.ProductID}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span className="text-xs text-gray-500">Ingredient</span>
                                                  <span className="text-sm font-medium text-gray-900">{crossSell.Ingredient}</span>
                                                </div>
                                              </div>
                                              
                                              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-400">
                                                <p className="text-xs text-gray-700">
                                                  <strong className="text-blue-700">AI Reasoning:</strong> {crossSell.AIReasoning}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                  <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-600">No already purchased cross-sell opportunities found.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
