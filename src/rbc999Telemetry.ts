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

const CRITICAL_ACCELERATION_LIMIT = 0.88;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
