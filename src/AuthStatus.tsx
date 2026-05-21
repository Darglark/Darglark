import { useEffect, useState } from "react";
import { Authenticated, AuthLoading, Unauthenticated, useMutation } from "convex/react";
import { useAuth } from "@workos-inc/authkit-react";
import { api } from "../convex/_generated/api";

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unable to sync the authenticated commander profile.";
}

export function AuthStatus() {
  const { isLoading, user, signIn, signOut } = useAuth();
  const storeUser = useMutation(api.users.storeUser);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSyncError(null);
      return;
    }

    let isCurrent = true;

    void storeUser()
      .then(() => {
        if (isCurrent) {
          setSyncError(null);
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setSyncError(getAuthErrorMessage(error));
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [storeUser, user]);

  return (
    <article className="panel auth-panel">
      <div className="panel-heading">
        <p className="eyebrow">Convex command roster</p>
        <h2>{user ? "Authenticated commander" : "Optional roster sign-in"}</h2>
      </div>
      <AuthLoading>
        <p className="muted">Checking command roster session...</p>
      </AuthLoading>
      <Authenticated>
        <p className="muted">
          {user?.email ? `${user.email} is linked to the Convex users table.` : "Commander profile is linked."}
        </p>
        <button
          className="ghost-button"
          type="button"
          onClick={() => signOut({ returnTo: window.location.origin })}
          disabled={isLoading}
        >
          Sign out of roster
        </button>
      </Authenticated>
      <Unauthenticated>
        <p className="muted">Sign in to sync a persistent Convex profile for future protected recommendations.</p>
        <div className="profile-actions">
          <button className="secondary-button" type="button" onClick={() => void signIn()} disabled={isLoading}>
            Sign in with WorkOS
          </button>
        </div>
      </Unauthenticated>
      {syncError ? <p className="error-banner">{syncError}</p> : null}
    </article>
  );
}
