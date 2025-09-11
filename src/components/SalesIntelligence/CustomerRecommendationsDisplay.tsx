import React, { useState } from 'react';
import { 
  CheckCircle,
  X,
  User,
  Brain
} from 'lucide-react';
import { StrategyAgentResponse } from '../../services/strategyAgentService';

interface CustomerRecommendationsDisplayProps {
  customerRec: StrategyAgentResponse;
  onRegenerate?: (customerId: string) => void;
  isRegenerating?: boolean;
  regenerateMessage?: string;
  showRegenerateButton?: boolean;
}

export const CustomerRecommendationsDisplay: React.FC<CustomerRecommendationsDisplayProps> = ({
  customerRec,
  onRegenerate,
  isRegenerating = false,
  regenerateMessage = '',
  showRegenerateButton = true
}) => {
  const [activeTab, setActiveTab] = useState<'accepted' | 'rejected' | 'purchased'>('accepted');

  const handleTabChange = (tab: 'accepted' | 'rejected' | 'purchased') => {
    setActiveTab(tab);
  };

  const getRecommendationsForTab = () => {
    switch (activeTab) {
      case 'accepted':
        return customerRec.AcceptedRecommendations || [];
      case 'rejected':
        return customerRec.RejectedRecommendations || [];
      case 'purchased':
        return customerRec.AlreadyPurchasedRecommendations || [];
      default:
        return [];
    }
  };


  const getTabIcon = () => {
    switch (activeTab) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <X className="w-4 h-4" />;
      case 'purchased':
        return <User className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getTabColor = () => {
    switch (activeTab) {
      case 'accepted':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'purchased':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 border border-primary-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">
              {customerRec.CustomerInfo?.CustomerName || 'Unknown Customer'}
            </h3>
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
          
          {/* Regenerate Button */}
          {showRegenerateButton && onRegenerate && (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => onRegenerate(customerRec.customer_id)}
                disabled={isRegenerating}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                {isRegenerating ? (
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
          )}
        </div>
        
        {/* Regeneration Status Message */}
        {regenerateMessage && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <p className="text-blue-800 font-medium text-sm">Regeneration Status</p>
            </div>
            <p className="text-blue-700 text-sm mt-1">{regenerateMessage}</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
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
              <User className="w-5 h-5 text-blue-600" />
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
              <p className="text-2xl font-bold text-purple-600">
                {(customerRec.Summary?.TotalCrossSell || 0) + 
                 (customerRec.Summary?.TotalRejected || 0) + 
                 (customerRec.Summary?.TotalAlreadyPurchased || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => handleTabChange('accepted')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'accepted'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Accepted Recommendations ({customerRec.Summary?.TotalCrossSell || 0})
            </button>
            <button
              onClick={() => handleTabChange('rejected')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'rejected'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <X className="w-4 h-4" />
              Rejected Recommendations ({customerRec.Summary?.TotalRejected || 0})
            </button>
            <button
              onClick={() => handleTabChange('purchased')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                activeTab === 'purchased'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              Already Purchased ({customerRec.Summary?.TotalAlreadyPurchased || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <div className="space-y-6">
            {getRecommendationsForTab().length === 0 ? (
              <div className="text-center py-12">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getTabColor()}`}>
                  {getTabIcon()}
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No {activeTab} recommendations</h3>
                <p className="mt-2 text-sm text-gray-500">
                  This customer has no {activeTab} recommendations at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {getRecommendationsForTab().map((recommendation, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {recommendation.ProductName} (ID: {recommendation.CustomerCatalogueItemID})
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Quantity Required: {recommendation.QuantityRequired}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="px-3 py-1 bg-white rounded-full text-gray-700 border">
                          <strong>Product ID:</strong> {recommendation.CustomerCatalogueItemID}
                        </span>
                        <span className="px-3 py-1 bg-white rounded-full text-gray-700 border">
                          <strong>Quantity:</strong> {recommendation.QuantityRequired}
                        </span>
                      </div>
                    </div>
                    
                    {recommendation.Ingredients && recommendation.Ingredients.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Ingredients:</p>
                        <div className="flex flex-wrap gap-2">
                          {recommendation.Ingredients.map((ingredient, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white text-gray-700 text-sm rounded-full border">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {recommendation.AlreadyPurchasedCrossSell && recommendation.AlreadyPurchasedCrossSell.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">Already Purchased Cross-Sell Opportunities:</p>
                        <div className="space-y-3">
                          {recommendation.AlreadyPurchasedCrossSell.map((crossSell, csIndex) => (
                            <div key={csIndex} className="bg-white rounded-lg p-4 border border-blue-200">
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
                                  <strong>Cross-sell opportunity:</strong> This product is similar to what the customer has already purchased and could be a good cross-sell opportunity.
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
