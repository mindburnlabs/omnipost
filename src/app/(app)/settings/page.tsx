
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Trash2,
  Plus,
  Edit,
  Check,
  X,
  Zap,
  Sparkles,
  Database,
  Key
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { platformConnectionsApi, userProfileApi } from "@/lib/omnipost-api";
import { PlatformConnection } from "@/types/omnipost";
import { PlatformSetup } from "@/components/settings/PlatformSetup";
import { AIConfiguration } from "@/components/settings/AIConfiguration";
import { DatabaseStatus } from "@/components/settings/DatabaseStatus";
import { toast } from "sonner";

interface NotificationPreferences {
  push?: boolean;
  email?: boolean;
  schedule_reminders?: boolean;
  approval_notifications?: boolean;
  failure_alerts?: boolean;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [profile, setProfile] = useState({
    display_name: '',
    timezone: 'UTC',
    preferred_language: 'en',
    notification_preferences: {
      push: true,
      email: true,
      schedule_reminders: true,
      approval_notifications: true,
      failure_alerts: true
    } as NotificationPreferences
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connectionsData, profileData] = await Promise.all([
          platformConnectionsApi.getAll(),
          userProfileApi.get()
        ]);
        setConnections(connectionsData);
        if (profileData) {
          // Safely handle notification preferences with proper type checking
          const notificationPrefs = profileData.notification_preferences as Record<string, unknown> || {};
          
          setProfile({
            display_name: profileData.display_name || '',
            timezone: profileData.timezone || 'UTC',
            preferred_language: profileData.preferred_language || 'en',
            notification_preferences: {
              push: typeof notificationPrefs.push === 'boolean' ? notificationPrefs.push : true,
              email: typeof notificationPrefs.email === 'boolean' ? notificationPrefs.email : true,
              schedule_reminders: typeof notificationPrefs.schedule_reminders === 'boolean' ? notificationPrefs.schedule_reminders : true,
              approval_notifications: typeof notificationPrefs.approval_notifications === 'boolean' ? notificationPrefs.approval_notifications : true,
              failure_alerts: typeof notificationPrefs.failure_alerts === 'boolean' ? notificationPrefs.failure_alerts : true
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings data:', error);
        // Mock data for demo
        setConnections([
          {
            id: 1,
            user_id: 1,
            platform_type: 'discord',
            connection_name: 'Main Discord Server',
            api_credentials: {},
            connection_status: 'active',
            last_sync_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            user_id: 1,
            platform_type: 'telegram',
            connection_name: 'Telegram Channel',
            api_credentials: {},
            connection_status: 'active',
            last_sync_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    };

    fetchData();
  }, []);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'discord':
        return '🎮';
      case 'telegram':
        return '✈️';
      case 'whop':
        return '🛍️';
      default:
        return '📱';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'inactive':
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Convert notification preferences to Record<string, unknown> for API compatibility
      const profileData = {
        display_name: profile.display_name,
        timezone: profile.timezone,
        preferred_language: profile.preferred_language,
        notification_preferences: profile.notification_preferences as Record<string, unknown>
      };
      
      await userProfileApi.update(profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (connectionId: number) => {
    try {
      await platformConnectionsApi.delete(connectionId);
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast.success('Connection removed successfully');
    } catch (error) {
      console.error('Failed to delete connection:', error);
      toast.error('Failed to remove connection');
    }
  };

  const handleTestConnection = async (connectionId: number) => {
    try {
      const result = await platformConnectionsApi.testConnection(connectionId);
      if (result.success) {
        toast.success('Connection test successful');
      } else {
        toast.error(result.message || 'Connection test failed');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Connection test failed');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="platforms">
            <Zap className="h-4 w-4 mr-2" />
            Platform Setup
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Configuration
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Settings className="h-4 w-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Platform Setup */}
        <TabsContent value="platforms">
          <PlatformSetup />
        </TabsContent>

        {/* AI Configuration - Enhanced with new provider system */}
        <TabsContent value="ai">
          <AIConfiguration />
        </TabsContent>

        {/* Database Status */}
        <TabsContent value="database">
          <DatabaseStatus />
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={profile.timezone}
                    onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                    placeholder="UTC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Input
                    id="language"
                    value={profile.preferred_language}
                    onChange={(e) => setProfile(prev => ({ ...prev, preferred_language: e.target.value }))}
                    placeholder="en"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Connections */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Platform Connections</CardTitle>
                <Badge variant="secondary">
                  {connections.length} connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {connections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No platform connections configured</p>
                  <Button variant="outline" asChild>
                    <a href="#platforms">
                      <Plus className="h-4 w-4 mr-2" />
                      Set Up Platforms
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {connections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlatformIcon(connection.platform_type)}</span>
                        <div>
                          <h4 className="font-medium">{connection.connection_name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {connection.platform_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(connection.connection_status)}>
                          {connection.connection_status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(connection.id)}
                        >
                          Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteConnection(connection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Push Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications for important updates
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.push ?? true}
                  onCheckedChange={(checked) => 
                    setProfile(prev => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        push: checked
                      }
                    }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for scheduled posts and updates
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.email ?? true}
                  onCheckedChange={(checked) => 
                    setProfile(prev => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        email: checked
                      }
                    }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Schedule Reminders</h4>
                  <p className="text-sm text-muted-foreground">
                    Get reminders before your posts are scheduled to publish
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.schedule_reminders ?? true}
                  onCheckedChange={(checked) => 
                    setProfile(prev => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        schedule_reminders: checked
                      }
                    }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Approval Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified when posts need approval or are approved
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.approval_notifications ?? true}
                  onCheckedChange={(checked) => 
                    setProfile(prev => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        approval_notifications: checked
                      }
                    }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Failure Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Get immediate alerts when posts fail to publish
                  </p>
                </div>
                <Switch
                  checked={profile.notification_preferences.failure_alerts ?? true}
                  onCheckedChange={(checked) => 
                    setProfile(prev => ({
                      ...prev,
                      notification_preferences: {
                        ...prev.notification_preferences,
                        failure_alerts: checked
                      }
                    }))
                  }
                />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button>Update Password</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-red-600">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
