import { supabase } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'org_admin' | 'device_manager' | 'operator' | 'viewer';
  avatar?: string;
  organization_id: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  organization_id: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  async register(userData: RegisterData): Promise<{ user: User; token: string }> {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role,
      organization_id: userData.organization_id,
      permissions: this.getDefaultPermissions(userData.role),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select('id, name, email, role, organization_id, permissions, created_at, updated_at')
      .single();

    if (error) throw error;

    // Generate JWT token
    const token = this.generateToken(data.id);

    return { user: data, token };
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', credentials.email)
      .single();

    if (error || !user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate JWT token
    const token = this.generateToken(user.id);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async refreshToken(token: string): Promise<{ user: User; token: string }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, role, organization_id, permissions, created_at, updated_at, last_login')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        throw new Error('Invalid token');
      }

      const newToken = this.generateToken(user.id);
      return { user, token: newToken };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id, permissions, created_at, updated_at, last_login')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, name, email, role, organization_id, permissions, created_at, updated_at, last_login')
      .single();

    if (error) throw error;
    return data;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get current user
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;
  }

  async getUsers(organizationId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id, permissions, created_at, updated_at, last_login')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  private getDefaultPermissions(role: User['role']): string[] {
    const permissions: Record<User['role'], string[]> = {
      super_admin: ['*'], // All permissions
      org_admin: [
        'device:read', 'device:write', 'device:delete',
        'rule:read', 'rule:write', 'rule:delete',
        'user:read', 'user:write', 'user:delete',
        'notification:read', 'notification:write',
        'knowledge:read', 'knowledge:write', 'knowledge:delete'
      ],
      device_manager: [
        'device:read', 'device:write',
        'rule:read', 'rule:write',
        'notification:read',
        'knowledge:read'
      ],
      operator: [
        'device:read',
        'rule:read',
        'notification:read',
        'knowledge:read'
      ],
      viewer: [
        'device:read',
        'notification:read',
        'knowledge:read'
      ]
    };

    return permissions[role] || [];
  }
}

export const authService = new AuthService();