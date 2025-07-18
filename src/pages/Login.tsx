import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  FileText, 
  CheckCircle, 
  Shield, 
  Upload, 
  Folder,
  Sun,
  Moon,
  Check
} from 'lucide-react';
import { signupSchema, loginSchema, SignupFormData, LoginFormData } from '@/schemas/auth';
import loginIllustration from '@/assets/login-illustration.png';

export const Login = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      confirmPassword: '',
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    setShowEmailVerification(false);

    try {
      const { error } = await login(data.email, data.password);
      
      if (error) {
        let errorMessage = 'An unexpected error occurred';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
        
        toast({
          title: 'Login failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have been logged in successfully.',
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setLoading(true);
    setShowEmailVerification(false);

    try {
      const { error } = await signup(data.email, data.password, data.fullName);
      
      if (error) {
        let errorMessage = 'An unexpected error occurred';
        if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('Unable to validate email address')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Signup requires a valid password')) {
          errorMessage = 'Please enter a valid password.';
        } else {
          errorMessage = error.message;
        }
        
        toast({
          title: 'Signup failed',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        setShowEmailVerification(true);
        signupForm.reset();
        toast({
          title: 'Account created successfully!',
          description: 'Please check your email to verify your account before signing in.',
        });
      }
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Upload, text: "Upload & manage files securely" },
    { icon: Shield, text: "Enterprise-grade security" },
    { icon: Folder, text: "Organized file management" },
    { icon: CheckCircle, text: "Admin oversight & control" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side - Branding & Illustration */}
        <div className="hidden lg:flex flex-col justify-center px-12 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="max-w-lg mx-auto text-center space-y-8">
            {/* Logo and Branding */}
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  FileVaults
                </h1>
                <p className="text-xl text-muted-foreground mt-2">
                  Securely store, access, and manage your files anywhere
                </p>
              </div>
            </div>

            {/* Illustration */}
            <div className="relative">
              <img 
                src={loginIllustration} 
                alt="File management illustration"
                className="w-full max-w-md mx-auto rounded-xl shadow-lg"
              />
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Why choose FileVaults?</h3>
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Branding */}
            <div className="text-center lg:hidden">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">FileVaults</h1>
              <p className="text-muted-foreground">Securely store and manage your files</p>
            </div>

            <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your account or create a new one to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email address</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Enter your email"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter your password"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full h-11" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Sign In
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    {showEmailVerification && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Account created successfully! Please check your email and click the verification link before signing in.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Form {...signupForm}>
                      <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                        <FormField
                          control={signupForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Enter your full name"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email address</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Enter your email"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a password (min. 6 characters)"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={signupForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Confirm your password"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full h-11" disabled={loading}>
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Account
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Mobile Benefits */}
            <div className="lg:hidden space-y-3">
              <h4 className="text-sm font-medium text-center">Trusted by professionals</h4>
              <div className="grid grid-cols-2 gap-2">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};