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
      timeout: 10000,
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
  public setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.setAxiosAuthHeader(token);
  }

  // Remove token from localStorage and axios headers
  public removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
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

  // Validate token by making a test request
  public async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Set token in headers
      this.setAxiosAuthHeader(token);
      
      // Make a simple request to validate token
      const response = await this.axiosInstance.get('/api/users/profile');
      return response.status === 200;
    } catch (error: any) {
      console.warn('Token validation failed:', error.message);
      return false;
    }
  }

  // Refresh token with retry logic
  public async refreshToken(): Promise<string | null> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return null;
    }

    // If already refreshing, return the existing promise
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh(currentToken);
    
    try {
      const newToken = await this.tokenRefreshPromise;
      return newToken;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async performTokenRefresh(currentToken: string): Promise<string | null> {
    try {
      const response = await this.axiosInstance.post('/auth/refresh', { token: currentToken });
      const newToken = response.data?.token;
      
      if (newToken) {
        this.setToken(newToken);
        return newToken;
      }
      
      return null;
    } catch (error: any) {
      console.error('Token refresh failed:', error.message);
      // If refresh fails, remove the token
      this.removeToken();
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

  // Check authentication status with detailed information
  public getAuthStatus(): {
    isAuthenticated: boolean;
    hasToken: boolean;
    tokenLength: number;
    hasUser: boolean;
    userInfo: any | null;
  } {
    const token = this.getToken();
    const user = this.getUser();
    
    return {
      isAuthenticated: !!(token && user),
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasUser: !!user,
      userInfo: user
    };
  }

  // Log authentication status for debugging
  public logAuthStatus(): void {
    const status = this.getAuthStatus();
    console.log('🔐 Authentication Status:', status);
  }
}

export const tokenService = TokenService.getInstance();
