import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";

type ConvexBriefingsProps = {
  doctrine: string;
  protocol: string;
};

type CommandBriefing = {
  _id: string;
  title: string;
  doctrine: string;
  protocol: string;
  completed: boolean;
};

const briefingApi = {
  list: anyApi.briefings.list as FunctionReference<"query", "public", Record<string, never>, CommandBriefing[]>,
  create: anyApi.briefings.create as FunctionReference<
    "mutation",
    "public",
    { title: string; doctrine: string; protocol: string },
    string
  >,
  setCompleted: anyApi.briefings.setCompleted as FunctionReference<
    "mutation",
    "public",
    { briefingId: string; completed: boolean },
    null
  >,
  remove: anyApi.briefings.remove as FunctionReference<"mutation", "public", { briefingId: string }, null>,
};

export function ConvexBriefings({ doctrine, protocol }: ConvexBriefingsProps) {
  const briefings = useQuery(briefingApi.list);
  const createBriefing = useMutation(briefingApi.create);
  const setCompleted = useMutation(briefingApi.setCompleted);
  const removeBriefing = useMutation(briefingApi.remove);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await createBriefing({ title, doctrine, protocol });
      setTitle("");
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not create briefing.");
    }
  };

  const handleToggle = async (briefingId: string, completed: boolean) => {
    setError(null);

    try {
      await setCompleted({ briefingId, completed });
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not update briefing.");
    }
  };

  const handleRemove = async (briefingId: string) => {
    setError(null);

    try {
      await removeBriefing({ briefingId });
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Could not delete briefing.");
    }
  };

  return (
    <section className="panel convex-panel">
      <div className="panel-heading">
        <p className="eyebrow">Convex live sync</p>
        <h2>Shared command briefings</h2>
      </div>
      <form className="briefing-form" onSubmit={handleSubmit}>
        <label>
          Add a real-time briefing
          <input
            name="briefing-title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Rush magnetic weapons before retaliation"
            value={title}
          />
        </label>
        <button className="primary-button" type="submit">
          Save briefing
        </button>
      </form>
      {error ? <p className="error-banner">{error}</p> : null}
      {briefings === undefined ? (
        <p className="muted">Loading Convex briefings...</p>
      ) : briefings.length > 0 ? (
        <ul className="briefing-list">
          {briefings.map((briefing) => (
            <li className={briefing.completed ? "briefing-item completed" : "briefing-item"} key={briefing._id}>
              <label>
                <input
                  checked={briefing.completed}
                  onChange={(event) => handleToggle(briefing._id, event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>{briefing.title}</strong>
                  <small>
                    {briefing.doctrine} / {briefing.protocol}
                  </small>
                </span>
              </label>
              <button className="ghost-button" onClick={() => handleRemove(briefing._id)} type="button">
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No shared briefings yet. Add one to verify Convex queries and mutations.</p>
      )}
    </section>
  );
}

export function ConvexSetupPanel() {
  return (
    <section className="panel convex-panel">
      <div className="panel-heading">
        <p className="eyebrow">Convex quickstart</p>
        <h2>Live backend ready to configure</h2>
      </div>
      <p className="muted">
        Run <code>npx convex dev</code>, set <code>VITE_CONVEX_URL</code>, and this panel becomes a real-time
        shared briefing board backed by Convex CRUD functions.
      </p>
    </section>
  );
}
