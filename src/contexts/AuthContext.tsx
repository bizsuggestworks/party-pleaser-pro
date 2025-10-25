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
    console.log('=== AUTH CONTEXT INIT ===');
    // Check for demo session first
    const demoSession = localStorage.getItem('demo-session');
    console.log('Demo session in localStorage:', demoSession);
    if (demoSession) {
      try {
        const { user, session, timestamp } = JSON.parse(demoSession);
        // Check if demo session is still valid (24 hours) AND has correct email
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000 && user.email === 'demo@giftify.com') {
          setUser(user);
          setSession(session);
          checkAdminStatus(user);
          setLoading(false);
          console.log('Demo session restored:', user);
          return;
        } else {
          // Remove expired or outdated demo session
          localStorage.removeItem('demo-session');
          console.log('Demo session removed (expired or outdated email)');
        }
      } catch (error) {
        console.error('Error restoring demo session:', error);
        localStorage.removeItem('demo-session');
      }
    } else {
      console.log('No demo session found in localStorage');
    }

    // Also check for old email format and clear it
    if (demoSession) {
      try {
        const { user } = JSON.parse(demoSession);
        if (user.email === 'demo@gifityy.com') {
          localStorage.removeItem('demo-session');
          console.log('Old demo session cleared (gifityy.com email)');
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Get initial session from Supabase
    console.log('Getting initial session from Supabase...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Supabase session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user);
      }
      setLoading(false);
      console.log('Auth context initialization complete');
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
    const adminEmails = [
      'admin@partypresentpro.com', 
      'venne@example.com',
      'demo@giftify.com', // Demo user is admin for testing
      'admin@giftify.com'
    ];
    const isAdminUser = adminEmails.includes(user.email || '');
    setIsAdmin(isAdminUser);
    console.log('Admin check:', { email: user.email, isAdmin: isAdminUser });
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
    console.log('=== DEMO SIGN-IN START ===');
    console.log('Starting demo sign-in...');
    console.log('Current user before:', user);
    console.log('Current loading state:', loading);
    console.log('Current isAdmin state:', isAdmin);
    
    // Clear any existing demo session first
    localStorage.removeItem('demo-session');
    
    // Create a demo user object
    const demoUser: User = {
      id: 'demo-user-123',
      email: 'demo@giftify.com',
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

    // Set the demo user and session
    setUser(demoUser);
    setSession(demoSession);
    setLoading(false);
    
    // Check admin status
    checkAdminStatus(demoUser);
    
    console.log('Demo user signed in successfully:', demoUser);
    console.log('User state set to:', demoUser);
    console.log('Session state set to:', demoSession);
    
    // Check admin status manually
    const adminEmails = [
      'admin@partypresentpro.com', 
      'venne@example.com',
      'demo@giftify.com', // Demo user is admin for testing
      'admin@giftify.com'
    ];
    const isAdminUser = adminEmails.includes(demoUser.email);
    setIsAdmin(isAdminUser);
    console.log('Admin status:', isAdminUser);
    
    // Store demo session in localStorage for persistence
    localStorage.setItem('demo-session', JSON.stringify({
      user: demoUser,
      session: demoSession,
      timestamp: Date.now()
    }));
    
    console.log('=== DEMO SIGN-IN COMPLETE ===');
    console.log('Final user state:', user);
    console.log('Final loading state:', loading);
    console.log('Final isAdmin state:', isAdmin);
    console.log('Demo session stored in localStorage');
  };

  const signOut = async () => {
    try {
      // Clear demo session if it exists
      localStorage.removeItem('demo-session');
      
      // Try to sign out from Supabase (might fail if not signed in)
      try {
        const { error } = await supabase.auth.signOut();
        if (error) console.log('Supabase sign out error (expected for demo):', error);
      } catch (error) {
        console.log('Supabase sign out error (expected for demo):', error);
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
      
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  // Force clear all sessions and reset
  const clearAllSessions = () => {
    localStorage.removeItem('demo-session');
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setLoading(false);
    console.log('All sessions cleared');
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithInstagram,
    signInDemo,
    signOut,
    clearAllSessions,
    isAdmin,
  };

  // Expose auth state to window for debugging
  useEffect(() => {
    (window as any).user = user;
    (window as any).loading = loading;
    (window as any).isAdmin = isAdmin;
    (window as any).session = session;
    (window as any).signInDemo = signInDemo;
    (window as any).signOut = signOut;
    (window as any).clearAllSessions = clearAllSessions;
  }, [user, loading, isAdmin, session, signInDemo, signOut, clearAllSessions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
