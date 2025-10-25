import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, User, Phone, MapPin, Instagram, Chrome, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface LoginScreenProps {
  onClose: () => void;
}

export const LoginScreen = ({ onClose }: LoginScreenProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: ""
  });
  
  const { signInWithGoogle, signInWithInstagram, signInDemo } = useAuth();
  const { toast } = useToast();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              address: formData.address,
            },
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome Back!",
          description: "You've been successfully signed in.",
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Email auth error:', error);
      toast({
        title: "Authentication Error",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Don't close immediately for OAuth as it redirects
      // The auth state change will handle the UI update
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Google Sign-in Failed",
        description: error.message || "Google OAuth is not configured. Please use email/password sign-in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramSignIn = async () => {
    setLoading(true);
    try {
      // For now, show a message that Instagram login is coming soon
      toast({
        title: "Instagram Login",
        description: "Instagram login is coming soon! Please use Google or email sign-in for now.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Instagram Sign-in Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isSignUp ? "Sign up to get started" : "Sign in to your account"}
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isSignUp ? "signup" : "signin"} onValueChange={(value) => setIsSignUp(value === "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a password"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter your phone number"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <User className="w-4 h-4 mr-2" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>
            
            <Button
              onClick={handleInstagramSignIn}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              <Instagram className="w-4 h-4 mr-2" />
              Continue with Instagram (Coming Soon)
            </Button>
            
            {/* Demo Authentication for Testing */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium mb-2">Quick Demo Access</p>
              <Button
                onClick={() => {
                  signInDemo();
                  toast({
                    title: "Demo Login",
                    description: "Logged in as demo user with admin access.",
                  });
                  onClose();
                }}
                className="w-full bg-green-600 text-white hover:bg-green-700"
                disabled={loading}
              >
                <User className="w-4 h-4 mr-2" />
                Demo Login (Admin Access)
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={onClose} className="text-sm">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
