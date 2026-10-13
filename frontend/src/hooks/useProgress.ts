'use client';

import { useState, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProblemStatus = 'solved' | 'revision' | null;

export interface ProgressStats {
  solved: number;
  revision: number;
  total: number;
  byDifficulty: {
    easy: { solved: number; total: number };
    medium: { solved: number; total: number };
    hard: { solved: number; total: number };
  };
}

interface ProgressStore {
  [problemId: string]: ProblemStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'deebug_progress';

// ─── Pure helpers (safe to call outside React) ────────────────────────────────

function loadStore(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function saveStore(store: ProgressStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Silently ignore storage quota errors
  }
}

/** Read-only helper: returns status for a problem without needing the hook */
export function getProblemStatus(problemId: string): ProblemStatus {
  const store = loadStore();
  return store[problemId] ?? null;
}

/** Read-only helper: returns true if problem is marked solved */
export function isProblemSolved(problemId: string): boolean {
  return getProblemStatus(problemId) === 'solved';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useProgress — manages the global DSA problem progress state with localStorage.
 *
 * - Loads the entire progress store on mount.
 * - Provides per-problem status setters.
 * - Computes aggregate stats (for the progress panel).
 * - Problems list must be passed in for stats computation.
 */
export function useProgress(problems?: Array<{ id: string; difficulty: string }>) {
  const [store, setStore] = useState<ProgressStore>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    setStore(loadStore());
    setIsLoaded(true);
  }, []);

  // ── Persist whenever store changes ─────────────────────────────────────────
  useEffect(() => {
    if (isLoaded) {
      saveStore(store);
    }
  }, [store, isLoaded]);

  // ── Getters ────────────────────────────────────────────────────────────────

  const getStatus = useCallback(
    (problemId: string): ProblemStatus => store[problemId] ?? null,
    [store]
  );

  // ── Setters ────────────────────────────────────────────────────────────────

  /** Mark a problem as solved. If already solved, clears the status. */
  const markSolved = useCallback((problemId: string) => {
    setStore((prev) => {
      const next = { ...prev };
      if (next[problemId] === 'solved') {
        delete next[problemId];
      } else {
        next[problemId] = 'solved';
      }
      return next;
    });
  }, []);

  /** Mark a problem for revision. If already in revision, clears the status. */
  const markRevision = useCallback((problemId: string) => {
    setStore((prev) => {
      const next = { ...prev };
      if (next[problemId] === 'revision') {
        delete next[problemId];
      } else {
        next[problemId] = 'revision';
      }
      return next;
    });
  }, []);

  /** Clear a problem's status entirely. */
  const clearStatus = useCallback((problemId: string) => {
    setStore((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
  }, []);

  /** Reset ALL progress (with confirmation in the UI layer). */
  const resetAll = useCallback(() => {
    setStore({});
  }, []);

  // ── Stats computation ──────────────────────────────────────────────────────

  const getStats = useCallback((): ProgressStats => {
    if (!problems) {
      const solved = Object.values(store).filter((s) => s === 'solved').length;
      const revision = Object.values(store).filter((s) => s === 'revision').length;
      return {
        solved,
        revision,
        total: 0,
        byDifficulty: {
          easy: { solved: 0, total: 0 },
          medium: { solved: 0, total: 0 },
          hard: { solved: 0, total: 0 },
        },
      };
    }

    const stats: ProgressStats = {
      solved: 0,
      revision: 0,
      total: problems.length,
      byDifficulty: {
        easy: { solved: 0, total: 0 },
        medium: { solved: 0, total: 0 },
        hard: { solved: 0, total: 0 },
      },
    };

    for (const p of problems) {
      const diff = p.difficulty?.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
      const status = store[p.id] ?? null;

      if (status === 'solved') stats.solved++;
      if (status === 'revision') stats.revision++;

      if (diff === 'EASY') {
        stats.byDifficulty.easy.total++;
        if (status === 'solved') stats.byDifficulty.easy.solved++;
      } else if (diff === 'MEDIUM') {
        stats.byDifficulty.medium.total++;
        if (status === 'solved') stats.byDifficulty.medium.solved++;
      } else if (diff === 'HARD') {
        stats.byDifficulty.hard.total++;
        if (status === 'solved') stats.byDifficulty.hard.solved++;
      }
    }

    return stats;
  }, [store, problems]);

  return {
    isLoaded,
    getStatus,
    markSolved,
    markRevision,
    clearStatus,
    resetAll,
    getStats,
  };
}
