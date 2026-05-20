import type { ReactNode } from "react";
import { AuthKitProvider, useAuth } from "@workos-inc/authkit-react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";

const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
const workosClientId = import.meta.env.VITE_WORKOS_CLIENT_ID?.trim();
const workosRedirectUri =
  import.meta.env.VITE_WORKOS_REDIRECT_URI?.trim() || new URL("/callback", window.location.origin).toString();

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

type ConvexAuthProviderProps = {
  children: ReactNode;
};

export const hasConvexAuth = Boolean(convex && workosClientId);

export function ConvexAuthProvider({ children }: ConvexAuthProviderProps) {
  if (!convex) {
    return children;
  }

  if (!workosClientId) {
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
  }

  return (
    <AuthKitProvider clientId={workosClientId} redirectUri={workosRedirectUri}>
      <ConvexProviderWithAuthKit client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
  );
}
