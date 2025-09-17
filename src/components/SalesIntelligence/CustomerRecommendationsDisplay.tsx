import React, { useState } from 'react';
import { 
  CheckCircle,
  X,
  User,
  Brain,
  Search
} from 'lucide-react';
import { StrategyAgentResponse } from '../../services/strategyAgentService';

interface CustomerRecommendationsDisplayProps {
  customerRec: StrategyAgentResponse;
}

export const CustomerRecommendationsDisplay: React.FC<CustomerRecommendationsDisplayProps> = ({
  customerRec
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-lg">
      {/* Left Column - Customer Information (25% width) */}
      <div className="lg:col-span-1 space-y-4">
        {/* Customer Information Card */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Name</p>
              <p className="text-lg font-bold text-gray-900">{customerRec.CustomerInfo?.CustomerName || 'Unknown Customer'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Customer ID</p>
              <p className="text-base font-semibold text-gray-900">{customerRec.customer_id}</p>
            </div>
            {customerRec.CustomerClassification && (
              <div className="mt-3 space-y-2">
                <span className="px-3 py-1 bg-white rounded-full text-gray-700 border text-sm">
                  <strong>Type:</strong> {customerRec.CustomerClassification.CustomerType}
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-gray-700 border text-sm">
                  <strong>Stores:</strong> {customerRec.CustomerClassification.NumberOfStores}
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-gray-700 border text-sm">
                  <strong>Quantity Sold:</strong> {customerRec.CustomerClassification.TotalQuantitySold?.toLocaleString()}
                </span>
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
              <p className="text-base font-semibold text-gray-900">{customerRec.CustomerClassification?.CustomerType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Stores</p>
              <p className="text-base font-semibold text-gray-900">{customerRec.CustomerClassification?.NumberOfStores || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quantity Sold</p>
              <p className="text-base font-semibold text-gray-900">{(customerRec.CustomerClassification?.TotalQuantitySold || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Product Recommendations (75% width) */}
      <div className="lg:col-span-3 space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Recommendation</p>
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
              <p className="text-sm font-medium text-gray-600">Needs Review</p>
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

      {/* Recommendations Section */}
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
              onClick={() => handleTabChange('accepted')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'accepted'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Top Recommendations ({customerRec.Summary?.TotalCrossSell || 0})
            </button>
            <button
              onClick={() => handleTabChange('rejected')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'rejected'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Needs Review ({customerRec.Summary?.TotalRejected || 0})
            </button>
            <button
              onClick={() => handleTabChange('purchased')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'purchased'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Already Purchased ({customerRec.Summary?.TotalAlreadyPurchased || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 bg-white">
          <div className="space-y-6 bg-white rounded-lg border border-gray-200">
            {getRecommendationsForTab().length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
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
                  <div key={index} className={`rounded-lg p-4 hover:shadow-md transition-shadow border  ${
                    index % 2 === 0 ? 'bg-pink-100' : 'bg-purple-100'
                  }`}>
                    <div className={`mb-4 rounded-lg p-3 ${
                      index % 2 === 0 ? 'bg-pink-100' : 'bg-purple-100'
                    }`}>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {recommendation.ProductName} (ID: {recommendation.CustomerCatalogueItemID})
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Quantity Required: {recommendation.QuantityRequired} | 
                        Ingredients: {recommendation.Ingredients?.join(', ')}
                      </p>
                      <p className="text-sm font-medium font-semibold text-green-700">
                        Presents {recommendation.CrossSell?.length || 0} cross-sell opportunities:
                      </p>
                    </div>
                    
                    {recommendation.CrossSell && recommendation.CrossSell.length > 0 && (
                      <div>
                        <div className="space-y-3">
                          {recommendation.CrossSell.map((crossSell, csIndex) => (
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
                      </div>
                    )}
                    
                    {recommendation.RejectedCrossSell && recommendation.RejectedCrossSell.length > 0 && (
                      <div>
                        <div className="space-y-3">
                          {recommendation.RejectedCrossSell.map((crossSell, csIndex) => (
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
                      </div>
                    )}
                    
                    {recommendation.AlreadyPurchasedCrossSell && recommendation.AlreadyPurchasedCrossSell.length > 0 && (
                      <div>
                        <div className="space-y-3">
                          {recommendation.AlreadyPurchasedCrossSell.map((crossSell, csIndex) => (
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
    </div>
  );
};
