import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  app: vi.fn(),
  convexAuthProvider: vi.fn(),
  createRoot: vi.fn(),
  getElementById: vi.fn(),
  hasConvexAuth: false,
  phantomProvider: vi.fn(),
  render: vi.fn(),
}));

vi.mock("@phantom/browser-sdk", () => ({
  AddressType: {
    solana: "solana",
  },
}));

vi.mock("@phantom/react-sdk", () => ({
  PhantomProvider: mocks.phantomProvider,
  darkTheme: {
    name: "dark",
  },
}));

vi.mock("react-dom/client", () => ({
  createRoot: mocks.createRoot,
}));

vi.mock("./App", () => ({
  default: mocks.app,
}));

vi.mock("./ConvexAuthProvider", () => ({
  ConvexAuthProvider: mocks.convexAuthProvider,
  get hasConvexAuth() {
    return mocks.hasConvexAuth;
  },
}));

function renderedAppTree() {
  const strictModeElement = mocks.render.mock.calls[0][0] as ReactElement<{ children: ReactElement }>;
  const convexAuthElement = strictModeElement.props.children as ReactElement<{ children: ReactElement }>;
  const phantomElement = convexAuthElement.props.children as ReactElement<{ children: ReactElement }>;
  const appElement = phantomElement.props.children as ReactElement<Record<string, unknown>>;

  return {
    appElement,
    convexAuthElement,
    phantomElement,
  };
}

async function importMainWithDom() {
  const rootElement = {};

  mocks.getElementById.mockReturnValue(rootElement);
  mocks.createRoot.mockReturnValue({ render: mocks.render });
  vi.stubGlobal("document", { getElementById: mocks.getElementById });
  vi.stubGlobal("window", { location: { origin: "https://shadow.example" } });

  await import("./main");

  expect(mocks.getElementById).toHaveBeenCalledWith("root");
  expect(mocks.createRoot).toHaveBeenCalledWith(rootElement);
  expect(mocks.render).toHaveBeenCalledTimes(1);

  return renderedAppTree();
}

describe("main app bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    mocks.app.mockClear();
    mocks.convexAuthProvider.mockClear();
    mocks.createRoot.mockReset();
    mocks.getElementById.mockReset();
    mocks.hasConvexAuth = false;
    mocks.phantomProvider.mockClear();
    mocks.render.mockReset();
  });

  it("renders a single extension-only app tree when optional env vars are absent", async () => {
    const { appElement, convexAuthElement, phantomElement } = await importMainWithDom();

    expect(convexAuthElement.type).toBe(mocks.convexAuthProvider);
    expect(phantomElement.type).toBe(mocks.phantomProvider);
    expect(phantomElement.props).toMatchObject({
      appName: "Shadow Chamber Command",
      config: {
        addressTypes: ["solana"],
        providers: ["injected"],
      },
      theme: {
        name: "dark",
      },
    });
    expect(appElement.type).toBe(mocks.app);
    expect(appElement.props).toMatchObject({
      hasConvex: false,
      hasConvexAuth: false,
      hasPortalProviders: false,
      redirectUrl: "https://shadow.example/auth/phantom/callback",
    });
  });

  it("passes Convex, AuthKit, and Portal configuration through one app instance", async () => {
    mocks.hasConvexAuth = true;
    vi.stubEnv("VITE_CONVEX_URL", "https://deployment.convex.cloud");
    vi.stubEnv("VITE_PHANTOM_APP_ID", "phantom-app");
    vi.stubEnv("VITE_PHANTOM_REDIRECT_URL", "https://shadow.example/auth/callback");

    const { appElement, phantomElement } = await importMainWithDom();

    expect(phantomElement.props.config).toMatchObject({
      appId: "phantom-app",
      addressTypes: ["solana"],
      authOptions: {
        redirectUrl: "https://shadow.example/auth/callback",
      },
      providers: ["injected", "google", "apple"],
    });
    expect(appElement.props).toMatchObject({
      hasConvex: true,
      hasConvexAuth: true,
      hasPortalProviders: true,
      redirectUrl: "https://shadow.example/auth/callback",
    });
  });
});
