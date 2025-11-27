import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      scheduleAutoLogout(token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  // parse jwt exp claim
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

  // schedule auto logout when token expires
  const logoutTimerRef = useRef(null);
  const scheduleAutoLogout = (t) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    const exp = parseJwtExp(t);
    if (!exp) return;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      logout();
      return;
    }
    logoutTimerRef.current = setTimeout(() => {
      logout();
      window.location.reload();
    }, ms + 1000);
  };

  return (
    <AuthContext.Provider
      value={{ token, user, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
