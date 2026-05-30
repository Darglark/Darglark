import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AddressType } from "@phantom/browser-sdk";
import { PhantomProvider, darkTheme } from "@phantom/react-sdk";
import type { PhantomSDKConfig } from "@phantom/react-sdk";
import App from "./App";
import { ConvexAuthProvider, hasConvexAuth } from "./ConvexAuthProvider";
import { renderDarglarkingHub } from "./darglarkingHub";
import { getInitialExperience } from "./mainRouting";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element for Shadow Chamber Command.");
}

if (getInitialExperience(window.location.hash) === "darglarking") {
  renderDarglarkingHub(rootElement);
} else {
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

  const app = (
    <PhantomProvider config={phantomConfig} theme={darkTheme} appName="Shadow Chamber Command">
      <App
        hasConvex={Boolean(convexUrl)}
        hasConvexAuth={hasConvexAuth}
        hasPortalProviders={Boolean(phantomAppId)}
        redirectUrl={redirectUrl}
      />
    </PhantomProvider>
  );

  createRoot(rootElement).render(
    <StrictMode>
      <ConvexAuthProvider>{app}</ConvexAuthProvider>
    </StrictMode>,
  );
}
