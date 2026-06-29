import React, { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CelebrationEvent } from "../types";
import Celebration from "../components/Celebration";

interface CelebrationContextValue {
  celebrate: (event: CelebrationEvent) => void;
}

const CelebrationContext = createContext<CelebrationContextValue | undefined>(undefined);

// Holds a queue of celebration events and renders them one at a time, so several
// events fired together (e.g. a streak and a words milestone) don't overlap.
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<CelebrationEvent[]>([]);

  const celebrate = useCallback((event: CelebrationEvent) => {
    setQueue((q) => [...q, event]);
  }, []);

  const handleDone = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      {queue.length > 0 && <Celebration event={queue[0]} onDone={handleDone} />}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebration must be used within a CelebrationProvider");
  return ctx;
}
