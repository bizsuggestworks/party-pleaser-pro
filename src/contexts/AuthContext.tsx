import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithInstagram: () => Promise<void>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (user: User) => {
    // Check if user is admin based on email or user metadata
    const adminEmails = ['admin@partypresentpro.com', 'venne@example.com']; // Add your admin emails
    const isAdminUser = adminEmails.includes(user.email || '');
    setIsAdmin(isAdminUser);
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        console.error('Google OAuth error:', error);
        // For development, show a helpful message
        if (error.message.includes('provider is not enabled')) {
          throw new Error('Google OAuth is not configured. Please use email/password sign-in for now.');
        }
        throw new Error(`Google sign-in failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithInstagram = async () => {
    try {
      // Instagram doesn't have direct OAuth with Supabase, so we'll use a custom flow
      // For now, we'll redirect to a custom Instagram auth page
      window.open('https://instagram.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user_profile,user_media&response_type=code', '_blank');
    } catch (error) {
      console.error('Error signing in with Instagram:', error);
    }
  };

  const signInDemo = () => {
    // Create a demo user object
    const demoUser: User = {
      id: 'demo-user-123',
      email: 'demo@gifityy.com',
      user_metadata: { 
        full_name: 'Demo User',
        avatar_url: null
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phone: null,
      email_confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      factors: null,
      identities: [],
      confirmed_at: new Date().toISOString(),
      recovery_sent_at: null,
      new_email: null,
      invited_at: null,
      action_link: null,
      email_change_sent_at: null,
      new_phone: null,
      phone_confirmed_at: null,
      phone_change_sent_at: null,
      confirmed_change_at: null,
      email_change_confirm_status: 0,
      phone_change_confirm_status: 0,
      banned_until: null,
      reauthentication_sent_at: null,
      reauthentication_confirm_status: 0,
      is_sso_user: false,
      deleted_at: null,
      is_anonymous: false
    };

    const demoSession: Session = {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: demoUser
    };

    setUser(demoUser);
    setSession(demoSession);
    checkAdminStatus(demoUser);
    
    console.log('Demo user signed in');
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithInstagram,
    signInDemo,
    signOut,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
