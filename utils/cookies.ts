"use server";

import { cookies } from "next/headers";
import { UserData } from "@/types/user";

// Individual async functions instead of a class
export const CookieManager = {
  setAuthCookies: async (user: UserData): Promise<void> => {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    // console.log("Cookie recieved::", user)

    const tokens = user.tokens;
    const { tokens: _omit, ...UserWithoutToken } = user;

    if (tokens) {
      cookieStore.set("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      });

      cookieStore.set("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 1 day
      });
    }

    // const { tokens, ...UserWithoutToken } = user;

    // Set user data (non-httpOnly for client-side access)
    cookieStore.set("userData", JSON.stringify(UserWithoutToken), {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 3, // 3 days
    });
  },

  getAccessToken: async (): Promise<string | null> => {
    const cookieStore = await cookies();
    return cookieStore.get("accessToken")?.value || null;
  },

  getRefreshToken: async (): Promise<string | null> => {
    const cookieStore = await cookies();
    return cookieStore.get("refreshToken")?.value || null;
  },

  getUser: async (): Promise<UserData | null> => {
    try {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get("userData")?.value;

      if (!userCookie) return null;

      return JSON.parse(userCookie) as UserData;
    } catch (error) {
      console.error("Error parsing user cookie:", error);
      return null;
    }
  },

  clearAuthCookies: async (): Promise<void> => {
    const cookieStore = await cookies();

    cookieStore.delete("userData");
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
  },

  getAllAuthData: async (): Promise<{
    user: UserData | null;
    accessToken: string | null;
    refreshToken: string | null;
  }> => {
    const [user, accessToken, refreshToken] = await Promise.all([
      CookieManager.getUser(),
      CookieManager.getAccessToken(),
      CookieManager.getRefreshToken(),
    ]);

    return { user, accessToken, refreshToken };
  }
};
