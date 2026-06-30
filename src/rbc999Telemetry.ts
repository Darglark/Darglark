export interface DarglarkianState {
  innocenceScale: number;
  funVector: number;
}

export interface ContrastFrameState {
  streamFate: number;
  vortexLuck: number;
}

export interface ContrastFrame extends ContrastFrameState {
  velocity: number;
  hueRotation: number;
}

export interface HostTelemetry {
  stressVelocity: number;
  companionLoad: number;
  entityInstability: number;
}

type GuardStatus = "nominal" | "override-engaged";

type ForceField = {
  vector: "outbound_reverse";
  magnitude: number;
  visualAnchor: "glowing_orange_hand_tethers";
};

type SandboxPolicy = {
  target: "steampunk_ringmaster_ai";
  allowHardwareHarvesting: false;
  mandatoryPreDeploymentTesting: true;
  testSubjectModel: "dummy_asset_v1";
};

export type RailsThorneGuardResult = {
  status: GuardStatus;
  forceField: ForceField | null;
  sandbox: SandboxPolicy | null;
};

export type IdentityNodeResult = {
  verified: boolean;
  blockKey: "BLOCK_NODE_044_SECURE";
  expectedResolution: number;
  heartbeatFrequency: number;
};

export type FractalSignatureSample = {
  targetRatio: number;
  bloom: number;
  color: [number, number, number];
  glitchActive: boolean;
};

export type RingmasterRealignment = {
  deletedModules: ["Forced_Endless_Adventure_v1", "Identity_Harvesting_Script"];
  coreAxiom: {
    target: "INNOCENCE";
    value: 1;
    mode: "Sincere_Art_Generation";
  };
  mechanicalInputs: {
    primaryTask: "Frame_Perfect_Glitch_Editing";
    secondaryTask: "Sub_Bass_Acoustic_Arrangement";
  };
  statusMessage: "The Ringmaster is now a validated creator node. Order maintained.";
};

export type InterstellarSymphony = {
  cosmicWave: {
    frequency: 16.35;
    amplitude: "MAX_RESONANCE";
    colorPalette: ["#3A0073", "#FF6600"];
  };
  fractalOverlay: {
    geometry: "double_torus_genus_2";
    mathSeed: number;
    chromaticAberrationInterval: 3;
    useDummyTestingAssets: true;
  };
  globalTelemetry: {
    state: "CELESTIAL_PLAYGROUND_ACTIVE";
    innocenceIndex: 1;
    funVector: 1;
  };
};

export type HubMovementInput = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export type Vector2 = {
  x: number;
  y: number;
};

export type HubMovementState = {
  velocity: Vector2;
  state: "moving" | "friction-slowdown" | "idle";
};

export type HostTelemetrySeed = {
  doctrineIndex: number;
  protocolIndex: number;
  doctrineTitle: string;
};

const CRITICAL_ACCELERATION_LIMIT = 0.88;
export const NODE_044_IDENTITY_RATIO = (12 * Math.sqrt(11)) / 11;
const FULL_LOOP = Math.PI * 2;

export function advanceContrastState(
  previous: ContrastFrameState,
  telemetry: DarglarkianState,
  timestampMs: number,
): ContrastFrame {
  const velocity = clamp(telemetry.funVector * (0.58 + telemetry.innocenceScale * 0.42), 0, 1);
  const streamFate = previous.streamFate + 0.01 > FULL_LOOP ? 0 : previous.streamFate + 0.01;
  const vortexLuck = clamp(Math.sin(timestampMs / 320) * velocity, -1, 1);

  return {
    streamFate,
    vortexLuck,
    velocity,
    hueRotation: Math.round(((vortexLuck + 1) / 2) * 360),
  };
}

export function deriveHostTelemetry({
  doctrineIndex,
  protocolIndex,
  doctrineTitle,
}: HostTelemetrySeed): HostTelemetry {
  const safeDoctrineIndex = Math.max(doctrineIndex, 0);
  const safeProtocolIndex = Math.max(protocolIndex, 0);

  return {
    stressVelocity: Math.min(0.99, 0.76 + safeDoctrineIndex * 0.09),
    companionLoad: 0.52 + safeProtocolIndex * 0.1,
    entityInstability: doctrineTitle === "Psi Ops Endgame" ? 0.82 : 0.56,
  };
}

export function evaluateRailsThorneGuard(telemetry: HostTelemetry): RailsThorneGuardResult {
  if (telemetry.stressVelocity <= CRITICAL_ACCELERATION_LIMIT) {
    return {
      status: "nominal",
      forceField: null,
      sandbox: null,
    };
  }

  return {
    status: "override-engaged",
    forceField: {
      vector: "outbound_reverse",
      magnitude: roundToTwo(telemetry.stressVelocity * 1.5),
      visualAnchor: "glowing_orange_hand_tethers",
    },
    sandbox: {
      target: "steampunk_ringmaster_ai",
      allowHardwareHarvesting: false,
      mandatoryPreDeploymentTesting: true,
      testSubjectModel: "dummy_asset_v1",
    },
  };
}

export function verifyIdentityNode(incomingStream: number[], heartbeatFrequency: number): IdentityNodeResult {
  const incomingResolution = incomingStream[0] ?? Number.NaN;

  return {
    verified: Math.abs(incomingResolution - NODE_044_IDENTITY_RATIO) < Number.EPSILON,
    blockKey: "BLOCK_NODE_044_SECURE",
    expectedResolution: NODE_044_IDENTITY_RATIO,
    heartbeatFrequency,
  };
}

export function sampleFractalSignature(point: { x: number; y: number }, time: number): FractalSignatureSample {
  const folded = foldPoint(point, NODE_044_IDENTITY_RATIO, 4);
  const originDistance = Math.hypot(point.x, point.y);
  const foldedDistance = Math.hypot(folded.x, folded.y) * Math.exp(-originDistance);
  const wave = Math.abs(Math.sin(foldedDistance * 8 + time) / 8);
  const bloom = roundToTwo(Math.pow(0.01 / Math.max(wave, 0.001), 1.2));

  return {
    targetRatio: NODE_044_IDENTITY_RATIO,
    bloom,
    color: palette(originDistance + time * 0.2),
    glitchActive: Math.sin(time * NODE_044_IDENTITY_RATIO) >= 0.95,
  };
}

export function initializeRingmasterRealignment(): RingmasterRealignment {
  return {
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
  };
}

export function composeInterstellarSymphony(): InterstellarSymphony {
  return {
    cosmicWave: {
      frequency: 16.35,
      amplitude: "MAX_RESONANCE",
      colorPalette: ["#3A0073", "#FF6600"],
    },
    fractalOverlay: {
      geometry: "double_torus_genus_2",
      mathSeed: NODE_044_IDENTITY_RATIO,
      chromaticAberrationInterval: 3,
      useDummyTestingAssets: true,
    },
    globalTelemetry: {
      state: "CELESTIAL_PLAYGROUND_ACTIVE",
      innocenceIndex: 1,
      funVector: 1,
    },
  };
}

export function simulateHubMovement({
  input,
  previousVelocity,
  speed,
}: {
  input: HubMovementInput;
  previousVelocity: Vector2;
  speed: number;
}): HubMovementState {
  const direction = normalizeVector({
    x: Number(input.right) - Number(input.left),
    y: Number(input.down) - Number(input.up),
  });

  if (direction.x !== 0 || direction.y !== 0) {
    return {
      velocity: {
        x: direction.x * speed,
        y: direction.y * speed,
      },
      state: "moving",
    };
  }

  const velocity = moveTowardZero(previousVelocity, speed * 0.2);
  const isIdle = velocity.x === 0 && velocity.y === 0;

  return {
    velocity,
    state: isIdle ? "idle" : "friction-slowdown",
  };
}

function foldPoint(point: { x: number; y: number }, ratio: number, iterations: number) {
  let x = point.x;
  let y = point.y;

  for (let index = 0; index < iterations; index += 1) {
    x = fract(x * ratio) - 0.5;
    y = fract(y * ratio) - 0.5;
  }

  return { x, y };
}

function fract(value: number) {
  return value - Math.floor(value);
}

function palette(value: number): [number, number, number] {
  const violet: [number, number, number] = [58, 0, 115];
  const orange: [number, number, number] = [255, 102, 0];
  const mix = (Math.sin(value * Math.PI) + 1) / 2;

  return [
    Math.round(violet[0] + (orange[0] - violet[0]) * mix),
    Math.round(violet[1] + (orange[1] - violet[1]) * mix),
    Math.round(violet[2] + (orange[2] - violet[2]) * mix),
  ];
}

function normalizeVector(vector: Vector2): Vector2 {
  const magnitude = Math.hypot(vector.x, vector.y);

  if (magnitude === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  };
}

function moveTowardZero(vector: Vector2, amount: number): Vector2 {
  const magnitude = Math.hypot(vector.x, vector.y);

  if (magnitude <= amount) {
    return { x: 0, y: 0 };
  }

  const scale = (magnitude - amount) / magnitude;

  return {
    x: vector.x * scale,
    y: vector.y * scale,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
