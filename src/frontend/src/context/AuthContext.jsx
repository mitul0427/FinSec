import React, { createContext, useContext, useState, useEffect } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { authApi, setAccessToken, getAccessToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and check current profile
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await authApi.profile();
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            setAccessToken(null);
          }
        } catch (e) {
          console.error('Failed to restore session:', e);
          setAccessToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('finsec_logout', handleLogoutEvent);
    return () => window.removeEventListener('finsec_logout', handleLogoutEvent);
  }, []);

  // Password Login
  const loginWithPassword = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Register
  const registerUser = async (email, password, fullName, role = 'USER') => {
    setError(null);
    try {
      const res = await authApi.register({ email, password, fullName, role });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // WebAuthn Passkey Registration (Enroll Current Device / Biometrics)
  const enrollPasskey = async () => {
    setError(null);
    try {
      // Step 1: Get challenge options from server
      const optRes = await authApi.webauthnRegisterOptions();
      if (!optRes.ok) throw new Error('Failed to get passkey options from gateway.');
      const options = await optRes.json();

      // Step 2: Invoke browser WebAuthn API (FaceID / TouchID / Windows Hello / YubiKey)
      const regResponse = await startRegistration(options);

      // Step 3: Send attestation back to server
      const verifyRes = await authApi.webauthnVerifyRegistration(regResponse);
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Passkey verification failed');

      return verifyData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // WebAuthn Passkey Login (Passwordless Authentication)
  const loginWithPasskey = async (email = '') => {
    setError(null);
    try {
      // Step 1: Get authentication challenge from server
      const optRes = await authApi.webauthnAuthOptions({ email });
      if (!optRes.ok) throw new Error('Failed to get authentication options.');
      const { options, challenge } = await optRes.json();

      // Step 2: Invoke browser WebAuthn prompt
      const authResponse = await startAuthentication(options);

      // Step 3: Verify with server
      const verifyRes = await authApi.webauthnVerifyAuth({
        response: authResponse,
        email,
        challenge
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Passkey authentication failed');

      setAccessToken(verifyData.accessToken);
      setUser(verifyData.user);
      return verifyData.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    setAccessToken(null);
    setUser(null);
  };

  // Update Profile & Custom Gemini Key
  const updateProfile = async (updates) => {
    const res = await authApi.updateProfile(updates);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
