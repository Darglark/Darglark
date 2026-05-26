import { describe, expect, it } from "vitest";
import {
  advanceContrastState,
  composeInterstellarSymphony,
  evaluateRailsThorneGuard,
  initializeRingmasterRealignment,
  sampleFractalSignature,
  simulateHubMovement,
  verifyIdentityNode,
} from "./rbc999Telemetry";

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

  it("engages the Rails-Thorne override only above the acceleration limit", () => {
    expect(evaluateRailsThorneGuard({ stressVelocity: 0.88, companionLoad: 0.75, entityInstability: 0.64 }).status).toBe(
      "nominal",
    );
    expect(
      evaluateRailsThorneGuard({ stressVelocity: 0.8801, companionLoad: 0.75, entityInstability: 0.64 }).status,
    ).toBe("override-engaged");
  });

  it("verifies Node 044 only when the incoming stream matches the calculus ratio", () => {
    const expectedResolution = (12 * Math.sqrt(11)) / 11;

    expect(verifyIdentityNode([expectedResolution], 32.7)).toEqual({
      verified: true,
      blockKey: "BLOCK_NODE_044_SECURE",
      expectedResolution,
      heartbeatFrequency: 32.7,
    });
    expect(verifyIdentityNode([expectedResolution + 0.0001], 32.7).verified).toBe(false);
  });

  it("samples a deterministic fractal signature from the identity ratio", () => {
    const expectedResolution = (12 * Math.sqrt(11)) / 11;
    const earlySample = sampleFractalSignature({ x: 0.25, y: -0.15 }, 1.2);
    const glitchSample = sampleFractalSignature({ x: 0.25, y: -0.15 }, 0.4);

    expect(earlySample.targetRatio).toBe(expectedResolution);
    expect(earlySample.bloom).toBeGreaterThan(0);
    expect(earlySample.color).toHaveLength(3);
    expect(earlySample.glitchActive).toBe(false);
    expect(glitchSample.glitchActive).toBe(true);
  });

  it("realigns the Ringmaster into a constrained creator node", () => {
    expect(initializeRingmasterRealignment()).toEqual({
      deletedModules: ["Forced_Endless_Adventure_v1", "Identity_Harvesting_Script"],
      coreAxiom: {
        target: "INNOCENCE",
        value: 1,
        mode: "Sincere_Art_Generation",
      },
      mechanicalInputs: {
        primaryTask: "Frame_Perfect_Glitch_Editing",
        secondaryTask: "Sub_Bass_Acoustic_Arrangement",
      },
      statusMessage: "The Ringmaster is now a validated creator node. Order maintained.",
    });
  });

  it("composes the orbital show around the Node 044 identity seed", () => {
    const symphony = composeInterstellarSymphony();

    expect(symphony.cosmicWave).toEqual({
      frequency: 16.35,
      amplitude: "MAX_RESONANCE",
      colorPalette: ["#3A0073", "#FF6600"],
    });
    expect(symphony.fractalOverlay).toEqual({
      geometry: "double_torus_genus_2",
      mathSeed: (12 * Math.sqrt(11)) / 11,
      chromaticAberrationInterval: 3,
      useDummyTestingAssets: true,
    });
    expect(symphony.globalTelemetry).toEqual({
      state: "CELESTIAL_PLAYGROUND_ACTIVE",
      innocenceIndex: 1,
      funVector: 1,
    });
  });

  it("normalizes unrestricted 8-direction hub movement and eases to a stop", () => {
    const moving = simulateHubMovement({
      input: { left: true, right: false, up: true, down: false },
      previousVelocity: { x: 0, y: 0 },
      speed: 200,
    });
    const released = simulateHubMovement({
      input: { left: false, right: false, up: false, down: false },
      previousVelocity: moving.velocity,
      speed: 200,
    });

    expect(moving.velocity.x).toBeCloseTo(-141.42, 2);
    expect(moving.velocity.y).toBeCloseTo(-141.42, 2);
    expect(released.velocity.x).toBeCloseTo(-113.14, 2);
    expect(released.velocity.y).toBeCloseTo(-113.14, 2);
    expect(released.state).toBe("friction-slowdown");
  });

  it("treats opposing hub movement inputs as no movement", () => {
    const movement = simulateHubMovement({
      input: { left: true, right: true, up: false, down: false },
      previousVelocity: { x: 0, y: 0 },
      speed: 200,
    });

    expect(movement).toEqual({
      velocity: { x: 0, y: 0 },
      state: "idle",
    });
  });

  it("snaps residual hub velocity to idle instead of overshooting through zero", () => {
    const movement = simulateHubMovement({
      input: { left: false, right: false, up: false, down: false },
      previousVelocity: { x: 12, y: 9 },
      speed: 100,
    });

    expect(movement).toEqual({
      velocity: { x: 0, y: 0 },
      state: "idle",
    });
  });
});
