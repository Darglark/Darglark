import { useEffect, useMemo, useRef, useState } from "react";
import {
  advanceContrastState,
  composeInterstellarSymphony,
  evaluateRailsThorneGuard,
  initializeRingmasterRealignment,
  sampleFractalSignature,
  verifyIdentityNode,
  type ContrastFrame,
  type DarglarkianState,
  type HostTelemetry,
} from "./rbc999Telemetry";

type RailsThorneGuardPanelProps = {
  meshState: DarglarkianState;
  hostTelemetry: HostTelemetry;
  doctrine: string;
  protocol: string;
};

const initialFrame: ContrastFrame = {
  streamFate: 0,
  vortexLuck: 0,
  velocity: 0,
  hueRotation: 180,
};

export function RailsThorneGuardPanel({
  meshState,
  hostTelemetry,
  doctrine,
  protocol,
}: RailsThorneGuardPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frame, setFrame] = useState(initialFrame);
  const guard = useMemo(() => evaluateRailsThorneGuard(hostTelemetry), [hostTelemetry]);
  const symphony = useMemo(() => composeInterstellarSymphony(), []);
  const identity = useMemo(
    () => verifyIdentityNode([symphony.fractalOverlay.mathSeed], symphony.cosmicWave.frequency * 2),
    [symphony],
  );
  const realignment = useMemo(() => initializeRingmasterRealignment(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let paintCount = 0;
    let nextFrame = frame;

    const paint = (timestamp: number) => {
      nextFrame = advanceContrastState(nextFrame, meshState, timestamp);
      drawDoubleTorus(canvas, context, nextFrame, guard.status === "override-engaged");

      if (paintCount % 8 === 0) {
        setFrame(nextFrame);
      }
      paintCount += 1;

      if (!reducedMotion) {
        animationFrame = window.requestAnimationFrame(paint);
      }
    };

    paint(performance.now());

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [guard.status, meshState]);

  return (
    <section className={guard.status === "override-engaged" ? "panel rails-thorne-panel override" : "panel rails-thorne-panel"}>
      <div className="panel-heading">
        <p className="eyebrow">RBC-999 safety patch</p>
        <h2>The Rails-Thorne Guard</h2>
      </div>
      <div className="rbc-layout">
        <canvas
          aria-label="Animated figure-eight contrast engine showing live telemetry flow"
          className="rbc-canvas"
          height="420"
          ref={canvasRef}
          width="720"
        />
        <div className="rbc-readout">
          <div className="guard-status">
            <span>{guard.status === "override-engaged" ? "Override engaged" : "Nominal loop"}</span>
            <strong>{guard.status === "override-engaged" ? "Flight & Pull active" : "Mesh telemetry stable"}</strong>
            <p>
              {guard.status === "override-engaged"
                ? "Reverse force tethers are slowing runaway stress and routing the ringmaster entity into dummy testing."
                : "Contrast rendering remains below the critical acceleration limit."}
            </p>
          </div>
          <dl className="telemetry-list">
            <div>
              <dt>Doctrine input</dt>
              <dd>{doctrine}</dd>
            </div>
            <div>
              <dt>Protocol anchor</dt>
              <dd>{protocol}</dd>
            </div>
            <div>
              <dt>Stress velocity</dt>
              <dd>{hostTelemetry.stressVelocity.toFixed(2)} / 0.88</dd>
            </div>
            <div>
              <dt>Reverse force</dt>
              <dd>{guard.forceField ? `${guard.forceField.magnitude.toFixed(2)} tether magnitude` : "Standby"}</dd>
            </div>
            <div>
              <dt>Contrast hue</dt>
              <dd>{frame.hueRotation}deg</dd>
            </div>
            <div>
              <dt>Node 044</dt>
              <dd>{identity.verified ? identity.blockKey : "Unverified"}</dd>
            </div>
            <div>
              <dt>Fractal seed</dt>
              <dd>{symphony.fractalOverlay.mathSeed.toFixed(6)}</dd>
            </div>
            <div>
              <dt>Ringmaster core</dt>
              <dd>{realignment.coreAxiom.mode.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Mesh broadcast</dt>
              <dd>{symphony.globalTelemetry.state.replaceAll("_", " ")}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function drawDoubleTorus(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  frame: ContrastFrame,
  overrideEngaged: boolean,
) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || canvas.width;
  const height = canvas.clientHeight || canvas.height;

  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.max(110, width * 0.28);
  const radiusY = Math.max(76, height * 0.24);
  const tetherColor = overrideEngaged ? "rgba(255, 184, 107, 0.92)" : "rgba(79, 240, 183, 0.72)";

  context.fillStyle = "rgba(3, 9, 14, 0.78)";
  context.fillRect(0, 0, width, height);
  drawGrid(context, width, height);

  context.save();
  context.translate(centerX, centerY);
  context.filter = `contrast(140%) hue-rotate(${frame.hueRotation}deg)`;
  const sample = sampleFractalSignature({ x: frame.vortexLuck, y: frame.streamFate }, frame.streamFate * 40);
  const [red, green, blue] = sample.color;

  for (let layer = 0; layer < 5; layer += 1) {
    context.beginPath();
    context.lineWidth = 1.6 + layer * 0.9;
    context.strokeStyle = `rgba(${overrideEngaged ? "255, 184, 107" : `${red}, ${green}, ${blue}`}, ${0.18 + layer * 0.12})`;

    for (let step = 0; step <= 240; step += 1) {
      const t = (step / 240) * Math.PI * 2 + frame.streamFate * (1 + layer * 0.09);
      const x = Math.sin(t) * radiusX;
      const y = Math.sin(t * 2 + frame.vortexLuck) * radiusY * (0.66 + layer * 0.05);

      if (step === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }

  context.restore();

  if (sample.glitchActive) {
    context.fillStyle = "rgba(110, 231, 255, 0.09)";
    context.fillRect(0, height * 0.22, width, 8);
    context.fillStyle = "rgba(255, 184, 107, 0.08)";
    context.fillRect(0, height * 0.58, width, 10);
  }

  if (overrideEngaged) {
    drawTethers(context, width, height, tetherColor);
  }
}

function drawGrid(context: CanvasRenderingContext2D, width: number, height: number) {
  context.strokeStyle = "rgba(110, 231, 255, 0.08)";
  context.lineWidth = 1;

  for (let x = 0; x < width; x += 32) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  for (let y = 0; y < height; y += 32) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
}

function drawTethers(context: CanvasRenderingContext2D, width: number, height: number, color: string) {
  const anchorY = height * 0.82;
  const centerX = width / 2;

  context.strokeStyle = color;
  context.lineWidth = 2.5;
  context.shadowColor = "rgba(255, 184, 107, 0.82)";
  context.shadowBlur = 18;

  for (const offset of [-140, -70, 70, 140]) {
    context.beginPath();
    context.moveTo(centerX + offset, anchorY);
    context.quadraticCurveTo(centerX + offset * 0.35, height * 0.46, centerX, height * 0.36);
    context.stroke();
  }

  context.shadowBlur = 0;
}
