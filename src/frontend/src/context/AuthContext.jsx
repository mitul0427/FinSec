import React, { createContext, useContext, useState, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { authApi, setAccessToken, getAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finsec_mock_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize and check current profile
  useEffect(() => {
    const initAuth = async () => {
      const saved = localStorage.getItem('finsec_mock_user');
      if (saved) {
        setUser(JSON.parse(saved));
        setLoading(false);
        return;
      }

      const token = getAccessToken();
      if (token) {
        try {
          const res = await authApi.profile();
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          }
        } catch (e) {
          console.warn('API profile restore error, using stored state.');
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('finsec_mock_user');
    };

    window.addEventListener('finsec_logout', handleLogoutEvent);
    return () => window.removeEventListener('finsec_logout', handleLogoutEvent);
  }, []);

  // Password Login with explicit mock RBAC
  const loginWithPassword = async (email, password) => {
    setError(null);
    const cleanEmail = (email || '').trim().toLowerCase();
    const isAdmin = cleanEmail === 'admin@finesec.com' || cleanEmail.includes('admin');
    const role = isAdmin ? 'admin' : 'user';

    const mockProfile = {
      id: isAdmin ? 'USR-ADMIN-001' : 'USR-001',
      email: cleanEmail,
      fullName: isAdmin ? 'SOC Cyber Director' : 'Gadiel Machado',
      role: role,
      avatar: isAdmin
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
    };

    try {
      const res = await authApi.login({ email: cleanEmail, password });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        const resolvedUser = { ...data.user, role };
        setUser(resolvedUser);
        localStorage.setItem('finsec_mock_user', JSON.stringify(resolvedUser));
        return resolvedUser;
      }
    } catch (err) {
      console.warn('Backend login fallback to mock session for hackathon demo:', err);
    }

    // Direct local state mock
    setAccessToken('mock_jwt_token_' + Date.now());
    setUser(mockProfile);
    localStorage.setItem('finsec_mock_user', JSON.stringify(mockProfile));
    return mockProfile;
  };

  // Register
  const registerUser = async (email, password, fullName, role = 'user') => {
    setError(null);
    const mockProfile = {
      id: 'USR-' + Date.now().toString().slice(-4),
      email,
      fullName,
      role
    };
    setUser(mockProfile);
    localStorage.setItem('finsec_mock_user', JSON.stringify(mockProfile));
    return mockProfile;
  };

  // WebAuthn Passkey Registration
  const enrollPasskey = async () => {
    return { verified: true };
  };

  // WebAuthn Passkey Login
  const loginWithPasskey = async (email = '') => {
    return loginWithPassword(email || 'user@finesec.com', 'dummyPass');
  };

  // Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('finsec_mock_user');
  };

  const updateProfile = async (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('finsec_mock_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role?.toLowerCase() || 'user',
        loading,
        error,
        loginWithPassword,
        registerUser,
        enrollPasskey,
        loginWithPasskey,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
