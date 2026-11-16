import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Calculator, LayoutDashboard, Mic, Network, Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { PRESET_DOSSIERS } from "@/lib/presets";
import { SEGMENTS } from "@/lib/dossier";
import { useTerminal } from "./terminal-context";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, setDeskOpen } = useTerminal();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  const go = (fn: () => void) => {
    setPaletteOpen(false);
    fn();
  };

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <CommandInput placeholder="Search dossiers, views, actions…" />
      <CommandList>
        <CommandEmpty>No match.</CommandEmpty>
        <CommandGroup heading="UAE corporate dossiers">
          {PRESET_DOSSIERS.map((d) => (
            <CommandItem
              key={d.slug}
              value={`${d.entityName} ${d.sector}`}
              onSelect={() => go(() => navigate({ to: "/sandbox", search: { entity: d.slug } }))}
            >
              <Building2 className="text-gold" />
              <span className="flex-1">{d.entityName}</span>
              <span className="num text-[10px] text-muted-foreground">
                {SEGMENTS.find((s) => s.id === d.segment)?.short}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="live entity search research" onSelect={() => go(() => navigate({ to: "/sandbox", search: { focus: "search" } }))}>
            <Search className="text-azure" /> Live entity search
          </CommandItem>
          <CommandItem value="voice copilot deal desk" onSelect={() => go(() => setDeskOpen(true))}>
            <Mic className="text-azure" /> Toggle Deal Desk voice copilot
          </CommandItem>
          <CommandItem value="roi simulator wholesale" onSelect={() => go(() => navigate({ to: "/roi-model" }))}>
            <Calculator className="text-emerald" /> Open Wholesale ROI Simulator
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Views">
          <CommandItem value="command center home" onSelect={() => go(() => navigate({ to: "/" }))}>
            <LayoutDashboard /> Command Center
          </CommandItem>
          <CommandItem value="architecture sovereign azure" onSelect={() => go(() => navigate({ to: "/architecture" }))}>
            <Network /> Sovereign architecture
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
