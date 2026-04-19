import React, { createContext, useContext, useEffect, useState } from "react";
import { Role, UserProfile, ReceptionistProfile } from "@workspace/api-client-react";

interface AuthState {
  role: Role | null;
  userId: string | null;
  receptionistId: string | null;
  adminName: string | null;
  user: UserProfile | null;
  receptionist: ReceptionistProfile | null;
}

interface AuthContextType extends AuthState {
  setAuth: (data: { role: Role; user: UserProfile | null; receptionist: ReceptionistProfile | null; adminName: string | null }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem("smart-tourist-auth");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {
      role: null,
      userId: null,
      receptionistId: null,
      adminName: null,
      user: null,
      receptionist: null,
    };
  });

  useEffect(() => {
    localStorage.setItem("smart-tourist-auth", JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    const handleRefresh = (e: any) => {
      if (e.detail?.receptionist) {
        setAuthState(prev => ({ ...prev, receptionist: e.detail.receptionist }));
      }
      if (e.detail?.user) {
        setAuthState(prev => ({ ...prev, user: e.detail.user }));
      }
    };
    window.addEventListener("smart-tourist-auth-refresh", handleRefresh);
    return () => window.removeEventListener("smart-tourist-auth-refresh", handleRefresh);
  }, []);

  const setAuth = (data: { role: Role; user: UserProfile | null; receptionist: ReceptionistProfile | null; adminName: string | null }) => {
    setAuthState({
      role: data.role,
      userId: data.user?.id || null,
      receptionistId: data.receptionist?.id || null,
      adminName: data.adminName,
      user: data.user,
      receptionist: data.receptionist,
    });
  };

  const logout = () => {
    setAuthState({
      role: null,
      userId: null,
      receptionistId: null,
      adminName: null,
      user: null,
      receptionist: null,
    });
  };

  return (
    <AuthContext.Provider value={{ ...auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
