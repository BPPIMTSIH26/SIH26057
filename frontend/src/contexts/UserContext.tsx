/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

interface UserProfile {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
}

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isAuthenticated: boolean;
  login: (email: string, name: string, role?: string) => void;
  logout: () => void;
}

const defaultProfile: UserProfile = {
  fullName: 'Narayan',
  email: 'narayan.nkj@gmail.com',
  avatarUrl: null,
  role: 'Supreme Admin',
};

export const UserContext = createContext<UserContextType>({
  profile: defaultProfile,
  updateProfile: () => {},
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      if (sessionStorage.getItem('isAuthenticated') === 'true') {
        const saved = sessionStorage.getItem('sagar_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            fullName: parsed.fullName || parsed.full_name || defaultProfile.fullName,
            email: parsed.email || defaultProfile.email,
            avatarUrl: parsed.avatarUrl || null,
            role: parsed.role || defaultProfile.role,
          };
        }
      }
    } catch {
      // safe fallback
    }
    return defaultProfile;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('isAuthenticated') === 'true';
    } catch {
      return false;
    }
  });

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates };
      try {
        sessionStorage.setItem('sagar_user', JSON.stringify(next));
        localStorage.setItem('sagar_user', JSON.stringify(next));
      } catch {
        // safe
      }
      return next;
    });
  };

  const login = (email: string, name: string, role?: string) => {
    const newProfile: UserProfile = {
      fullName: name || (email.toLowerCase() === 'narayan.nkj@gmail.com' ? 'Narayan' : 'Operator'),
      email,
      avatarUrl: profile.avatarUrl,
      role: role || (email.toLowerCase() === 'narayan.nkj@gmail.com' ? 'Supreme Admin' : 'Operator'),
    };
    setProfile(newProfile);
    setIsAuthenticated(true);
    try {
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('sagar_user', JSON.stringify(newProfile));
      localStorage.setItem('sagar_user', JSON.stringify(newProfile));
    } catch {
      // safe fallback
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setProfile(defaultProfile);
    try {
      sessionStorage.removeItem('isAuthenticated');
      sessionStorage.removeItem('sagar_token');
      sessionStorage.removeItem('sagar_user');
      localStorage.removeItem('sagar_user');
      localStorage.removeItem('isAuthenticated');
    } catch {
      // safe fallback
    }
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, isAuthenticated, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};
