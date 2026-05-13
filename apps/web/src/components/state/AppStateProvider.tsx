"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
}

interface CartResponse {
  items?: { quantity?: number }[];
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AppState {
  authStatus: AuthStatus;
  user: User | null;
  cartQuantity: number;
  refreshSession: () => Promise<void>;
  refreshCart: () => Promise<void>;
  setCart: (cart: CartResponse | null) => void;
  logout: () => Promise<void>;
}

const AppStateContext = createContext<AppState | null>(null);

function getCartQuantity(cart: CartResponse | null) {
  return cart?.items?.reduce((total, item) => total + (item.quantity ?? 0), 0) ?? 0;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [cartQuantity, setCartQuantity] = useState(0);

  const setCart = useCallback((cart: CartResponse | null) => {
    setCartQuantity(getCartQuantity(cart));
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        setCart(null);
        return;
      }

      setCart((await res.json()) as CartResponse);
    } catch {
      setCart(null);
    }
  }, [setCart]);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        setAuthStatus("unauthenticated");
        setCart(null);
        return;
      }

      const data = (await res.json()) as { user: User };
      setUser(data.user);
      setAuthStatus("authenticated");
      await refreshCart();
    } catch {
      setUser(null);
      setAuthStatus("unauthenticated");
      setCart(null);
    }
  }, [refreshCart, setCart]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Clear local app state even if the logout request cannot complete.
    } finally {
      setUser(null);
      setAuthStatus("unauthenticated");
      setCart(null);
    }
  }, [setCart]);

  useEffect(() => {
    void refreshSession();
  }, [pathname, refreshSession]);

  const value = useMemo(
    () => ({
      authStatus,
      user,
      cartQuantity,
      refreshSession,
      refreshCart,
      setCart,
      logout,
    }),
    [authStatus, user, cartQuantity, refreshSession, refreshCart, setCart, logout]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
