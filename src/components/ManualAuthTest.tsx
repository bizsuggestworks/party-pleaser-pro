import { useAuth } from '@/contexts/AuthContext';

export const ManualAuthTest = () => {
  const { signInDemo } = useAuth();
  
  const testDemoLogin = () => {
    console.log('=== MANUAL DEMO LOGIN TEST ===');
    console.log('localStorage before:', localStorage.getItem('demo-session'));
    
    // Clear any existing session
    localStorage.removeItem('demo-session');
    
    // Create demo session manually
    const demoUser = {
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

    const demoSession = {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: demoUser
    };

    // Store in localStorage
    localStorage.setItem('demo-session', JSON.stringify({
      user: demoUser,
      session: demoSession,
      timestamp: Date.now()
    }));
    
    console.log('Demo session stored:', localStorage.getItem('demo-session'));
    
    // Call signInDemo
    signInDemo();
    
    console.log('=== MANUAL DEMO LOGIN COMPLETE ===');
  };
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '60px', 
      left: '10px', 
      background: 'yellow', 
      border: '2px solid red', 
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div>Manual Auth Test</div>
      <button onClick={testDemoLogin} style={{ margin: '5px', padding: '5px' }}>
        Manual Demo Login
      </button>
      <button onClick={() => {
        console.log('Current localStorage:', localStorage.getItem('demo-session'));
      }} style={{ margin: '5px', padding: '5px' }}>
        Check localStorage
      </button>
    </div>
  );
};
