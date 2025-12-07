
import React, { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import { User } from './types';
import { authService } from './services/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    setShowAuth(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) return null; // Or a loading spinner

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <>
          <Landing onStart={() => setShowAuth(true)} />
          {showAuth && (
            <Auth 
              onLogin={handleLogin} 
              onClose={() => setShowAuth(false)} 
            />
          )}
        </>
      )}
    </>
  );
};

export default App;
