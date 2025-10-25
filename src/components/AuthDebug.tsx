import { useAuth } from '@/contexts/AuthContext';

export const AuthDebug = () => {
  const { user, loading, isAdmin, signInDemo, signOut } = useAuth();
  
  console.log('AuthDebug component rendered');
  console.log('AuthDebug - user:', user);
  console.log('AuthDebug - loading:', loading);
  console.log('AuthDebug - isAdmin:', isAdmin);
  console.log('AuthDebug - signInDemo:', typeof signInDemo);
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      background: 'white', 
      border: '1px solid black', 
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>IsAdmin: {isAdmin ? 'true' : 'false'}</div>
      <div>SignInDemo: {typeof signInDemo}</div>
      <button onClick={signInDemo} style={{ margin: '5px', padding: '5px' }}>
        Test Demo
      </button>
      <button onClick={signOut} style={{ margin: '5px', padding: '5px' }}>
        Test SignOut
      </button>
      <button onClick={() => window.location.reload()} style={{ margin: '5px', padding: '5px' }}>
        Refresh Page
      </button>
      <button onClick={() => {
        console.log('Force re-render triggered');
        window.location.reload();
      }} style={{ margin: '5px', padding: '5px' }}>
        Force Re-render
      </button>
    </div>
  );
};
