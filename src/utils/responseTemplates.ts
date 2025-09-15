/**
 * Utility functions for formatting knowledge base responses with personalized templates
 */

import { logError } from './logger';

export interface ResponseTemplate {
  id: string;
  template: string;
  emoji: string;
}

// Personalized response templates
export const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    id: 'friendly',
    template: 'Hey {username}! 👋 Here\'s what I found for you:',
    emoji: '👋'
  },
  {
    id: 'professional',
    template: 'Hello {username}, here\'s your answer from the knowledge base:',
    emoji: '📚'
  },
  {
    id: 'helpful',
    template: 'Hi {username}! 🤖 I\'ve got the information you\'re looking for:',
    emoji: '🤖'
  },
  {
    id: 'enthusiastic',
    template: 'Great question, {username}! 🎯 Here\'s what I found:',
    emoji: '🎯'
  },
  {
    id: 'supportive',
    template: 'I\'m here to help, {username}! 💡 Here\'s your answer:',
    emoji: '💡'
  },
  {
    id: 'confident',
    template: 'Perfect! {username}, here\'s the information you need:',
    emoji: '✨'
  }
];

/**
 * Get a random response template
 */
export function getRandomTemplate(): ResponseTemplate {
  const randomIndex = Math.floor(Math.random() * RESPONSE_TEMPLATES.length);
  return RESPONSE_TEMPLATES[randomIndex];
}

/**
 * Format a knowledge base response with a personalized template
 */
export function formatKnowledgeBaseResponse(
  rawResponse: any,
  username: string = 'there'
): string {
  try {
    // Extract clean response content
    let cleanResponse = '';
    
    if (typeof rawResponse === 'string') {
      cleanResponse = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object') {
      // Handle different response structures
      if (rawResponse.response) {
        cleanResponse = rawResponse.response;
      } else if (rawResponse.content) {
        cleanResponse = rawResponse.content;
      } else if (rawResponse.message) {
        cleanResponse = rawResponse.message;
      } else {
        // If it's an object but no known response field, stringify and clean
        cleanResponse = JSON.stringify(rawResponse);
      }
    } else {
      cleanResponse = String(rawResponse || 'No response available');
    }
    
    // Clean up the response - remove JSON structure if present
    if (cleanResponse.includes('"response":')) {
      try {
        // Try to parse as JSON first
        const jsonResponse = JSON.parse(cleanResponse);
        if (jsonResponse.response) {
          cleanResponse = jsonResponse.response;
        }
      } catch (parseError) {
        // If JSON parsing fails, use regex cleanup
        cleanResponse = cleanResponse
          .replace(/^\{[\s\S]*?"response":\s*"/, '') // Remove opening JSON structure
          .replace(/"[\s\S]*?\}$/, '') // Remove closing JSON structure
          .replace(/\\n/g, '\n') // Convert escaped newlines to actual newlines
          .replace(/\\"/g, '"') // Convert escaped quotes
          .replace(/\\t/g, '\t') // Convert escaped tabs
          .trim();
      }
    }
    
    // Additional cleanup for escaped characters
    cleanResponse = cleanResponse
      .replace(/\\n/g, '\n') // Convert escaped newlines to actual newlines
      .replace(/\\"/g, '"') // Convert escaped quotes
      .replace(/\\t/g, '\t') // Convert escaped tabs
      .trim();
    
    // Get random template
    const template = getRandomTemplate();
    
    // Format the final response
    const personalizedGreeting = template.template.replace('{username}', username);
    
    return `${personalizedGreeting}\n\n${cleanResponse}`;
    
  } catch (error) {
    logError('ResponseTemplates', 'Error formatting knowledge base response', error instanceof Error ? error : new Error('Unknown error'));
    
    // Fallback to simple template
    const fallbackTemplate = RESPONSE_TEMPLATES[0];
    const fallbackGreeting = fallbackTemplate.template.replace('{username}', username);
    
    return `${fallbackGreeting}\n\n${String(rawResponse || 'No response available')}`;
  }
}

/**
 * Extract clean response content without templates (for cases where you just want the content)
 */
export function extractCleanResponse(rawResponse: any): string {
  try {
    let cleanResponse = '';
    
    if (typeof rawResponse === 'string') {
      cleanResponse = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object') {
      if (rawResponse.response) {
        cleanResponse = rawResponse.response;
      } else if (rawResponse.content) {
        cleanResponse = rawResponse.content;
      } else if (rawResponse.message) {
        cleanResponse = rawResponse.message;
      } else {
        cleanResponse = JSON.stringify(rawResponse);
      }
    } else {
      cleanResponse = String(rawResponse || 'No response available');
    }
    
    // Clean up the response
    cleanResponse = cleanResponse
      .replace(/^\{[\s\S]*?"response":\s*"/, '')
      .replace(/"[\s\S]*?\}$/, '')
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t')
      .trim();
    
    return cleanResponse;
    
  } catch (error) {
    logError('ResponseTemplates', 'Error extracting clean response', error instanceof Error ? error : new Error('Unknown error'));
    return String(rawResponse || 'No response available');
  }
}

/**
 * Get user display name from auth context or return default
 */
export function getUserDisplayName(user: any): string {
  if (!user) return 'there';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.firstName) {
    return user.firstName;
  } else if (user.username) {
    return user.username;
  } else if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'there';
}
