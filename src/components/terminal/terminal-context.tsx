import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { InstitutionalDossier } from "@/lib/dossier";
import { PRESET_DOSSIERS } from "@/lib/presets";

interface TerminalState {
  activeDossier: InstitutionalDossier;
  setActiveDossier: (d: InstitutionalDossier) => void;
  deskOpen: boolean;
  setDeskOpen: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
}

const Ctx = createContext<TerminalState | null>(null);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [activeDossier, setActiveDossier] = useState<InstitutionalDossier>(PRESET_DOSSIERS[1]!);
  const [deskOpen, setDeskOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const value = useMemo(
    () => ({ activeDossier, setActiveDossier, deskOpen, setDeskOpen, paletteOpen, setPaletteOpen }),
    [activeDossier, deskOpen, paletteOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTerminal() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTerminal must be used inside TerminalProvider");
  return v;
}
