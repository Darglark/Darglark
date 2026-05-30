export type InitialExperience = "xcom" | "darglarking";

export function getInitialExperience(hash: string): InitialExperience {
  return hash === "#darglarking-yellow" ? "darglarking" : "xcom";
}
