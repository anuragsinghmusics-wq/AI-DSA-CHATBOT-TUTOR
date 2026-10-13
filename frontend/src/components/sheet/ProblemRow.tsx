'use client';

import React, { useCallback } from 'react';
import { CheckCircle2, Star, Circle, Building2 } from 'lucide-react';
import type { ProblemStatus } from '@/hooks/useProgress';
import { COMPANY_MAP } from '@/lib/companyData';

interface ProblemRowProps {
  problem: {
    id: string;
    title: string;
    difficulty: string;
    tags: string[];
    companies?: string[];
  };
  status: ProblemStatus;
  index: number;
  onMarkSolved: (id: string) => void;
  onMarkRevision: (id: string) => void;
  onOpen: (id: string) => void;
  isVisible: boolean;
}

const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Easy',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  MEDIUM: { label: 'Medium', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  HARD:   { label: 'Hard',   color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
} as const;

/**
 * ProblemRow — a single clickable row inside a topic section.
 * Clicking anywhere on the row opens the problem in the AI editor.
 * Clicking the solved or revision buttons toggles status without opening.
 */
export function ProblemRow({
  problem,
  status,
  index,
  onMarkSolved,
  onMarkRevision,
  onOpen,
  isVisible,
}: ProblemRowProps) {
  const diff = DIFFICULTY_CONFIG[problem.difficulty as keyof typeof DIFFICULTY_CONFIG] ?? DIFFICULTY_CONFIG.MEDIUM;

  const handleSolved = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMarkSolved(problem.id);
    },
    [onMarkSolved, problem.id]
  );

  const handleRevision = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onMarkRevision(problem.id);
    },
    [onMarkRevision, problem.id]
  );

  const handleRowClick = useCallback(() => {
    onOpen(problem.id);
  }, [onOpen, problem.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen(problem.id);
      }
    },
    [onOpen, problem.id]
  );

  if (!isVisible) return null;

  return (
    <div
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      title={`Click to open "${problem.title}" in Editor`}
      className={`group flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0
        transition-all duration-150 hover:bg-orange-50/40 cursor-pointer select-none outline-none focus-visible:bg-orange-50/50
        ${status === 'solved' ? 'bg-emerald-50/20' : ''}
        ${status === 'revision' ? 'bg-amber-50/20' : ''}`}
    >
      {/* Row index */}
      <span className="w-7 text-center text-xs text-gray-400 font-mono flex-shrink-0 select-none">
        {index}
      </span>

      {/* Status buttons (stops propagation so clicking them does not open the problem) */}
      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Solved toggle */}
        <button
          onClick={handleSolved}
          title={status === 'solved' ? 'Mark as unsolved' : 'Mark as solved'}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 shadow-xs
            ${status === 'solved'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : 'bg-white text-gray-400 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        {/* Revision toggle */}
        <button
          onClick={handleRevision}
          title={status === 'revision' ? 'Remove from revision' : 'Add to revision'}
          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 shadow-xs
            ${status === 'revision'
              ? 'bg-amber-100 text-amber-700 border border-amber-300'
              : 'bg-white text-gray-400 border border-gray-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
            }`}
        >
          <Star className={`w-3.5 h-3.5 ${status === 'revision' ? 'fill-amber-500 text-amber-500' : ''}`} />
        </button>

        {/* Unsolved indicator */}
        {!status && (
          <span className="w-6 h-6 flex items-center justify-center">
            <Circle className="w-2 h-2 text-gray-300" />
          </span>
        )}
        {status && <span className="w-6" />}
      </div>

      {/* Problem title */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-xs truncate block transition-colors duration-150
            ${status === 'solved' ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-brand-600 font-medium'}`}
        >
          {problem.title}
        </span>
      </div>

      {/* Tags (first 2 only) */}
      <div className="hidden md:flex items-center gap-1 flex-shrink-0">
        {problem.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Company Badges (first 2 only) */}
      {problem.companies && problem.companies.length > 0 && (
        <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
          {problem.companies.slice(0, 2).map((comp) => {
            const info = COMPANY_MAP[comp.toLowerCase()];
            return (
              <span
                key={comp}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                  info ? `${info.bg} ${info.color} ${info.border}` : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                <Building2 className="w-2.5 h-2.5 opacity-70" />
                {info ? info.shortName : comp}
              </span>
            );
          })}
          {problem.companies.length > 2 && (
            <span className="text-[9px] font-semibold text-gray-400">
              +{problem.companies.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Difficulty badge */}
      <span
        className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border
          ${diff.bg} ${diff.color} ${diff.border}`}
      >
        {diff.label}
      </span>
    </div>
  );
}
