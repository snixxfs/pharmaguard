import { createContext, useContext, useMemo, useReducer } from "react";
import type { ParsedVariant, VCFValidation, SupportedDrug, PharmaResult } from "@/types/pharma";

type State = {
  vcfFileName: string;
  vcfFileSize: number;
  validation: VCFValidation | null;
  variants: ParsedVariant[];
  selectedDrugs: SupportedDrug[];
  autoDetect: boolean;
  results: PharmaResult[] | null;
};

type Action =
  | { type: "setVCF"; fileName: string; fileSize: number; validation: VCFValidation; variants: ParsedVariant[] }
  | { type: "setDrugs"; drugs: SupportedDrug[] }
  | { type: "setAutoDetect"; enabled: boolean }
  | { type: "setResults"; results: PharmaResult[] | null }
  | { type: "reset" };

const initial: State = {
  vcfFileName: "",
  vcfFileSize: 0,
  validation: null,
  variants: [],
  selectedDrugs: [],
  autoDetect: true,
  results: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setVCF":
      return {
        ...state,
        vcfFileName: action.fileName,
        vcfFileSize: action.fileSize,
        validation: action.validation,
        variants: action.variants,
      };
    case "setDrugs":
      return { ...state, selectedDrugs: action.drugs };
    case "setAutoDetect":
      return { ...state, autoDetect: action.enabled };
    case "setResults":
      return { ...state, results: action.results };
    case "reset":
      return initial;
    default:
      return state;
  }
}

const AnalysisContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}

// run storage helpers
export function saveRun(runId: string, results: PharmaResult[], meta: Record<string, unknown>) {
  const key = `pharmaguard:run:${runId}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      runId,
      createdAt: new Date().toISOString(),
      results,
      meta,
    }),
  );
  const indexKey = "pharmaguard:history";
  const existing = JSON.parse(localStorage.getItem(indexKey) || "[]") as string[];
  if (!existing.includes(runId)) {
    existing.unshift(runId);
    localStorage.setItem(indexKey, JSON.stringify(existing.slice(0, 50)));
  }
}

export function getRun(runId: string) {
  const key = `pharmaguard:run:${runId}`;
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as { runId: string; createdAt: string; results: PharmaResult[]; meta: Record<string, unknown> }) : null;
}

export function listRuns() {
  const indexKey = "pharmaguard:history";
  return (JSON.parse(localStorage.getItem(indexKey) || "[]") as string[]).map((id) => getRun(id)).filter(Boolean);
}
