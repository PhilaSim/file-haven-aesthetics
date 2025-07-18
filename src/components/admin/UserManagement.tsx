import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Users, UserCheck, Files, Shield, Clock } from 'lucide-react';

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
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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