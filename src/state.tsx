import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { createDemoState } from "./seed";
import { reducer, type Action } from "./reducer";
import type { State } from "./types";

const STORAGE_KEY = "lotus-court-rack-v1";

function isState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const candidate = value as State;
  return candidate.version === 1 && Array.isArray(candidate.rooms) && Array.isArray(candidate.stays) && Boolean(candidate.settings);
}

export function loadState(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type HotelContextValue = {
  state: State;
  dispatch: (action: Action) => void;
  storageWarning: boolean;
};

const HotelContext = createContext<HotelContextValue | null>(null);

export function HotelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState() ?? createDemoState());
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageWarning(false);
    } catch {
      setStorageWarning(true);
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, storageWarning }), [state, storageWarning]);
  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
}

export function useHotel(): HotelContextValue {
  const value = useContext(HotelContext);
  if (!value) throw new Error("useHotel must be used inside HotelProvider");
  return value;
}
