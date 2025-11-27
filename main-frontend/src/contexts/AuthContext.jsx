import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
      // schedule automatic logout when token expires
      scheduleAutoLogout(token);
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    scheduleAutoLogout(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Helper: parse JWT and return exp (seconds since epoch) or null
  const parseJwtExp = (t) => {
    try {
      const parts = t.split(".");
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        window.atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload.exp || null;
    } catch (e) {
      return null;
    }
  };

  // Schedule auto logout when token expires. Clears any previous timer.
  const logoutTimerRef = useRef(null);
  const scheduleAutoLogout = (t) => {
    // clear previous
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    const exp = parseJwtExp(t);
    if (!exp) return;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      // token already expired
      logout();
      return;
    }
    logoutTimerRef.current = setTimeout(() => {
      logout();
      // Optionally reload page to force redirect to login
      window.location.reload();
    }, ms + 1000); // small buffer
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
