import { describe, expect, it } from "vitest";
import { advanceContrastState, evaluateRailsThorneGuard } from "./rbc999Telemetry";

describe("RBC-999 telemetry models", () => {
  it("advances contrast state from mesh telemetry without making frame state permanent", () => {
    const firstFrame = advanceContrastState({ streamFate: Math.PI * 2 - 0.005, vortexLuck: 0 }, { innocenceScale: 0.72, funVector: 0.8 }, 1_700_000_000_000);
    const secondFrame = advanceContrastState(firstFrame, { innocenceScale: 0.4, funVector: 0.2 }, 1_700_000_000_250);

    expect(firstFrame.streamFate).toBe(0);
    expect(firstFrame.vortexLuck).toBeGreaterThanOrEqual(-1);
    expect(firstFrame.vortexLuck).toBeLessThanOrEqual(1);
    expect(secondFrame.streamFate).toBeGreaterThan(0);
    expect(secondFrame.hueRotation).not.toBe(firstFrame.hueRotation);
  });

  it("keeps the Rails-Thorne guard idle below the acceleration limit", () => {
    const result = evaluateRailsThorneGuard({ stressVelocity: 0.42, companionLoad: 0.34, entityInstability: 0.2 });

    expect(result.status).toBe("nominal");
    expect(result.forceField).toBeNull();
    expect(result.sandbox).toBeNull();
  });

  it("injects reverse force and sandbox constraints when stress velocity is critical", () => {
    const result = evaluateRailsThorneGuard({ stressVelocity: 0.96, companionLoad: 0.75, entityInstability: 0.64 });

    expect(result.status).toBe("override-engaged");
    expect(result.forceField).toEqual({
      vector: "outbound_reverse",
      magnitude: 1.44,
      visualAnchor: "glowing_orange_hand_tethers",
    });
    expect(result.sandbox).toEqual({
      target: "steampunk_ringmaster_ai",
      allowHardwareHarvesting: false,
      mandatoryPreDeploymentTesting: true,
      testSubjectModel: "dummy_asset_v1",
    });
  });
});
