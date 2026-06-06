import { beforeEach, describe, expect, it, vi } from "vitest";

const render = vi.fn();
const createRoot = vi.fn(() => ({ render }));

vi.mock("react-dom/client", () => ({
  createRoot,
}));

vi.mock("@phantom/browser-sdk", () => ({
  AddressType: {
    solana: "solana",
  },
}));

vi.mock("@phantom/react-sdk", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    PhantomProvider: ({ children }: { children: React.ReactNode }) => <div data-provider="phantom">{children}</div>,
    darkTheme: {},
  };
});

vi.mock("./App", () => ({
  default: () => <div data-app="shadow-chamber-command" />,
}));

vi.mock("./ConvexAuthProvider", () => ({
  ConvexAuthProvider: ({ children }: { children: React.ReactNode }) => <div data-provider="convex">{children}</div>,
  hasConvexAuth: false,
}));

describe("application entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("mounts the React commander app instead of replacing the root with standalone DOM content", async () => {
    const rootElement = { id: "root" } as HTMLElement;
    vi.stubGlobal("document", {
      getElementById: vi.fn(() => rootElement),
    });

    await import("./main");

    expect(createRoot).toHaveBeenCalledWith(rootElement);
    expect(render).toHaveBeenCalledTimes(1);
  });
});
