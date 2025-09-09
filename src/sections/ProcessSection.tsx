import React, { useState, useEffect } from 'react';
import { 
  Download,
  Send,
  User,
  CheckCircle,
  X,
  Search,
  FileText,
  Filter,
  Eye,
  ChevronDown,
  TrendingUp,
  Package,
  Target
} from 'lucide-react';
import { logError, logInfo } from '../utils/logger';
import { StrategyAgentService, StrategyAgentResponse } from '../services/strategyAgentService';
import '../styles/knowledge.css';

// Interfaces are now imported from StrategyAgentService

export const ProcessSection: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<StrategyAgentResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [availableCustomers, setAvailableCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [activeTab, setActiveTab] = useState<'accepted' | 'rejected' | 'purchased'>('accepted');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Filter customers based on search query
  const filteredCustomers = searchQuery.length > 0 
    ? availableCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableCustomers;

  // Handle customer selection
  const handleCustomerSelect = (customer: { id: string; name: string }) => {
    setSelectedCustomer(customer.id);
    setSearchQuery(customer.name);
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

  // Load available customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        logInfo('Process', 'Loading available customers from backend');
        const customers = await StrategyAgentService.getAvailableCustomers();
        setAvailableCustomers(customers);
        
        logInfo('Process', 'Marketing Intelligence Process section loaded with backend integration', { 
          availableCustomers: customers.length 
        });
        
        // Backend integration is now active - all API calls go through backend proxy
        console.log('ℹ️ Backend integration active - API calls routed through backend proxy');
      } catch (error) {
        logError('Process', 'Failed to load available customers', error instanceof Error ? error : new Error('Unknown error'));
        // Fallback to empty array - the service will handle fallback internally
        setAvailableCustomers([]);
      }
    };

    loadCustomers();
  }, []);

  // Close dropdown when clicking outside
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

    try {
      logInfo('Process', 'Generating marketing intelligence recommendations', { 
        customerId: selectedCustomer 
      });

      // Use backend proxy to avoid CORS issues
      await generateRecommendationsViaBackend();

    } catch (error) {
      logError('Process', 'Failed to generate marketing intelligence recommendations', error instanceof Error ? error : new Error('Unknown error'));
      setError(error instanceof Error ? error.message : 'Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const generateRecommendationsViaBackend = async () => {
    try {
      console.log('🔍 Calling Strategy Agent API via backend proxy...');
      
      const data = await StrategyAgentService.generateRecommendations(selectedCustomer);
      setRecommendations(data);
      
      // Auto-select tab with most recommendations
      const acceptedCount = data.AcceptedRecommendations?.length || 0;
      const rejectedCount = data.RejectedRecommendations?.length || 0;
      const purchasedCount = data.AlreadyPurchasedRecommendations?.length || 0;
      
      if (acceptedCount >= rejectedCount && acceptedCount >= purchasedCount) {
        setActiveTab('accepted');
      } else if (rejectedCount >= purchasedCount) {
        setActiveTab('rejected');
      } else {
        setActiveTab('purchased');
      }
      
      logInfo('Process', 'Marketing intelligence recommendations generated successfully via backend', {
        customerId: selectedCustomer,
        totalRecommendations: data.Summary.total_recommendations,
        activeTab: activeTab
      });
      
    } catch (error) {
      console.error('❌ Full error details:', error);
      throw error;
    }
  };

  const downloadPDFReport = async () => {
    if (!recommendations) return;

    try {
      console.log('🔍 Downloading PDF report via backend proxy...');
      
      const blob = await StrategyAgentService.downloadPDFReport(recommendations.customer_id);
      StrategyAgentService.triggerPDFDownload(blob, recommendations.customer_id, recommendations.timestamp);

      logInfo('Process', 'PDF report downloaded successfully via backend', { 
        customerId: recommendations.customer_id 
      });
    } catch (error) {
      logError('Process', 'Failed to download PDF report via backend', error instanceof Error ? error : new Error('Unknown error'));
      setError('Failed to download PDF report');
    }
  };

  return (
    <div className="process-section flex flex-col bg-gray-50 h-full">
      {/* Sales Intelligence Dashboard Header */}
      <div className="knowledge-fixed-header flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Intelligence Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">AI-powered cross-sell recommendations and analysis</p>
          </div>
          {recommendations && (
            <button
              onClick={downloadPDFReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" />
              Opportunity Report
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Customer Selection Form */}
          {!recommendations && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Select Customer</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose a customer to generate marketing intelligence recommendations:
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
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900 font-medium shadow-sm hover:border-gray-300 transition-all duration-200"
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
                          {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer.id}
                                onClick={() => handleCustomerSelect(customer)}
                                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                                    <p className="text-xs text-gray-500">ID: {customer.id}</p>
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
                    className="w-full px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating Recommendations...
                    </>
                  ) : (
                    <>
                        <Send className="w-5 h-5" />
                      Generate Marketing Intelligence
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
                    <p className="text-2xl font-bold text-gray-900">{recommendations.AcceptedRecommendations?.length || 0}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{recommendations.RejectedRecommendations?.length || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Already Purchased</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.AlreadyPurchasedRecommendations?.length || 0}</p>
              </div>
            </div>
          </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Target className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                    <p className="text-2xl font-bold text-gray-900">{recommendations.Summary?.total_recommendations || 0}</p>
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
                <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                  <p className="text-red-800 font-medium">Backend API Issue Detected:</p>
                  <p className="text-red-700">Please check the backend server connectivity and Strategy Agent service status.</p>
                </div>
              )}
            </div>
          )}

          {/* Results Display - Two Column Layout */}
          {recommendations && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column - Customer Information */}
              <div className="lg:col-span-1 space-y-6">
                {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-lg font-semibold text-gray-900">{recommendations.CustomerInfo?.CustomerName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer ID</p>
                      <p className="text-lg font-semibold text-gray-900">{recommendations.CustomerInfo?.CustomerID || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Classification */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Dot className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Classification</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Type</p>
                      <p className="text-lg font-semibold text-gray-900">{recommendations.CustomerClassification?.CustomerType || 'N/A'}</p>
                    </div>
                  <div>
                      <p className="text-sm font-medium text-gray-600">Stores</p>
                      <p className="text-lg font-semibold text-gray-900">{recommendations.CustomerClassification?.NumberOfStores || 0}</p>
                  </div>
                  <div>
                      <p className="text-sm font-medium text-gray-600">Total Quantity Sold</p>
                      <p className="text-lg font-semibold text-gray-900">{(recommendations.CustomerClassification?.TotalQuantitySold || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Product Recommendations */}
              <div className="lg:col-span-2">
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <Filter className="w-4 h-4" />
                        Filters
                      </button>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('accepted')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'accepted'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Top Matches ({recommendations.AcceptedRecommendations?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab('rejected')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'rejected'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Needs Review ({recommendations.RejectedRecommendations?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab('purchased')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'purchased'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Category ({recommendations.AlreadyPurchasedRecommendations?.length || 0})
                      </button>
                    </nav>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="p-6">
                    {activeTab === 'accepted' && (
                  <div className="space-y-4">
                        {recommendations.AcceptedRecommendations && recommendations.AcceptedRecommendations.length > 0 ? (
                          recommendations.AcceptedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                {/* Product Icon */}
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <TrendingUp className="w-6 h-6 text-gray-600" />
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.ProductName || 'Unknown Product'}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                                        Ready-to-bake whole grain biscuit dough with superior texture and flavor profile
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Recommended Match
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Product Info */}
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs text-gray-500">Category</p>
                                      <p className="text-sm font-medium text-gray-900">Biscuits</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Price</p>
                                      <p className="text-sm font-medium text-gray-900">${rec.CrossSell?.[0]?.Price || 0}</p>
                                    </div>
                                  </div>
                                  
                                  {/* Similarity Match */}
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-500">Similarity Match</span>
                                      <span className="text-xs font-medium text-gray-900">
                                        {((rec.CrossSell?.[0]?.Similarity || 0) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(rec.CrossSell?.[0]?.Similarity || 0) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-3">
                                    <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                                      <Eye className="w-4 h-4" />
                                      View Details
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                      + Add to Proposal
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No accepted recommendations available</p>
                          </div>
                        )}
                </div>
              )}

                    {activeTab === 'rejected' && (
                      <div className="space-y-4">
                        {recommendations.RejectedRecommendations && recommendations.RejectedRecommendations.length > 0 ? (
                          recommendations.RejectedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <X className="w-6 h-6 text-gray-600" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.ProductName || 'Unknown Product'}</h3>
                                      <p className="text-sm text-gray-600 mb-3">
                                        Product requires review before recommendation
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                                        <X className="w-3 h-3" />
                                        Needs Review
                                      </span>
                                    </div>
                  </div>
                  
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs text-gray-500">Category</p>
                                      <p className="text-sm font-medium text-gray-900">N/A</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Price</p>
                                      <p className="text-sm font-medium text-gray-900">$0</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                                      <Eye className="w-4 h-4" />
                                      View Details
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium">
                                      Review Required
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <X className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No rejected recommendations available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'purchased' && (
                      <div className="space-y-4">
                        {recommendations.AlreadyPurchasedRecommendations && recommendations.AlreadyPurchasedRecommendations.length > 0 ? (
                          recommendations.AlreadyPurchasedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Square className="w-6 h-6 text-gray-600" />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.ProductName || 'Unknown Product'}</h3>
                                      <p className="text-sm text-gray-600 mb-3">
                                        Already purchased by customer
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center gap-1">
                                        <Square className="w-3 h-3" />
                                        Already Purchased
                                      </span>
                  </div>
                </div>
                                  
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs text-gray-500">Category</p>
                                      <p className="text-sm font-medium text-gray-900">N/A</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Price</p>
                                      <p className="text-sm font-medium text-gray-900">$0</p>
                                    </div>
                  </div>
                  
                                  <div className="flex items-center gap-3">
                                    <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                                      <Eye className="w-4 h-4" />
                                      View Details
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                    <button className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed text-sm font-medium">
                                      Already Purchased
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Square className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No already purchased products available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};