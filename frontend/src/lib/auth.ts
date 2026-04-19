import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role, UserProfile, ReceptionistProfile } from "@workspace/api-client-react";

interface AuthState {
  role: Role | null;
  userId: string | null;
  receptionistId: string | null;
  adminName: string | null;
  user: UserProfile | null;
  receptionist: ReceptionistProfile | null;
  setAuth: (data: { role: Role; user: UserProfile | null; receptionist: ReceptionistProfile | null; adminName: string | null }) => void;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      role: null,
      userId: null,
      receptionistId: null,
      adminName: null,
      user: null,
      receptionist: null,
      setAuth: (data) => set({
        role: data.role,
        userId: data.user?.id || null,
        receptionistId: data.receptionist?.id || null,
        adminName: data.adminName,
        user: data.user,
        receptionist: data.receptionist,
      }),
      logout: async () => {
        const state = get();
        if (state.role) {
          try {
            await fetch("/api/smart-tourist/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                role: state.role,
                id: state.userId || state.receptionistId || "admin",
                name: state.user?.name || state.receptionist?.name || state.adminName,
                stationId: state.receptionist?.stationId || null
              })
            });
          } catch (e) {
            console.error("Logout audit failed:", e);
          }
        }
        set({ role: null, userId: null, receptionistId: null, adminName: null, user: null, receptionist: null });
      },
    }),
    {
      name: "smart-tourist-auth",
    }
  )
);
