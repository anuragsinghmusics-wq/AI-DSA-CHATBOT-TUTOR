'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NoteSection = 'none' | 'idea' | 'approach' | 'complexity' | 'solution' | 'doubt';

export type SaveStatus = 'saved' | 'saving' | 'idle';

export interface NotepadData {
  /** Raw HTML content of the editor */
  content: string;
  /** Active section tag for the current note */
  section: NoteSection;
  /** ISO timestamp of last save */
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = 'deebug_note_';
const AUTO_SAVE_DELAY_MS = 600;

function storageKey(problemId: string) {
  return `${STORAGE_PREFIX}${problemId}`;
}

function loadNote(problemId: string): NotepadData | null {
  try {
    const raw = localStorage.getItem(storageKey(problemId));
    return raw ? (JSON.parse(raw) as NotepadData) : null;
  } catch {
    return null;
  }
}

function saveNote(problemId: string, data: NotepadData) {
  try {
    localStorage.setItem(storageKey(problemId), JSON.stringify(data));
  } catch {
    // Silently ignore storage quota errors
  }
}

function deleteNote(problemId: string) {
  try {
    localStorage.removeItem(storageKey(problemId));
  } catch {
    // ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useNotepad — manages per-problem notepad state with localStorage persistence.
 *
 * - Loads the note from localStorage on mount / when problemId changes.
 * - Auto-saves changes after a debounce delay.
 * - Tracks "hasNotes" so the tab badge can show a dot indicator.
 */
export function useNotepad(problemId: string) {
  const [content, setContent] = useState('');
  const [section, setSection] = useState<NoteSection>('none');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Derived: whether the note has any real content */
  const hasNotes = content.trim().length > 0;

  // ── Load note when problemId changes ───────────────────────────────────────
  useEffect(() => {
    const saved = loadNote(problemId);
    if (saved) {
      setContent(saved.content ?? '');
      setSection(saved.section ?? 'none');
      setUpdatedAt(saved.updatedAt ?? null);
    } else {
      setContent('');
      setSection('none');
      setUpdatedAt(null);
    }
    setSaveStatus('idle');
  }, [problemId]);

  // ── Debounced auto-save ────────────────────────────────────────────────────
  const scheduleAutoSave = useCallback(
    (newContent: string, newSection: NoteSection) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      setSaveStatus('saving');

      saveTimerRef.current = setTimeout(() => {
        const now = new Date().toISOString();
        saveNote(problemId, { content: newContent, section: newSection, updatedAt: now });
        setUpdatedAt(now);
        setSaveStatus('saved');

        // Fade back to "idle" after 2.5s
        setTimeout(() => setSaveStatus('idle'), 2500);
      }, AUTO_SAVE_DELAY_MS);
    },
    [problemId]
  );

  // ── Update content ─────────────────────────────────────────────────────────
  const updateContent = useCallback(
    (newContent: string) => {
      setContent(newContent);
      scheduleAutoSave(newContent, section);
    },
    [section, scheduleAutoSave]
  );

  // ── Update section tag ─────────────────────────────────────────────────────
  const updateSection = useCallback(
    (newSection: NoteSection) => {
      setSection(newSection);
      // Save immediately when section changes (if there's content)
      if (content.trim()) {
        scheduleAutoSave(content, newSection);
      }
    },
    [content, scheduleAutoSave]
  );

  // ── Clear note ─────────────────────────────────────────────────────────────
  const clearNote = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    deleteNote(problemId);
    setContent('');
    setSection('none');
    setUpdatedAt(null);
    setSaveStatus('idle');
    setShowClearConfirm(false);
  }, [problemId]);

  // ── Cleanup timer on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    content,
    section,
    saveStatus,
    updatedAt,
    hasNotes,
    showClearConfirm,
    setShowClearConfirm,
    updateContent,
    updateSection,
    clearNote,
  };
}

/** Returns true if there is any saved note for the given problemId */
export function problemHasNote(problemId: string): boolean {
  const saved = loadNote(problemId);
  return !!saved && (saved.content?.trim().length ?? 0) > 0;
}
