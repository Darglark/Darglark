export type EntryMode = "strategy" | "darglarkingHub";

const DARGLARKING_HUB_PATH = "/darglarking-yellow";

export function getEntryMode(pathname: string): EntryMode {
  return pathname === DARGLARKING_HUB_PATH || pathname.startsWith(`${DARGLARKING_HUB_PATH}/`)
    ? "darglarkingHub"
    : "strategy";
}
