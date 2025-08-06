import React, { useState } from 'react';
import { Upload, Search, FileText, Brain, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { KnowledgeDocument } from '../types';

const mockDocuments: KnowledgeDocument[] = [
  {
    id: '1',
    name: 'Device Manual - Temperature Sensors.pdf',
    type: 'pdf',
    uploadedAt: '2025-01-10T08:00:00Z',
    processedAt: '2025-01-10T08:05:00Z',
    size: 2457600,
    status: 'completed',
    vectorized: true
  },
  {
    id: '2',
    name: 'Troubleshooting Guide - HVAC Systems.docx',
    type: 'docx',
    uploadedAt: '2025-01-11T14:30:00Z',
    processedAt: '2025-01-11T14:35:00Z',
    size: 1536000,
    status: 'completed',
    vectorized: true
  },
  {
    id: '3',
    name: 'Installation Manual - IoT Gateways.pdf',
    type: 'pdf',
    uploadedAt: '2025-01-12T09:15:00Z',
    size: 3072000,
    status: 'processing',
    vectorized: false
  }
];

export const KnowledgeSection: React.FC = () => {
  const [documents] = useState<KnowledgeDocument[]>(mockDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    // Simulate AI search
    setTimeout(() => {
      setSearchResults([
        {
          id: '1',
          document: 'Device Manual - Temperature Sensors.pdf',
          excerpt: 'When temperature readings exceed 35°C, check the sensor calibration and ensure proper ventilation around the device.',
          relevance: 0.95
        },
        {
          id: '2',
          document: 'Troubleshooting Guide - HVAC Systems.docx',
          excerpt: 'High temperature alerts can indicate HVAC system malfunction. Verify thermostat settings and check for blocked air vents.',
          relevance: 0.87
        }
      ]);
      setIsSearching(false);
    }, 1500);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: KnowledgeDocument['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered document search and analysis for predictive maintenance
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* AI Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Powered Search</h3>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Ask questions about your devices, troubleshooting, or maintenance..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6 space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">AI Search Results:</h4>
            {searchResults.map((result) => (
              <div key={result.id} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-blue-900 dark:text-blue-300">{result.document}</h5>
                  <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/50 px-2 py-1 rounded">
                    {Math.round(result.relevance * 100)}% match
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{result.excerpt}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Library */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Library</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {documents.length} documents indexed for AI search
          </p>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {documents.map((doc) => (
            <div key={doc.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{doc.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      {doc.processedAt && (
                        <span>Processed {new Date(doc.processedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                      {doc.status}
                    </span>
                  </div>
                  
                  {doc.vectorized && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-full">
                      <Brain className="w-3 h-3" />
                      AI Ready
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {documents.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No documents yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload your first document to start building your AI-powered knowledge base.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Upload Document
          </button>
        </div>
      )}
    </div>
  );
};