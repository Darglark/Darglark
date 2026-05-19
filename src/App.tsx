import { useMemo, useState } from "react";
import {
  useAccounts,
  useConnect,
  useDisconnect,
  useIsExtensionInstalled,
  useModal,
  usePhantom,
  useSolana,
} from "@phantom/react-sdk";

type AppProps = {
  hasPortalProviders: boolean;
  redirectUrl: string;
};

type SignedIdentity = {
  address: string;
  publicKey: string;
  signature: string;
  signedAt: string;
  message: string;
};

const doctrines = [
  {
    title: "Concealed Alpha Strike",
    focus: "Open every pod from concealment with overwatch traps, Reaper scouting, and frost control.",
    tag: "Early campaign",
  },
  {
    title: "Resistance Ring Tempo",
    focus: "Prioritize covert actions that delay Avatar progress, hunt Chosen intel, and stack promotion rewards.",
    tag: "Strategic layer",
  },
  {
    title: "Psi Ops Endgame",
    focus: "Ramp the Psi Lab once power stabilizes, then rotate Stasis and Domination into Chosen strongholds.",
    tag: "Late campaign",
  },
];

const squadCards = [
  {
    name: "Chosen Hunter Counter-Squad",
    lineup: "Reaper, Specialist, Sharpshooter, Grenadier, Ranger, Skirmisher",
    advice: "Use Reaper tracking to reveal flanks, keep aid protocol ready for dazed soldiers, and punish grapple retreats.",
  },
  {
    name: "Lost-City Sweep Team",
    lineup: "Templar, Ranger, Specialist, Sharpshooter, Grenadier",
    advice: "Chain free pistol shots and Bladestorm while saving explosives for Advent, not Lost packs.",
  },
  {
    name: "Facility Sabotage Cell",
    lineup: "Reaper, Grenadier, Specialist, Ranger, Psi Operative",
    advice: "Scout the objective first, plant charges under concealment pressure, and reserve Stasis for rulers or gatekeepers.",
  },
];

const chosenGuidance = [
  "Hunter: break line of sight, avoid rooftop isolation, and bait tracking shot with high-mobility soldiers.",
  "Warlock: carry mindshields once he appears, clear spectral zombies before they pin your backline.",
  "Assassin: fan out just enough to reveal her path, then use Battle Scanners, Bladestorm, and frost bombs.",
];

function formatAddress(address?: string) {
  if (!address) return "No Solana account connected";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Phantom returned an unexpected response. Try again from the wallet prompt.";
}

export default function App({ hasPortalProviders, redirectUrl }: AppProps) {
  const { connect, isConnecting } = useConnect();
  const { disconnect, isDisconnecting } = useDisconnect();
  const { isConnected } = usePhantom();
  const accounts = useAccounts();
  const { solana, isAvailable: isSolanaAvailable } = useSolana();
  const { isInstalled, isLoading: isExtensionLoading } = useIsExtensionInstalled();
  const { open } = useModal();
  const [selectedDoctrine, setSelectedDoctrine] = useState(doctrines[0].title);
  const [signedIdentity, setSignedIdentity] = useState<SignedIdentity | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const activeAccount = accounts?.[0];
  const activeAddress = activeAccount?.address;
  const selectedDoctrineDetail = useMemo(
    () => doctrines.find((doctrine) => doctrine.title === selectedDoctrine) ?? doctrines[0],
    [selectedDoctrine],
  );

  const handleConnectExtension = async () => {
    setWalletError(null);

    try {
      await connect({ provider: "injected" });
    } catch (error) {
      setWalletError(`Phantom connection failed: ${getErrorMessage(error)}`);
    }
  };

  const handleDisconnect = async () => {
    setWalletError(null);

    try {
      await disconnect();
      setSignedIdentity(null);
    } catch (error) {
      setWalletError(`Disconnect failed: ${getErrorMessage(error)}`);
    }
  };

  const handleSignIdentity = async () => {
    setWalletError(null);

    if (!isConnected || !activeAddress) {
      setWalletError("Connect a Solana account before signing your commander profile.");
      return;
    }

    if (!isSolanaAvailable) {
      setWalletError("Solana signing is not available for the current Phantom session.");
      return;
    }

    const signedAt = new Date().toISOString();
    const message = [
      "Shadow Chamber Command commander identity",
      `Address: ${activeAddress}`,
      `Doctrine: ${selectedDoctrineDetail.title}`,
      `Signed at: ${signedAt}`,
      "Purpose: Establish a read-only XCOM 2 WOTC strategy profile. No transactions or spending approvals.",
    ].join("\n");

    setIsSigning(true);

    try {
      const encodedMessage = new TextEncoder().encode(message);
      const { signature, publicKey } = await solana.signMessage(encodedMessage);

      setSignedIdentity({
        address: activeAddress,
        publicKey: String(publicKey),
        signature: bytesToBase64(signature),
        signedAt,
        message,
      });
    } catch (error) {
      setWalletError(`Signature request was not completed: ${getErrorMessage(error)}`);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">XCOM 2: War of the Chosen</p>
          <h1>Shadow Chamber Command</h1>
          <p>
            Build a commander profile, pick a tactical doctrine, and review squad recommendations before the
            Chosen adapt to your campaign.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={handleConnectExtension} disabled={isConnecting}>
              {isConnecting ? "Contacting Phantom..." : "Connect Phantom Extension"}
            </button>
            {hasPortalProviders ? (
              <button className="secondary-button" type="button" onClick={open}>
                Portal / Social Sign-In
              </button>
            ) : (
              <span className="env-pill">Extension mode: no Portal appId required</span>
            )}
          </div>
        </div>
        <div className="scanner-card" aria-label="Campaign readiness">
          <span className="scanner-line" />
          <p>Threat Readout</p>
          <strong>Chosen activity rising</strong>
          <span>Recommended response: secure identity, set doctrine, counter traits.</span>
        </div>
      </section>

      <section className="status-grid">
        <article className="panel commander-panel">
          <div className="panel-heading">
            <p className="eyebrow">Commander profile</p>
            <h2>{isConnected ? "Identity uplink ready" : "Unsigned field commander"}</h2>
          </div>
          <dl className="profile-list">
            <div>
              <dt>Solana account</dt>
              <dd>{formatAddress(activeAddress)}</dd>
            </div>
            <div>
              <dt>Wallet path</dt>
              <dd>
                {hasPortalProviders
                  ? "Extension first, Portal/social available"
                  : isExtensionLoading
                    ? "Checking extension"
                    : isInstalled
                      ? "Injected Phantom extension"
                      : "Demo mode until Phantom is installed"}
              </dd>
            </div>
            <div>
              <dt>Redirect URL</dt>
              <dd>{hasPortalProviders ? redirectUrl : "Not used in extension-only mode"}</dd>
            </div>
          </dl>
          <div className="profile-actions">
            <button className="primary-button" type="button" onClick={handleSignIdentity} disabled={isSigning}>
              {isSigning ? "Awaiting signature..." : "Sign Commander Identity"}
            </button>
            {isConnected ? (
              <button className="ghost-button" type="button" onClick={handleDisconnect} disabled={isDisconnecting}>
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            ) : null}
          </div>
          {walletError ? <p className="error-banner">{walletError}</p> : null}
        </article>

        <article className="panel identity-panel">
          <div className="panel-heading">
            <p className="eyebrow">Signed identity status</p>
            <h2>{signedIdentity ? "Profile verified" : "Awaiting signature"}</h2>
          </div>
          {signedIdentity ? (
            <div className="signature-box">
              <p>Signed at {new Date(signedIdentity.signedAt).toLocaleString()}</p>
              <code>{signedIdentity.signature}</code>
              <span>Public key: {formatAddress(signedIdentity.publicKey)}</span>
            </div>
          ) : (
            <p className="muted">
              Signing proves control of the connected Solana address and creates a commander profile. It does
              not create a transaction, request spending approval, or touch mainnet funds.
            </p>
          )}
        </article>
      </section>

      <section className="panel doctrine-panel">
        <div className="panel-heading">
          <p className="eyebrow">Tactical doctrine</p>
          <h2>Choose your operational posture</h2>
        </div>
        <div className="doctrine-options">
          {doctrines.map((doctrine) => (
            <button
              className={doctrine.title === selectedDoctrine ? "doctrine-card active" : "doctrine-card"}
              key={doctrine.title}
              type="button"
              onClick={() => setSelectedDoctrine(doctrine.title)}
            >
              <span>{doctrine.tag}</span>
              <strong>{doctrine.title}</strong>
              <p>{doctrine.focus}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="recommendation-grid">
        {squadCards.map((card) => (
          <article className="panel squad-card" key={card.name}>
            <p className="eyebrow">Squad recommendation</p>
            <h3>{card.name}</h3>
            <p className="lineup">{card.lineup}</p>
            <p>{card.advice}</p>
          </article>
        ))}
      </section>

      <section className="panel chosen-panel">
        <div className="panel-heading">
          <p className="eyebrow">Chosen-counter guidance</p>
          <h2>Counter adaptation before the next retaliation strike</h2>
        </div>
        <div className="chosen-list">
          {chosenGuidance.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>
    </main>
  );
}
