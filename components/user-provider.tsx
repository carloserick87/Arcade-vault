"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadUser, saveUser, type User } from "@/lib/storage";

interface UserContextValue {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Read on mount (not in useState init) so server and first client render match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(loadUser());
  }, []);

  const login = (u: User) => {
    setUser(u);
    saveUser(u);
  };

  const logout = () => {
    setUser(null);
    saveUser(null);
  };

  return <UserContext.Provider value={{ user, login, logout }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
