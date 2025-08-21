/**
 * Handles authentication errors gracefully
 */
export const handleAuthError = (error: any, fallbackMessage: string = 'Authentication failed'): string => {
  // Don't show authentication errors to users - let them continue using the app
  if (error.response?.status === 401) {
    console.warn('Authentication error detected, but not showing to user');
    return 'Operation failed. Please try again.';
  } else if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  } else if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  } else if (error.message?.includes('token')) {
    console.warn('Token error detected, but not showing to user');
    return 'Operation failed. Please try again.';
  }
  return error?.message || fallbackMessage;
};
