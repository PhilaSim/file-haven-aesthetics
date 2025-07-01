
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [defaultViewMode, setDefaultViewMode] = useState(
    localStorage.getItem('defaultViewMode') || 'grid'
  );
  const [emailReminders, setEmailReminders] = useState(
    localStorage.getItem('emailReminders') !== 'false'
  );

  const handleSaveProfile = () => {
    if (displayName.trim() !== user?.name) {
      updateUser({ ...user!, name: displayName.trim() });
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    }
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (currentPassword !== user?.password) {
      toast({
        title: "Error",
        description: "Current password is incorrect.",
        variant: "destructive",
      });
      return;
    }

    updateUser({ ...user!, password: newPassword });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'neo') => {
    setTheme(newTheme);
    localStorage.setItem('defaultTheme', newTheme);
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme} theme as default.`,
    });
  };

  const handleViewModeChange = (mode: string) => {
    setDefaultViewMode(mode);
    localStorage.setItem('defaultViewMode', mode);
    toast({
      title: "View mode updated",
      description: `Default view mode set to ${mode}.`,
    });
  };

  const handleEmailRemindersToggle = () => {
    const newValue = !emailReminders;
    setEmailReminders(newValue);
    localStorage.setItem('emailReminders', newValue.toString());
    toast({
      title: "Preferences updated",
      description: `Email reminders ${newValue ? 'enabled' : 'disabled'}.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-primary">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveProfile}>Save Profile</Button>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword}>Change Password</Button>
            </CardContent>
          </Card>

          {/* Theme Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>Choose your default theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['light', 'dark', 'neo'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => handleThemeChange(themeOption)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === themeOption ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <div className="text-sm font-medium capitalize">{themeOption} Theme</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Default View Mode</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={defaultViewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => handleViewModeChange('grid')}
                  >
                    Grid
                  </Button>
                  <Button
                    variant={defaultViewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => handleViewModeChange('list')}
                  >
                    List
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Reminders</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications about your files</p>
                </div>
                <Button
                  variant={emailReminders ? 'default' : 'outline'}
                  onClick={handleEmailRemindersToggle}
                >
                  {emailReminders ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
