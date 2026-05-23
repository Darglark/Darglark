import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AddressType } from "@phantom/browser-sdk";
import { PhantomProvider, darkTheme } from "@phantom/react-sdk";
import type { PhantomSDKConfig } from "@phantom/react-sdk";
import App from "./App";
import { ConvexAuthProvider, hasConvexAuth } from "./ConvexAuthProvider";
import "./styles.css";

const phantomAppId = import.meta.env.VITE_PHANTOM_APP_ID?.trim();
const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
const redirectUrl =
  import.meta.env.VITE_PHANTOM_REDIRECT_URL?.trim() ||
  new URL("/auth/phantom/callback", window.location.origin).toString();

const phantomConfig: PhantomSDKConfig = phantomAppId
  ? {
      providers: ["injected", "google", "apple"],
      appId: phantomAppId,
      addressTypes: [AddressType.solana],
      authOptions: {
        redirectUrl,
      },
    }
  : {
      providers: ["injected"],
      addressTypes: [AddressType.solana],
    };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider>
      <PhantomProvider config={phantomConfig} theme={darkTheme} appName="Shadow Chamber Command">
        <App
          hasConvex={Boolean(convexUrl)}
          hasPortalProviders={Boolean(phantomAppId)}
          hasConvexAuth={hasConvexAuth}
          redirectUrl={redirectUrl}
        />
      </PhantomProvider>
    </ConvexAuthProvider>
  </StrictMode>,
);
