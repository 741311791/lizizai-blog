/**
 * Visitor ID Management
 * 
 * This module provides functionality for managing anonymous visitor identification
 * using browser localStorage. Each visitor gets a unique ID that persists across sessions.
 */

const VISITOR_ID_KEY = 'visitor_id';

/**
 * Generate a new unique visitor ID using the Web Crypto API
 * @returns A UUID v4 string
 */
function generateVisitorId(): string {
  // Use crypto.randomUUID() for secure random UUID generation
  // This is supported in all modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers (though this shouldn't be needed in modern environments)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get the current visitor ID from localStorage, or generate a new one if it doesn't exist
 * 
 * IMPORTANT: This function must only be called in client-side code (useEffect, event handlers, etc.)
 * to avoid SSR errors with localStorage.
 * 
 * @returns The visitor ID string, or null if called during SSR
 */
export function getVisitorId(): string | null {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Try to get existing visitor ID from localStorage
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    
    // If no visitor ID exists, generate a new one
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    
    return visitorId;
  } catch (error) {
    // Handle localStorage errors (e.g., in private browsing mode)
    console.error('Failed to access localStorage for visitor ID:', error);
    return null;
  }
}

/**
 * Clear the visitor ID from localStorage
 * This is useful for testing or debugging purposes
 */
export function clearVisitorId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(VISITOR_ID_KEY);
  } catch (error) {
    console.error('Failed to clear visitor ID:', error);
  }
}

/**
 * Check if a visitor ID exists in localStorage
 * @returns true if a visitor ID exists, false otherwise
 */
export function hasVisitorId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem(VISITOR_ID_KEY) !== null;
  } catch (error) {
    console.error('Failed to check visitor ID:', error);
    return false;
  }
}
