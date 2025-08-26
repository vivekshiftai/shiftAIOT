import axios, { AxiosInstance } from 'axios';
import { getApiConfig } from '../config/api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

class TokenService {
  private static instance: TokenService;
  private tokenRefreshPromise: Promise<string | null> | null = null;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: getApiConfig().BACKEND_BASE_URL,
      // Removed timeout for better user experience
    });
  }

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  // Get token from localStorage
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  // Set token in localStorage and axios headers
  public setToken(token: string, refreshToken?: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    this.setAxiosAuthHeader(token);
  }

  // Remove token from localStorage and axios headers
  public removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(USER_KEY);
    delete this.axiosInstance.defaults.headers.common.Authorization;
  }

  // Set axios authorization header
  public setAxiosAuthHeader(token: string): void {
    this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  // Check if token exists
  public hasToken(): boolean {
    return !!this.getToken();
  }

  // Get user from localStorage
  public getUser(): any | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Set user in localStorage
  public setUser(user: any): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Validate token by making a test request - NEVER remove token on failure
  public async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      console.warn('No token found for validation');
      return false;
    }

    try {
      // Set token in headers
      this.setAxiosAuthHeader(token);
      
      // Make a simple request to validate token
      const response = await this.axiosInstance.get('/api/users/profile');
      console.log('✅ Token validation successful:', response.status);
      return response.status === 200;
    } catch (error: any) {
      console.warn('⚠️ Token validation failed, but keeping token:', error.message);
      if (error.response) {
        console.warn('⚠️ Token validation error response:', error.response.status, error.response.data);
      }
      // NEVER remove token on validation failure - let user stay logged in
      return false;
    }
  }

  // Get refresh token from localStorage
  public getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Refresh token with retry logic
  public async refreshToken(): Promise<string | null> {
    const currentToken = this.getToken();
    const refreshToken = this.getRefreshToken();
    
    if (!currentToken || !refreshToken) {
      console.warn('No token or refresh token available for refresh');
      return null;
    }

    // If already refreshing, return the existing promise
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const newToken = await this.tokenRefreshPromise;
      return newToken;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string | null> {
    try {
      console.log('🔄 Attempting token refresh...');
      const response = await this.axiosInstance.post('/api/auth/refresh', { token: refreshToken });
      const newToken = response.data?.token;
      const newRefreshToken = response.data?.refreshToken;
      
      if (newToken) {
        console.log('✅ Token refresh successful');
        this.setToken(newToken, newRefreshToken);
        return newToken;
      }
      
      console.warn('⚠️ No new token received from refresh endpoint');
      return null;
    } catch (error: any) {
      console.error('⚠️ Token refresh failed, but keeping existing token:', error.message);
      if (error.response) {
        console.error('⚠️ Token refresh error response:', error.response.status, error.response.data);
      }
      // NEVER remove token on refresh failure - let user stay logged in with existing token
      return null;
    }
  }

  // Initialize token from localStorage
  public initializeToken(): void {
    const token = this.getToken();
    if (token) {
      this.setAxiosAuthHeader(token);
    }
  }
}

export const tokenService = TokenService.getInstance();
