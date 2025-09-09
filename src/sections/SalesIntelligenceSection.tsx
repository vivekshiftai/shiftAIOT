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

    try {
      logInfo('Process', `Generating recommendations for customer: ${selectedCustomer}`);
      const response = await StrategyAgentService.generateRecommendations(selectedCustomer);
      setRecommendations(response);
      logInfo('Process', 'Recommendations generated successfully');
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
      await StrategyAgentService.downloadPDFReport(selectedCustomer);
      logInfo('Process', 'PDF report downloaded successfully');
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
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Processes
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Intelligence</h1>
              <p className="text-sm text-gray-600 mt-1">AI-powered cross-sell recommendations and analysis</p>
            </div>
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
                    <Bot className="w-5 h-5 text-blue-600" />
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
                    <Brain className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(recommendations.AcceptedRecommendations?.length || 0) + 
                       (recommendations.RejectedRecommendations?.length || 0) + 
                       (recommendations.AlreadyPurchasedRecommendations?.length || 0)}
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

          {/* Results Display - Two Column Layout */}
          {recommendations && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left Column - Customer Information (25% width) */}
              <div className="lg:col-span-1">
                {/* Combined Customer Information and Classification */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                  </div>
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-base font-semibold text-gray-900">{recommendations.CustomerInfo?.CustomerName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer ID</p>
                      <p className="text-base font-semibold text-gray-900">{recommendations.CustomerInfo?.CustomerID || 'N/A'}</p>
                    </div>
                    
                    {/* Classification Info */}
                    <div className="pt-3 border-t border-gray-100">
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
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <button className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                        <Filter className="w-4 h-4" />
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
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Top Matches ({recommendations.AcceptedRecommendations?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab('rejected')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'rejected'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Needs Review ({recommendations.RejectedRecommendations?.length || 0})
                      </button>
                      <button
                        onClick={() => setActiveTab('purchased')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'purchased'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Already Purchased ({recommendations.AlreadyPurchasedRecommendations?.length || 0})
                      </button>
                    </nav>
                  </div>

                  {/* Recommendation Content */}
                  <div className="p-4">
                    {activeTab === 'accepted' && (
                  <div className="space-y-4">
                        {recommendations.AcceptedRecommendations && recommendations.AcceptedRecommendations.length > 0 ? (
                          recommendations.AcceptedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-4">
                                {/* Product Icon */}
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Send className="w-6 h-6 text-gray-600" />
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.ProductName || 'Unknown Product'}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {rec.CrossSell?.[0]?.AIReasoning || rec.Ingredients?.join(', ') || 'Cross-sell recommendation based on customer data'}
                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                        {rec.Category || 'General'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Product Info Grid */}
                                  <div className="grid grid-cols-3 gap-4 mb-3">
                                    <div>
                                      <p className="text-xs text-gray-500">Category</p>
                                      <p className="text-sm font-medium text-gray-900">{rec.Category || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Price</p>
                                      <p className="text-sm font-medium text-gray-900">${rec.CrossSell?.[0]?.Price || 'TBD'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Similarity Match</p>
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(rec.CrossSell?.[0]?.Similarity || 0) * 100}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-xs text-gray-600">
                                          {Math.round((rec.CrossSell?.[0]?.Similarity || 0) * 100)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Accepted Recommendations</h3>
                            <p className="text-gray-600">No cross-sell recommendations have been accepted yet.</p>
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
                                {/* Product Icon */}
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <X className="w-6 h-6 text-gray-600" />
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.ProductName || 'Unknown Product'}</h3>
                                      <p className="text-sm text-gray-600 mb-3">
                                        {rec.RejectedCrossSell?.[0]?.AIReasoning || 'Recommendation was rejected based on customer data analysis'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                        {rec.Category || 'General'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Product Info Grid */}
                                  <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                      <p className="text-xs text-gray-500">Category</p>
                                      <p className="text-sm font-medium text-gray-900">{rec.Category || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Price</p>
                                      <p className="text-sm font-medium text-gray-900">${rec.RejectedCrossSell?.[0]?.Price || 'TBD'}</p>
                                    </div>
                                  </div>
                                  
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <X className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rejected Recommendations</h3>
                            <p className="text-gray-600">No recommendations have been rejected yet.</p>
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
                                {/* Product Icon */}
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Bot className="w-6 h-6 text-gray-600" />
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{rec.ProductName || 'Unknown Product'}</h3>
                                      <p className="text-sm text-gray-600 mb-3">
                                        {rec.AlreadyPurchasedCrossSell?.[0]?.AIReasoning || 'This product has already been purchased by the customer'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                        {rec.Category || 'General'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Product Info Grid */}
                                  <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                      <p className="text-xs text-gray-500">Category</p>
                                      <p className="text-sm font-medium text-gray-900">{rec.Category || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">Price</p>
                                      <p className="text-sm font-medium text-gray-900">${rec.AlreadyPurchasedCrossSell?.[0]?.Price || 'N/A'}</p>
                                    </div>
                  </div>
                                  
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Bot className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Already Purchased Items</h3>
                            <p className="text-gray-600">No products have been marked as already purchased.</p>
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
