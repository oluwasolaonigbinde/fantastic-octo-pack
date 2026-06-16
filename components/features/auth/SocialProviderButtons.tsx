"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import authService, { AuthApiError } from "@/services/authService";
import type { PublicAuthEnvelope } from "@/types/auth";
import type { UserData } from "@/types/user";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            use_fedcm_for_button?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              width?: string | number;
            },
          ) => void;
        };
      };
    };
    AppleID?: {
      auth?: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization?: {
            id_token?: string;
          };
          user?: {
            email?: string;
            name?: {
              firstName?: string;
              lastName?: string;
            };
          };
        }>;
      };
    };
  }
}

type GoogleProfilePayload = {
  email?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
};

type SocialProviderButtonsProps = {
  mode: "signup" | "login";
  onResult: (
    result: PublicAuthEnvelope<
      UserData | { status?: string; nextStep?: string; pendingRegistration?: unknown }
    >,
  ) => Promise<void> | void;
  onError: (message: string) => void;
};

const GOOGLE_SIGNUP_MISSING_CONFIG_MESSAGE =
  "Google sign in is not configured for this environment yet.";
const APPLE_SIGNUP_MISSING_CONFIG_MESSAGE =
  "Apple sign in is not configured for this environment yet.";

function GoogleGLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden
      fill="currentColor"
    >
      <path d="M16.84 12.17c.02 2.37 2.08 3.16 2.1 3.17-.02.06-.33 1.14-1.08 2.26-.65.97-1.32 1.94-2.39 1.96-1.05.02-1.39-.62-2.59-.62-1.2 0-1.58.6-2.57.64-1 .04-1.77-1-2.43-1.96-1.35-1.95-2.38-5.5-1-7.89.68-1.19 1.89-1.94 3.21-1.96 1-.02 1.94.68 2.58.68.64 0 1.83-.84 3.09-.72.53.02 2.01.21 2.96 1.6-.08.05-1.77 1.03-1.75 3.08Zm-2.44-5.32c.54-.65.9-1.56.8-2.46-.78.03-1.72.52-2.28 1.17-.5.58-.94 1.5-.82 2.38.87.07 1.76-.44 2.3-1.09Z" />
    </svg>
  );
}

const decodeJwtPayload = <T,>(token: string): T | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = window.atob(normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), "="));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
};

export function SocialProviderButtons({
  mode,
  onResult,
  onError,
}: SocialProviderButtonsProps) {
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);
  const [appleReady, setAppleReady] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim();
  const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim();

  const googleLabel =
    mode === "signup" ? "Register with Google" : "Sign in with Google";
  const appleLabel =
    mode === "signup" ? "Register with Apple" : "Sign in with Apple";
  const socialButtonClassName =
    "type-label flex h-[42px] w-full items-center justify-center gap-2.5 rounded-md border border-gray5 bg-white px-4 font-normal text-gray2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-primary";

  const handleGoogleCredential = useCallback(
    async ({ credential }: { credential?: string }) => {
      onError("");

      if (!credential) {
        onError("Google sign in did not return a valid credential.");
        return;
      }

      const profile = decodeJwtPayload<GoogleProfilePayload>(credential);
      if (!profile?.email || !profile.email_verified) {
        onError("Google did not return a verified email address.");
        return;
      }

      try {
        const result = await authService.socialAuth({
          provider: "google",
          idToken: credential,
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
        });
        await onResult(result);
      } catch (error) {
        if (error instanceof AuthApiError) {
          onError(error.message);
          return;
        }

        onError("Unable to continue with Google right now.");
      }
    },
    [onError, onResult],
  );

  useEffect(() => {
    const markReady = () => {
      if (typeof window === "undefined") {
        return false;
      }

      if (window.google?.accounts?.id) {
        setGsiReady(true);
        return true;
      }

      return false;
    };

    if (markReady()) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (markReady()) {
        window.clearInterval(intervalId);
      }
    }, 50);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!gsiReady || !googleClientId || !googleButtonContainerRef.current) {
      return;
    }

    const gsi = window.google?.accounts?.id;
    if (!gsi?.initialize || !gsi.renderButton) {
      return;
    }

    const container = googleButtonContainerRef.current;
    container.replaceChildren();

    gsi.initialize({
      client_id: googleClientId,
      use_fedcm_for_button: false,
      callback: handleGoogleCredential,
    });

    gsi.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: mode === "signup" ? "signup_with" : "signin_with",
      width: 360,
    });

    setGoogleButtonRendered(true);

    return () => {
      setGoogleButtonRendered(false);
      container.replaceChildren();
    };
  }, [gsiReady, googleClientId, handleGoogleCredential, mode]);

  useEffect(() => {
    if (!appleReady || !appleClientId || !appleRedirectUri || !window.AppleID?.auth) {
      return;
    }

    window.AppleID.auth.init({
      clientId: appleClientId,
      scope: "name email",
      redirectURI: appleRedirectUri,
      usePopup: true,
    });
  }, [appleClientId, appleReady, appleRedirectUri]);

  const handleAppleSignIn = useCallback(async () => {
    onError("");

    if (!appleClientId || !appleRedirectUri || !window.AppleID?.auth?.signIn) {
      onError(APPLE_SIGNUP_MISSING_CONFIG_MESSAGE);
      return;
    }

    setIsAppleLoading(true);

    try {
      const appleResponse = await window.AppleID.auth.signIn();
      const idToken = appleResponse.authorization?.id_token;

      if (!idToken) {
        onError("Apple sign in did not return a valid identity token.");
        return;
      }

      const result = await authService.socialAuth({
        provider: "apple",
        idToken,
        firstName: appleResponse.user?.name?.firstName,
        lastName: appleResponse.user?.name?.lastName,
        email: appleResponse.user?.email,
      });
      await onResult(result);
    } catch (error) {
      if (error instanceof AuthApiError) {
        onError(error.message);
        return;
      }

      onError("Unable to continue with Apple right now.");
    } finally {
      setIsAppleLoading(false);
    }
  }, [appleClientId, appleRedirectUri, onError, onResult]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGsiReady(true)}
      />
      <Script
        src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        strategy="afterInteractive"
        onLoad={() => setAppleReady(true)}
      />

      <div className="space-y-3">
        {googleClientId ? (
          <div className="relative min-h-[42px] w-full">
            <div className={`pointer-events-none absolute inset-0 z-0 ${socialButtonClassName}`}>
              <GoogleGLogo className="shrink-0" />
              <span>{googleLabel}</span>
            </div>
            <div
              ref={googleButtonContainerRef}
              className={`absolute inset-0 z-10 flex h-[42px] w-full justify-center [&_*]:opacity-0 [&_iframe]:h-full [&_iframe]:min-h-[42px] [&_iframe]:w-full [&_iframe]:max-w-none ${
                googleButtonRendered ? "pointer-events-auto" : "pointer-events-none"
              }`}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onError(GOOGLE_SIGNUP_MISSING_CONFIG_MESSAGE)}
            className={socialButtonClassName}
          >
            <GoogleGLogo className="shrink-0" />
            <span>{googleLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={isAppleLoading}
          className={`${socialButtonClassName} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <AppleLogo className="shrink-0 text-black" />
          <span>{isAppleLoading ? "Connecting..." : appleLabel}</span>
        </button>
      </div>
    </>
  );
}
