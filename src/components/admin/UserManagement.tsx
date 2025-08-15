import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Users, UserCheck, Files, Shield, Clock, Trash2, UserX, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  file_count?: number;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get auth users with email info
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error fetching auth users:', authError);
          return;
        }

        // Get user profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('users')
          .select('*');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Get file counts for each user
        const userIds = authUsers.users.map(u => u.id);
        const { data: fileCounts, error: fileError } = await supabase
          .from('files')
          .select('user_id')
          .in('user_id', userIds);

        if (fileError) {
          console.error('Error fetching file counts:', fileError);
        }

        // Create file count map
        const fileCountMap = new Map();
        fileCounts?.forEach(file => {
          const count = fileCountMap.get(file.user_id) || 0;
          fileCountMap.set(file.user_id, count + 1);
        });

        // Combine auth users with profiles
        const usersWithProfiles = authUsers.users.map(authUser => {
          const profile = profilesData?.find(p => p.id === authUser.id);
          return {
            id: authUser.id,
            email: authUser.email || '',
            full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
            display_name: profile?.display_name || '',
            avatar_url: profile?.avatar_url || '',
            role: profile?.role || 'user',
            created_at: authUser.created_at,
            file_count: fileCountMap.get(authUser.id) || 0
          };
        });

        setUsers(usersWithProfiles);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      // Delete user from auth.users (this will cascade to other tables)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Error deleting user from auth:', authError);
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      toast({
        title: "User deleted",
        description: `User ${userEmail} has been permanently deleted.`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateUser = async (userId: string, userEmail: string) => {
    try {
      // In Supabase, we can't truly "deactivate" a user, but we can sign them out
      // and potentially update their role or add a status flag
      const { error } = await supabase.auth.admin.signOut(userId);
      
      if (error) {
        console.error('Error signing out user:', error);
        toast({
          title: "Error",
          description: "Failed to deactivate user. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "User deactivated",
        description: `User ${userEmail} has been signed out from all sessions.`,
      });
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate user. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>Manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Total users: {users.length} • Admins: {users.filter(u => u.role === 'admin').length} • Regular users: {users.filter(u => u.role !== 'admin').length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user.avatar_url || ""} 
                          alt={user.display_name || user.full_name || "User"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {(user.display_name || user.full_name || user.email)?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.display_name || user.full_name || 'No name'}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.role === 'admin' ? "default" : "secondary"} 
                      className={`flex items-center gap-1 ${user.role === 'admin' ? 'bg-gradient-to-r from-primary to-primary/80' : ''}`}
                    >
                      {user.role === 'admin' && <Shield className="h-3 w-3" />}
                      {user.role === 'admin' ? "Admin" : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Files className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.file_count || 0}</span>
                      <span className="text-muted-foreground">files</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role !== 'admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeactivateUser(user.id, user.email || '')}>
                            <UserX className="mr-2 h-4 w-4" />
                            Sign out user
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete user
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user "{user.email}" and remove all their data from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.email || '')}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
