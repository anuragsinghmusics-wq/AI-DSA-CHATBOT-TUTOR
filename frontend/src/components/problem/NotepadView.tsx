'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import {
  PenLine,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  CheckSquare,
  Copy,
  Trash2,
  Clock,
  Lightbulb,
  GitBranch,
  Timer,
  CheckCircle2,
  HelpCircle,
  CloudOff,
  Check,
  Loader2,
  AlignLeft,
} from 'lucide-react';
import { useNotepad, type NoteSection } from '@/hooks/useNotepad';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotepadViewProps {
  problemId: string;
  problemTitle: string;
}

// ─── Section Tag Config ───────────────────────────────────────────────────────

const SECTION_TAGS: Array<{
  id: NoteSection;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
}> = [
  {
    id: 'none',
    label: 'General',
    icon: <AlignLeft className="w-3 h-3" />,
    color: 'text-gray-700',
    bg: 'bg-gray-100/70',
    border: 'border-gray-200',
    activeBg: 'bg-gray-200',
    activeBorder: 'border-gray-300',
  },
  {
    id: 'idea',
    label: 'Idea',
    icon: <Lightbulb className="w-3 h-3 text-amber-500" />,
    color: 'text-amber-800',
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    activeBg: 'bg-amber-100',
    activeBorder: 'border-amber-300',
  },
  {
    id: 'approach',
    label: 'Approach',
    icon: <GitBranch className="w-3 h-3 text-blue-500" />,
    color: 'text-blue-800',
    bg: 'bg-blue-50/70',
    border: 'border-blue-200',
    activeBg: 'bg-blue-100',
    activeBorder: 'border-blue-300',
  },
  {
    id: 'complexity',
    label: 'Complexity',
    icon: <Timer className="w-3 h-3 text-brand-500" />,
    color: 'text-brand-800',
    bg: 'bg-orange-50/70',
    border: 'border-orange-200',
    activeBg: 'bg-orange-100',
    activeBorder: 'border-orange-300',
  },
  {
    id: 'solution',
    label: 'Solution',
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    color: 'text-emerald-800',
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-100',
    activeBorder: 'border-emerald-300',
  },
  {
    id: 'doubt',
    label: 'Doubt',
    icon: <HelpCircle className="w-3 h-3 text-red-500" />,
    color: 'text-red-800',
    bg: 'bg-red-50/70',
    border: 'border-red-200',
    activeBg: 'bg-red-100',
    activeBorder: 'border-red-300',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text === '' ? 0 : text.split(' ').length;
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  title,
  active,
  children,
  variant = 'default',
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        border transition-all duration-150 select-none shadow-xs
        ${
          variant === 'danger'
            ? 'border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 active:scale-95'
            : active
            ? 'bg-orange-50 border-orange-200 text-brand-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:scale-95'
        }
      `}
    >
      {children}
    </button>
  );
}

// ─── Save Status Indicator ────────────────────────────────────────────────────

function SaveStatusIndicator({ status }: { status: 'saved' | 'saving' | 'idle' }) {
  if (status === 'idle') return null;

  return (
    <span
      className={`
        inline-flex items-center gap-1 text-[11px] font-semibold
        transition-all duration-200
        ${status === 'saving' ? 'text-amber-600' : 'text-emerald-600'}
      `}
    >
      {status === 'saving' ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Check className="w-3 h-3" />
          Saved
        </>
      )}
    </span>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ problemTitle }: { problemTitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center select-none bg-white">
      <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-4">
        <PenLine className="w-6 h-6 text-brand-500" />
      </div>

      <h3 className="text-xs font-bold text-gray-800 mb-1">No notes yet</h3>
      <p className="text-xs text-gray-500 leading-relaxed max-w-[220px]">
        Record your intuition, edge cases, and approach for{' '}
        <span className="text-gray-700 font-semibold">"{problemTitle}"</span>.
      </p>

      {/* Hint chips */}
      <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
        {['💡 Intuition', '🔷 Pattern', '⏱ Complexity', '✅ Solution'].map((hint) => (
          <span
            key={hint}
            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 border border-gray-200 text-gray-600"
          >
            {hint}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotepadView({ problemId, problemTitle }: NotepadViewProps) {
  const {
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
  } = useNotepad(problemId);

  const editorRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [relativeTime, setRelativeTime] = React.useState('');

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  useEffect(() => {
    if (!updatedAt) {
      setRelativeTime('');
      return;
    }
    setRelativeTime(formatRelativeTime(updatedAt));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(updatedAt));
    }, 30_000);
    return () => clearInterval(interval);
  }, [updatedAt]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      updateContent(editorRef.current.innerHTML);
    }
  }, [updateContent]);

  const execFormat = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setTimeout(() => {
      if (editorRef.current) {
        updateContent(editorRef.current.innerHTML);
      }
    }, 0);
  }, [updateContent]);

  const insertCodeBlock = useCallback(() => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const code = document.createElement('pre');
    code.style.cssText =
      'background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #f97316;border-radius:8px;padding:10px 14px;font-family:JetBrains Mono,monospace;font-size:12px;color:#1e293b;margin:8px 0;white-space:pre-wrap;';
    code.contentEditable = 'true';
    code.textContent = sel.toString() || '// write your code here';

    range.deleteContents();
    range.insertNode(code);

    const newRange = document.createRange();
    newRange.selectNodeContents(code);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);

    setTimeout(() => {
      if (editorRef.current) {
        updateContent(editorRef.current.innerHTML);
      }
    }, 0);
  }, [updateContent]);

  const insertChecklist = useCallback(() => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin:4px 0;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cssText =
      'margin-top:3px;width:14px;height:14px;accent-color:#f97316;flex-shrink:0;cursor:pointer;';

    const span = document.createElement('span');
    span.contentEditable = 'true';
    span.style.cssText = 'flex:1;color:#1e293b;font-size:13px;line-height:1.5;';
    span.textContent = 'Task item';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(span);
    range.insertNode(wrapper);

    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);

    setTimeout(() => {
      if (editorRef.current) {
        updateContent(editorRef.current.innerHTML);
      }
    }, 0);
  }, [updateContent]);

  const copyAll = useCallback(() => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const activeSection = SECTION_TAGS.find((s) => s.id === section) ?? SECTION_TAGS[0];
  const wordCount = countWords(content);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* ── Section Tag Row ── */}
      <div className="px-4 pt-3 pb-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">
            Tag
          </span>
          {SECTION_TAGS.map((tag) => {
            const isActive = section === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => updateSection(tag.id)}
                className={`
                  inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold
                  border transition-all duration-150 shadow-xs
                  ${isActive
                    ? `${tag.activeBg} ${tag.color} ${tag.activeBorder} scale-105`
                    : `${tag.bg} text-gray-600 ${tag.border} hover:${tag.activeBg} hover:${tag.color}`
                  }
                `}
              >
                {tag.icon}
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Formatting Toolbar ── */}
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-1 flex-wrap">
          <ToolbarButton onClick={() => execFormat('bold')} title="Bold (Ctrl+B)">
            <Bold className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execFormat('italic')} title="Italic (Ctrl+I)">
            <Italic className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execFormat('underline')} title="Underline (Ctrl+U)">
            <Underline className="w-3 h-3" />
          </ToolbarButton>
          <ToolbarButton onClick={() => execFormat('strikeThrough')} title="Strikethrough">
            <Strikethrough className="w-3 h-3" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-0.5" />

          <ToolbarButton onClick={insertCodeBlock} title="Insert code block">
            <Code className="w-3 h-3" />
            <span className="hidden sm:inline">Code</span>
          </ToolbarButton>
          <ToolbarButton onClick={insertChecklist} title="Insert checklist item">
            <CheckSquare className="w-3 h-3" />
            <span className="hidden sm:inline">Task</span>
          </ToolbarButton>

          <div className="flex-1" />

          <ToolbarButton onClick={copyAll} title="Copy all text">
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </ToolbarButton>

          {hasNotes && (
            <ToolbarButton
              onClick={() => setShowClearConfirm(true)}
              title="Clear note"
              variant="danger"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </ToolbarButton>
          )}
        </div>
      </div>

      {/* ── Clear Confirmation Banner ── */}
      {showClearConfirm && (
        <div
          className="mx-4 mt-3 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50
            flex items-center justify-between gap-3 animate-fade-in shadow-xs"
        >
          <p className="text-xs text-red-700 font-medium">
            Clear all notes for this problem?
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:text-gray-900 shadow-xs"
            >
              Cancel
            </button>
            <button
              onClick={clearNote}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Editor Area ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin relative bg-white">
        {/* Active section accent line */}
        {section !== 'none' && (
          <div
            className={`absolute left-0 top-0 bottom-0 w-1 ${activeSection.color.replace('text-', 'bg-')}`}
          />
        )}

        {/* Empty state overlay */}
        {!hasNotes && (
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            <EmptyState problemTitle={problemTitle} />
          </div>
        )}

        {/* Contenteditable editor */}
        <div
          id={`notepad-editor-${problemId}`}
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className={`
            min-h-full w-full px-5 py-4 text-xs text-gray-800 leading-relaxed
            focus:outline-none relative z-10 bg-transparent
          `}
          style={{ fontFamily: "'Inter', sans-serif", lineHeight: '1.75', minHeight: '100%' }}
        />
      </div>

      {/* ── Status Bar ── */}
      <div
        className="flex items-center justify-between px-4 py-2
          border-t border-gray-200 bg-white"
      >
        <div className="flex items-center gap-3">
          <SaveStatusIndicator status={saveStatus} />
          {saveStatus === 'idle' && !hasNotes && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <CloudOff className="w-3 h-3" />
              Not saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {section !== 'none' && (
            <span
              className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold
                border ${activeSection.bg} ${activeSection.color} ${activeSection.border}
              `}
            >
              {activeSection.icon}
              {activeSection.label}
            </span>
          )}

          {hasNotes && (
            <span className="text-[11px] text-gray-500">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          )}

          {relativeTime && (
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              {relativeTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
