import { decodeMessageFromPixels, embedMessageInPixels } from "./steganography";

const ARCHIVE_URL =
  "https://web.archive.org/web/20131127040404/https://darglarking-yellow.invalid/archive/case-044-yellow-room.html";

function getElement<T extends HTMLElement>(root: ParentNode, selector: string) {
  const element = root.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing Darglarking hub element: ${selector}`);
  }

  return element;
}

function readImageFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected PNG could not be read as an image."));
    };
    image.src = objectUrl;
  });
}

function setStatus(status: HTMLElement, message: string, variant: "idle" | "success" | "error" = "idle") {
  status.textContent = message;
  status.dataset.variant = variant;
}

export function encodeDarglarkingSecret(pixels: Uint8ClampedArray, secret: string) {
  const encodedPixels = embedMessageInPixels(pixels, secret);
  const decodedCheck = decodeMessageFromPixels(encodedPixels);

  return { encodedPixels, decodedCheck };
}

export function renderDarglarkingHub(root: HTMLElement) {
  root.innerHTML = `
    <main class="dy-shell">
      <section class="dy-hero" aria-labelledby="dy-title">
        <div class="dy-case-stamp">SCP-DY / INTAKE MEMO / LEVEL 0.44</div>
        <p class="dy-eyebrow">The Darglarking Yellow</p>
        <h1 id="dy-title">A meta-narrative hub for things erased badly.</h1>
        <p class="dy-brief">
          Clinical archive shell. Contradictory evidence. Yellow annotations that insist they were never written.
        </p>
      </section>

      <section class="dy-grid" aria-label="Darglarking dossier">
        <article class="dy-panel dy-dossier">
          <header class="dy-panel-header">
            <p>Item Class</p>
            <h2>Euclid-adjacent / Aesthetic hazard</h2>
          </header>
          <dl class="dy-facts">
            <div>
              <dt>Primary color event</dt>
              <dd>#FFD700 contamination across archived UI fragments</dd>
            </div>
            <div>
              <dt>Containment</dt>
              <dd>Do not modernize. Preserve the sterile index-card voice and terminal artifacts.</dd>
            </div>
            <div>
              <dt>Observed behavior</dt>
              <dd>Visitors discover the story by clicking, selecting, and inspecting what appears broken.</dd>
            </div>
          </dl>
          <p>
            The first known mention of the Darglarking Yellow appeared in a game asset manifest recovered from a
            forgotten build server. The manifest denies itself twice, then points to an impossible cabinet labeled
            <strong>ROOM 044</strong>.
          </p>
        </article>

        <article class="dy-panel dy-redactions">
          <header class="dy-panel-header">
            <p>Recovery Methods</p>
            <h2>Hidden layers</h2>
          </header>
          <ul class="dy-methods">
            <li>Click the single calibration pixel after Addendum 044-A.</li>
            <li>Select suspicious blank text to reveal suppressed notes.</li>
            <li>Follow the broken artifact into archived history.</li>
          </ul>
          <p class="dy-highlight-line">
            The note appears empty:
            <span class="dy-highlight-secret" aria-hidden="true">YELLOW KING INDEX: DY-044 / MIRROR THE ASSET BEFORE MIDNIGHT.</span>
            <span class="dy-sr-only">Suppressed text is present in the blank note and can be visually revealed by selecting it.</span>
          </p>
        </article>
      </section>

      <section class="dy-panel dy-addendum" aria-labelledby="addendum-title">
        <div class="dy-panel-header">
          <p>Addendum 044-A</p>
          <h2 id="addendum-title">Invisible collapsible transcript</h2>
        </div>
        <p>
          Interviewer: "What happens if a player refuses to notice the yellow?"
          <br />
          Subject: "Then the yellow notices on their behalf."
        </p>
        <button class="dy-pixel-trigger" type="button" aria-expanded="false" aria-controls="pixel-lore">
          <span class="dy-sr-only">Reveal hidden Addendum 044-B</span>
        </button>
        <div class="dy-hidden-lore" id="pixel-lore" hidden>
          <p>
            <strong>Addendum 044-B:</strong> The pixel is not a button in the narrative. It is a dead sensor reporting
            one bit of warmth from the other side of the page.
          </p>
          <p>Recovered phrase: <code>DARG-LARK-ING / DO NOT TRUST CLEAN YELLOW</code></p>
        </div>
      </section>

      <section class="dy-panel dy-archive" aria-labelledby="archive-title">
        <div class="dy-panel-header">
          <p>Wayback Loop</p>
          <h2 id="archive-title">Broken artifact that should not resolve</h2>
        </div>
        <a class="dy-broken-link" href="${ARCHIVE_URL}" target="_blank" rel="noreferrer">
          <span class="dy-broken-icon" aria-hidden="true">X</span>
          <span>
            <strong>missing_yellow_room.gif</strong>
            <small>404 in production / archived copy available through temporal residue</small>
          </span>
        </a>
      </section>

      <section class="dy-panel dy-stego" aria-labelledby="stego-title">
        <div class="dy-panel-header">
          <p>Client-side steganography tool</p>
          <h2 id="stego-title">Embed a short code into a PNG asset</h2>
        </div>
        <div class="dy-stego-layout">
          <form class="dy-stego-controls">
            <label>
              PNG asset
              <input class="dy-file-input" type="file" accept="image/png" />
            </label>
            <label>
              Secret code
              <input class="dy-secret-input" type="text" maxlength="80" value="DY-044: the yellow remembers" />
            </label>
            <button class="dy-encode-button" type="button">Embed into LSBs</button>
            <a class="dy-download-link" hidden download="darglarking-yellow-encoded.png">Download encoded PNG</a>
            <p class="dy-stego-status" data-variant="idle" role="status" aria-live="polite">Upload a PNG. Encoding runs locally in your browser.</p>
          </form>
          <div class="dy-canvas-frame">
            <canvas class="dy-stego-canvas" width="480" height="260" aria-label="PNG preview canvas"></canvas>
          </div>
        </div>
      </section>
    </main>
  `;

  const pixelTrigger = getElement<HTMLButtonElement>(root, ".dy-pixel-trigger");
  const hiddenLore = getElement<HTMLDivElement>(root, "#pixel-lore");
  const stegoForm = getElement<HTMLFormElement>(root, ".dy-stego-controls");
  const fileInput = getElement<HTMLInputElement>(root, ".dy-file-input");
  const secretInput = getElement<HTMLInputElement>(root, ".dy-secret-input");
  const encodeButton = getElement<HTMLButtonElement>(root, ".dy-encode-button");
  const downloadLink = getElement<HTMLAnchorElement>(root, ".dy-download-link");
  const status = getElement<HTMLParagraphElement>(root, ".dy-stego-status");
  const canvas = getElement<HTMLCanvasElement>(root, ".dy-stego-canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    setStatus(status, "Canvas is unavailable in this browser.", "error");
    return;
  }

  let hasLoadedPng = false;

  pixelTrigger.addEventListener("click", () => {
    const isHidden = hiddenLore.hidden;
    hiddenLore.hidden = !isHidden;
    pixelTrigger.setAttribute("aria-expanded", String(isHidden));
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    hasLoadedPng = false;
    downloadLink.hidden = true;

    if (!file) {
      setStatus(status, "Upload a PNG. Encoding runs locally in your browser.");
      return;
    }

    if (file.type !== "image/png") {
      setStatus(status, "Select a PNG asset so the encoded output remains lossless.", "error");
      return;
    }

    try {
      const image = await readImageFile(file);
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      hasLoadedPng = true;
      setStatus(status, `Loaded ${file.name}. Ready to alter the least significant RGB bits.`, "success");
    } catch (error) {
      setStatus(status, error instanceof Error ? error.message : "The selected PNG could not be loaded.", "error");
    }
  });

  const encodeCurrentCanvas = () => {
    if (!hasLoadedPng) {
      setStatus(status, "Upload a PNG before embedding a code.", "error");
      return;
    }

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { encodedPixels, decodedCheck } = encodeDarglarkingSecret(imageData.data, secretInput.value);
      const encodedImage = new ImageData(encodedPixels, imageData.width, imageData.height);
      context.putImageData(encodedImage, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          setStatus(status, "The browser could not export the encoded PNG.", "error");
          return;
        }

        if (downloadLink.href) {
          URL.revokeObjectURL(downloadLink.href);
        }

        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.hidden = false;
        setStatus(status, `Embedded and verified secret: "${decodedCheck}"`, "success");
      }, "image/png");
    } catch (error) {
      setStatus(status, error instanceof Error ? error.message : "Encoding failed.", "error");
    }
  };

  stegoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    encodeCurrentCanvas();
  });

  encodeButton.addEventListener("click", () => {
    encodeCurrentCanvas();
  });
}
