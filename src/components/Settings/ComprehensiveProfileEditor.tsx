import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  MessageSquare, 
  Save, 
  Edit, 
  X, 
  CheckCircle, 
  AlertCircle,
  Info,
  Calendar,
  Clock,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { userAPI } from '../../services/api';
import { logInfo, logError, logWarn } from '../../utils/logger';

interface ComprehensiveProfile {
  basicInfo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    fullName: string;
  };
  accountInfo: {
    role: 'ADMIN' | 'USER';
    organizationId: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
    lastLogin?: string;
  };
  integrationInfo: {
    gmailId?: string;
    slackId?: string;
    teamId?: string;
  };
  integrationStatus: {
    gmailConnected: boolean;
    slackConnected: boolean;
    teamsConnected: boolean;
    totalConnected: number;
  };
  permissions: {
    isAdmin: boolean;
    canEditRole: boolean;
    canEditStatus: boolean;
  };
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'USER';
  enabled: boolean;
  gmailId: string;
  slackId: string;
  teamId: string;
}

export const ComprehensiveProfileEditor: React.FC = () => {
  const [profile, setProfile] = useState<ComprehensiveProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'USER',
    enabled: true,
    gmailId: '',
    slackId: '',
    teamId: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load comprehensive profile
  useEffect(() => {
    loadComprehensiveProfile();
  }, []);

  const loadComprehensiveProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
             logInfo('Loading comprehensive user profile...');
       const response = await userAPI.getComprehensiveProfile();
       const profileData = response.data;
       
       setProfile(profileData);
       
       // Initialize form data with proper null handling
       setFormData({
         firstName: profileData.basicInfo.firstName || '',
         lastName: profileData.basicInfo.lastName || '',
         email: profileData.basicInfo.email || '',
         phone: profileData.basicInfo.phone || '',
         role: profileData.accountInfo.role,
         enabled: profileData.accountInfo.enabled,
         gmailId: profileData.integrationInfo.gmailId || '',
         slackId: profileData.integrationInfo.slackId || '',
         teamId: profileData.integrationInfo.teamId || ''
       });
       
       logInfo(`Comprehensive profile loaded successfully for user: ${profileData.basicInfo.id} with ${profileData.integrationStatus.totalConnected} integrations`);
      
    } catch (err: any) {
      logError('Failed to load comprehensive profile', err);
      setError(err?.response?.data?.message || 'Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.basicInfo.id) return;
    
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
             logInfo(`Saving comprehensive profile changes for user: ${profile.basicInfo.id}`);
      
             // Update basic user information with proper null handling
       const updatePayload = {
         firstName: formData.firstName,
         lastName: formData.lastName,
         email: formData.email,
         phone: formData.phone || null,
         role: formData.role,
         enabled: formData.enabled,
         gmailId: formData.gmailId || null,
         slackId: formData.slackId || null,
         teamId: formData.teamId || null
       };
      
      const response = await userAPI.update(profile.basicInfo.id, updatePayload);
      
      // Reload profile to get updated data
      await loadComprehensiveProfile();
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
             logInfo(`Profile updated successfully for user: ${profile.basicInfo.id} with fields: ${Object.keys(updatePayload).join(', ')}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      logError('Failed to save profile', err);
      setError(err?.response?.data?.message || 'Failed to save profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      logInfo('Changing user password...');
      
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully!');
      
      logInfo('Password changed successfully');
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      logError('Failed to change password', err);
      setError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load profile information</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Comprehensive Profile</h2>
          <p className="text-slate-600 mt-1">Manage all your account information and settings</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={isSaving}
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Basic Information
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                />
              </div>
            </div>
            
                         <div>
               <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Mail className="w-4 h-4" />
                 Email Address
               </label>
               <input
                 type="email"
                 value={formData.email}
                 disabled
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                 title="Email cannot be edited"
               />
               <p className="text-xs text-slate-500 mt-1">Email address cannot be modified</p>
             </div>
            
                         <div>
               <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Phone className="w-4 h-4" />
                 Phone Number
                 <span className="text-xs text-slate-500">(Optional)</span>
               </label>
               <input
                 type="tel"
                 value={formData.phone}
                 onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                 disabled={!isEditing}
                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                 placeholder="+1 (555) 123-4567 (Optional)"
               />
             </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Account Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'USER' }))}
                disabled={!isEditing || !profile.permissions.canEditRole}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Organization ID</label>
              <input
                type="text"
                value={profile.accountInfo.organizationId}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
              />
            </div>
            
            {profile.permissions.canEditStatus && (
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Account Status</label>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
                  disabled={!isEditing}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.enabled ? 'bg-green-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Created: {formatDate(profile.accountInfo.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last Updated: {formatDate(profile.accountInfo.updatedAt)}</span>
                </div>
                {profile.accountInfo.lastLogin && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Last Login: {formatDate(profile.accountInfo.lastLogin)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Integration Information */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            Integration IDs
            <span className="text-sm font-normal text-slate-500">
              ({profile.integrationStatus.totalConnected}/3 configured)
            </span>
          </h3>
          
          <div className="space-y-4">
            <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Mail className="w-4 h-4 text-red-600" />
                 Gmail ID
                 <span className="text-xs text-slate-500">(Optional)</span>
                 {profile.integrationStatus.gmailConnected && (
                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                     <CheckCircle className="w-3 h-3 mr-1" />
                     Connected
                   </span>
                 )}
               </label>
              <input
                type="text"
                value={formData.gmailId}
                onChange={(e) => setFormData(prev => ({ ...prev, gmailId: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter your Gmail ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 ${
                  profile.integrationStatus.gmailConnected ? 'border-green-300 bg-green-50/50' : 'border-slate-300'
                }`}
              />
            </div>
            
            <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-purple-600" />
                 Slack ID
                 <span className="text-xs text-slate-500">(Optional)</span>
                 {profile.integrationStatus.slackConnected && (
                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                     <CheckCircle className="w-3 h-3 mr-1" />
                     Connected
                   </span>
                 )}
               </label>
              <input
                type="text"
                value={formData.slackId}
                onChange={(e) => setFormData(prev => ({ ...prev, slackId: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter your Slack ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 ${
                  profile.integrationStatus.slackConnected ? 'border-green-300 bg-green-50/50' : 'border-slate-300'
                }`}
              />
            </div>
            
            <div>
                             <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-blue-600" />
                 Teams ID
                 <span className="text-xs text-slate-500">(Optional)</span>
                 {profile.integrationStatus.teamsConnected && (
                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                     <CheckCircle className="w-3 h-3 mr-1" />
                     Connected
                   </span>
                 )}
               </label>
              <input
                type="text"
                value={formData.teamId}
                onChange={(e) => setFormData(prev => ({ ...prev, teamId: e.target.value }))}
                disabled={!isEditing}
                placeholder="Enter your Teams ID"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 ${
                  profile.integrationStatus.teamsConnected ? 'border-green-300 bg-green-50/50' : 'border-slate-300'
                }`}
              />
            </div>
            
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 flex items-start gap-2">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                These integration IDs are used for sending notifications and alerts to your preferred communication platforms.
              </p>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-600" />
            Change Password
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter current password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <button
              onClick={handleChangePassword}
              disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Key className="w-4 h-4" />
              {isSaving ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
};
