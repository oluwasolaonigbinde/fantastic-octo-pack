"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserData, UserLoginResponse } from "@/types/user";
// import { LoginFormData } from "@/app/(auth)/login/login.schema";
import { RegisterFormData } from "@/app/(auth)/register/register.schema";
import { apiUrl } from "@/utils/api-base-url";

// Legacy-only auth context retained for brownfield reference. AppProviders no longer mounts it globally.

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  authFetch: (url:string, options: RequestInit) => Promise<Response>
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

interface Token {
  accessToken: string;
  refreshToken: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
export const TokenManager = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },

  setTokens: (tokens: Token): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
  },

  getUserData: (): UserData | null => {
    if (typeof window === "undefined") return null;
    const userData = localStorage.getItem("userData");
    return userData ? JSON.parse(userData) : null;
  },

  setUserData: (userData: UserData): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem("userData", JSON.stringify(userData));
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  // useEffect(() => {
  //   const initializeAuth = async () => {
  //     try {
  //       const savedUser = TokenManager.getUserData();
  //       const accessToken = TokenManager.getAccessToken();

  //       if (savedUser && accessToken) {
  //         // Verify token is still valid
  //         const isValid = await verifyToken(accessToken);
  //         if (isValid) {
  //           setUser(savedUser);
  //         } else {
  //           // Try to refresh token
  //           const refreshed = await refreshToken();
  //           if (!refreshed) {
  //             TokenManager.clearTokens();
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Auth initialization error:', error);
  //       TokenManager.clearTokens();
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   initializeAuth();
  // }, []);

  useEffect(() => {
    // This only runs on client-side after hydration
    const initializeAuth = async () => {
      try {
        const savedUser = TokenManager.getUserData();
        const accessToken = TokenManager.getAccessToken();

        if (savedUser && accessToken) {
          const isValid = await verifyToken(accessToken);
          if (isValid) {
            setUser(savedUser);
          } else {
            // Try to refresh token
            const refreshed = await refreshToken();
            if (!refreshed) {
              TokenManager.clearTokens();
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        TokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    // Mount-only: verifyToken and refreshToken read tokens from localStorage
    // (TokenManager), not from captured React state — no stale-closure risk.
    // Adding them as deps would re-run auth init on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verify token validity
  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      // Simple JWT expiration check (you might want to use a library like jwt-decode)
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(apiUrl("/auth/refresh-token"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } =
          await response.json();
        TokenManager.setTokens({
          accessToken,
          refreshToken: newRefreshToken,
        });
        return true;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return false;
    }
  };

  // Enhanced fetch with automatic token refresh
  const authFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    let accessToken = TokenManager.getAccessToken();

    // Add authorization header
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    let response = await fetch(url, { ...options, headers });

    // If token expired, try to refresh and retry
    if (response.status === 401 && accessToken) {
      const refreshed = await refreshToken();
      if (refreshed) {
        accessToken = TokenManager.getAccessToken();
        headers.Authorization = `Bearer ${accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    return response;
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authFetch(apiUrl("/auth/login"), {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const result: UserLoginResponse = await response.json();

      if (result.success && result.data) {
        if (!result.data.tokens?.accessToken || !result.data.tokens?.refreshToken) {
          throw new Error("Login response did not include session tokens");
        }
        TokenManager.setTokens(result.data.tokens);
        TokenManager.setUserData(result.data);
        setUser(result.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterFormData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authFetch(apiUrl("/auth/register"), {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      await response.json();
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    TokenManager.clearTokens();
    setUser(null);
    // Redirect to login page
    window.location.href = "/login";
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    authFetch,
    refreshToken,
    isAuthenticated: !!user && !!TokenManager.getAccessToken(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// export { authFetch };
