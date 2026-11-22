import { invokeEdge } from "./edge";
import type { RoiInputs } from "./roi";

export type PilotSimulationResult = { ok: true; id: string; createdAt: string } | { ok: false };

/** Persists an audit-impact run through the `pilot-simulation` Edge Function. */
export const savePilotSimulation = async ({
  data,
}: {
  data: RoiInputs;
}): Promise<PilotSimulationResult> => {
  try {
    return await invokeEdge<PilotSimulationResult>("pilot-simulation", data);
  } catch (error) {
    console.error("Pilot simulation save failed", error);
    return { ok: false };
  }
};
