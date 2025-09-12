import React from 'react';
import { Table2 } from 'lucide-react';
import { logInfo, logError } from '../../utils/logger';

interface ChatTableDisplayProps {
  tables: string[];
  className?: string;
}

export const ChatTableDisplay: React.FC<ChatTableDisplayProps> = ({ tables, className = '' }) => {
  // Debug logging
  React.useEffect(() => {
    if (tables && tables.length > 0) {
      logInfo('ChatTableDisplay', 'Rendering tables', { 
        tableCount: tables.length,
        tableSizes: tables.map(table => table.length)
      });
    }
  }, [tables]);

  if (!tables || tables.length === 0) {
    return null;
  }

  const parseTableHTML = (tableHTML: string) => {
    try {
      // Create a temporary div to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = tableHTML;
      
      const tableElement = tempDiv.querySelector('table');
      if (!tableElement) {
        logError('ChatTableDisplay', 'No table element found in HTML', new Error('Table parsing failed'));
        return null;
      }

      const rows = Array.from(tableElement.querySelectorAll('tr'));
      const parsedData = rows.map(row => 
        Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent || '')
      );
      
      logInfo('ChatTableDisplay', 'Table parsed successfully', { 
        rowCount: parsedData.length,
        columnCount: parsedData[0]?.length || 0
      });
      
      return parsedData;
    } catch (error) {
      logError('ChatTableDisplay', 'Failed to parse table HTML', error instanceof Error ? error : new Error('Unknown error'));
      return null;
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Table2 className="w-4 h-4" />
        <span className="font-medium">Tables ({tables.length}):</span>
      </div>
      
      <div className="space-y-4">
        {tables.map((tableHTML, index) => {
          const tableData = parseTableHTML(tableHTML);
          
          if (!tableData || tableData.length === 0) {
            return (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-center text-gray-500">
                  <Table2 className="w-5 h-5 mr-2" />
                  <span className="text-sm">Table {index + 1} (Unable to parse)</span>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Table2 className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    Table {index + 1}
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-full border-collapse border border-gray-300">
                  <tbody className="bg-white">
                    {tableData.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 border-b border-gray-200">
                        {row.map((cell, cellIndex) => {
                          const isHeader = rowIndex === 0;
                          return (
                            <td
                              key={cellIndex}
                              className={`px-4 py-3 text-sm border-r border-gray-200 last:border-r-0 ${
                                isHeader 
                                  ? 'font-semibold text-gray-900 bg-gray-50' 
                                  : 'text-gray-700'
                              } ${
                                cellIndex === 0 ? 'font-medium' : ''
                              }`}
                            >
                              {cell || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatTableDisplay;
