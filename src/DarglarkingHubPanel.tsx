import { useEffect, useRef } from "react";
import { renderDarglarkingHub } from "./darglarkingHub";

export function DarglarkingHubPanel() {
  const hubRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const hubRoot = hubRef.current;
    if (!hubRoot) return;

    renderDarglarkingHub(hubRoot);

    return () => {
      hubRoot.innerHTML = "";
    };
  }, []);

  return <section className="darglarking-hub-panel" ref={hubRef} aria-label="The Darglarking Yellow hidden-lore hub" />;
}
