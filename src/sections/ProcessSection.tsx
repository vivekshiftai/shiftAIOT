import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Download,
  Send,
  User,
  Plus,
  CheckCircle,
  X,
  Clock,
  BarChart3
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

  const testAPIConnectivity = async () => {
    try {
      console.log('🔍 Testing Strategy Agent API connectivity via backend...');
      const connectionResult = await StrategyAgentService.testConnection();
      console.log('🔍 Connection test result:', connectionResult);
      
      if (connectionResult.connected) {
        console.log('✅ Strategy Agent API is accessible via backend:', connectionResult.message);
      } else {
        console.error('❌ Strategy Agent API connection failed:', connectionResult.message);
      }
    } catch (error) {
      console.error('❌ Strategy Agent API connectivity test failed:', error);
    }
  };

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
      {/* Fixed Header */}
      <div className="knowledge-fixed-header flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Process</h1>
              <p className="text-sm text-gray-600">AI-powered marketing intelligence and cross-sell recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Customer Selection Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Select Customer</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a customer to generate marketing intelligence recommendations:
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={isLoading}
                >
                  <option value="">Select a customer...</option>
                  {availableCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={generateRecommendations}
                  disabled={!selectedCustomer || isLoading}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating Recommendations...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Generate Marketing Intelligence
                    </>
                  )}
                </button>
                
                <button
                  onClick={testAPIConnectivity}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Test API Connection
                </button>
              </div>
            </div>
          </div>

          {/* Backend Integration Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">Backend Integration Active</p>
            </div>
            <p className="text-green-700 mt-1 text-sm">
              All API calls are now routed through the backend proxy to avoid CORS issues. 
              Use the "Test API Connection" button to verify connectivity.
            </p>
          </div>

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

          {/* Results Display */}
          {recommendations && (
            <div className="space-y-6">
              
              {/* Customer Info & Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Analysis Summary</h2>
                  </div>
                  <button
                    onClick={downloadPDFReport}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Accepted</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {recommendations.AcceptedRecommendations?.length || 0}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Rejected</span>
                    </div>
                    <p className="text-2xl font-bold text-red-900">
                      {recommendations.Summary?.total_rejected || 0}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Already Purchased</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {recommendations.Summary?.total_already_purchased || 0}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-800">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {recommendations.Summary?.total_recommendations || 0}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Name:</strong> {recommendations.CustomerInfo?.CustomerName || 'N/A'}<br/>
                      <strong>ID:</strong> {recommendations.CustomerInfo?.CustomerID || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Classification</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Type:</strong> {recommendations.CustomerClassification?.CustomerType || 'N/A'}<br/>
                      <strong>Stores:</strong> {recommendations.CustomerClassification?.NumberOfStores || 0}<br/>
                      <strong>Total Quantity Sold:</strong> {(recommendations.CustomerClassification?.TotalQuantitySold || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabbed Recommendations Display */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('accepted')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'accepted'
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Accepted ({recommendations.AcceptedRecommendations?.length || 0})
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('rejected')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'rejected'
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Rejected ({recommendations.RejectedRecommendations?.length || 0})
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('purchased')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'purchased'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Already Purchased ({recommendations.AlreadyPurchasedRecommendations?.length || 0})
                      </div>
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'accepted' && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Accepted Cross-Sell Recommendations</h2>
                      </div>
                      
                      {recommendations.AcceptedRecommendations && recommendations.AcceptedRecommendations.length > 0 ? (
                        <div className="space-y-4">
                          {recommendations.AcceptedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <h3 className="font-medium text-gray-900 mb-2">{rec.ProductName || 'Unknown Product'}</h3>
                              <p className="text-sm text-gray-600 mb-3">
                                Required Quantity: {rec.QuantityRequired || 0} | Ingredients: {(rec.Ingredients || []).join(', ') || 'N/A'}
                              </p>
                              
                              {rec.CrossSell && rec.CrossSell.length > 0 && (
                                <div className="space-y-3">
                                  {rec.CrossSell.map((crossSell, csIndex) => (
                                    <div key={csIndex} className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-green-900">{crossSell.SuggestedProduct || 'Unknown Product'}</h4>
                                        <span className="text-sm font-bold text-green-700">${crossSell.Price || 0}</span>
                                      </div>
                                      <p className="text-sm text-green-800 mb-2">
                                        <strong>Category:</strong> {crossSell.Category || 'N/A'} | 
                                        <strong> Similarity:</strong> {((crossSell.Similarity || 0) * 100).toFixed(1)}%
                                      </p>
                                      <p className="text-sm text-green-700">{crossSell.AIReasoning || 'No reasoning provided'}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No accepted recommendations available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'rejected' && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <X className="w-5 h-5 text-red-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Rejected Recommendations</h2>
                      </div>
                      
                      {recommendations.RejectedRecommendations && recommendations.RejectedRecommendations.length > 0 ? (
                        <div className="space-y-4">
                          {recommendations.RejectedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <h3 className="font-medium text-gray-900 mb-2">{rec.ProductName || 'Unknown Product'}</h3>
                              
                              {rec.RejectedCrossSell && rec.RejectedCrossSell.length > 0 && (
                                <div className="space-y-3">
                                  {rec.RejectedCrossSell.map((crossSell, csIndex) => (
                                    <div key={csIndex} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-red-900">{crossSell.SuggestedProduct || 'Unknown Product'}</h4>
                                        <span className="text-sm font-bold text-red-700">${crossSell.Price || 0}</span>
                                      </div>
                                      <p className="text-sm text-red-800 mb-2">
                                        <strong>Category:</strong> {crossSell.Category || 'N/A'} | 
                                        <strong> Similarity:</strong> {((crossSell.Similarity || 0) * 100).toFixed(1)}%
                                      </p>
                                      <p className="text-sm text-red-700">{crossSell.AIReasoning || 'No reasoning provided'}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <X className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No rejected recommendations available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'purchased' && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Already Purchased Products</h2>
                      </div>
                      
                      {recommendations.AlreadyPurchasedRecommendations && recommendations.AlreadyPurchasedRecommendations.length > 0 ? (
                        <div className="space-y-4">
                          {recommendations.AlreadyPurchasedRecommendations.map((rec, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <h3 className="font-medium text-gray-900 mb-2">{rec.ProductName || 'Unknown Product'}</h3>
                              
                              {rec.AlreadyPurchasedCrossSell && rec.AlreadyPurchasedCrossSell.length > 0 && (
                                <div className="space-y-3">
                                  {rec.AlreadyPurchasedCrossSell.map((crossSell, csIndex) => (
                                    <div key={csIndex} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-medium text-blue-900">{crossSell.SuggestedProduct || 'Unknown Product'}</h4>
                                        <span className="text-sm font-bold text-blue-700">${crossSell.Price || 0}</span>
                                      </div>
                                      <p className="text-sm text-blue-800 mb-2">
                                        <strong>Category:</strong> {crossSell.Category || 'N/A'} | 
                                        <strong> Similarity:</strong> {((crossSell.Similarity || 0) * 100).toFixed(1)}%
                                      </p>
                                      <p className="text-sm text-blue-700">{crossSell.AIReasoning || 'No reasoning provided'}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No already purchased products available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};