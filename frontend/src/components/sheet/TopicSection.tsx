'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProblemRow } from './ProblemRow';
import type { ProblemStatus } from '@/hooks/useProgress';
import type { SheetTopic } from '@/lib/sheetData';
import { ACCENT_CLASSES } from '@/lib/sheetData';

// ─── Dynamic icon map ─────────────────────────────────────────────────────────
import {
  BookOpen, ArrowUpDown, Layers, Search, Type, Link,
  RefreshCw, Layers2, GitBranch, Network, Zap, TrendingUp, MoreHorizontal,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen:      <BookOpen className="w-4 h-4" />,
  ArrowUpDown:   <ArrowUpDown className="w-4 h-4" />,
  Layers:        <Layers className="w-4 h-4" />,
  Search:        <Search className="w-4 h-4" />,
  Type:          <Type className="w-4 h-4" />,
  Link:          <Link className="w-4 h-4" />,
  RefreshCw:     <RefreshCw className="w-4 h-4" />,
  Layers2:       <Layers2 className="w-4 h-4" />,
  GitBranch:     <GitBranch className="w-4 h-4" />,
  Network:       <Network className="w-4 h-4" />,
  Zap:           <Zap className="w-4 h-4" />,
  TrendingUp:    <TrendingUp className="w-4 h-4" />,
  MoreHorizontal:<MoreHorizontal className="w-4 h-4" />,
};

// How many rows to render per "page"
const PAGE_SIZE = 50;

interface TopicSectionProps {
  topic: SheetTopic;
  problems: Array<{ id: string; title: string; difficulty: string; tags: string[]; companies?: string[] }>;
  getStatus: (id: string) => ProblemStatus;
  onMarkSolved: (id: string) => void;
  onMarkRevision: (id: string) => void;
  onOpen: (id: string) => void;
  activeFilter: string;
  selectedCompany?: string;
  searchQuery: string;
  defaultExpanded?: boolean;
}

export function TopicSection({
  topic,
  problems,
  getStatus,
  onMarkSolved,
  onMarkRevision,
  onOpen,
  activeFilter,
  selectedCompany,
  searchQuery,
  defaultExpanded = false,
}: TopicSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const accent = ACCENT_CLASSES[topic.accent] ?? ACCENT_CLASSES.gray;
  const icon = ICON_MAP[topic.icon] ?? ICON_MAP.MoreHorizontal;

  const solvedCount = useMemo(
    () => problems.filter((p) => getStatus(p.id) === 'solved').length,
    [problems, getStatus]
  );

  const progressPct = problems.length > 0 ? (solvedCount / problems.length) * 100 : 0;

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchCompany = p.companies?.some((c) => c.toLowerCase().includes(q));
        if (!matchTitle && !matchTag && !matchCompany) return false;
      }
      if (selectedCompany && selectedCompany !== 'all') {
        const hasCompany = p.companies?.some(
          (c) => c.toLowerCase() === selectedCompany.toLowerCase()
        );
        if (!hasCompany) return false;
      }
      if (activeFilter === 'solved')   return getStatus(p.id) === 'solved';
      if (activeFilter === 'revision') return getStatus(p.id) === 'revision';
      if (activeFilter === 'easy')     return p.difficulty === 'EASY';
      if (activeFilter === 'medium')   return p.difficulty === 'MEDIUM';
      if (activeFilter === 'hard')     return p.difficulty === 'HARD';
      return true;
    });
  }, [problems, searchQuery, selectedCompany, activeFilter, getStatus]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, activeFilter, selectedCompany]);

  const visibleProblems = useMemo(
    () => filteredProblems.slice(0, visibleCount),
    [filteredProblems, visibleCount]
  );

  const hasMore = visibleCount < filteredProblems.length;

  const handleShowMore = useCallback(() => {
    setVisibleCount((c) => c + PAGE_SIZE);
  }, []);

  const shouldExpand =
    isExpanded ||
    searchQuery.length > 0 ||
    activeFilter !== 'all' ||
    (selectedCompany !== undefined && selectedCompany !== 'all');

  if (filteredProblems.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3 bg-white shadow-xs">
      {/* Header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50/70 transition-all duration-150 text-left"
      >
        {/* Expand/collapse chevron */}
        <span className={`flex-shrink-0 transition-transform duration-150 ${shouldExpand ? 'rotate-0' : '-rotate-90'}`}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </span>

        {/* Icon */}
        <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${accent.bg} ${accent.text} border ${accent.border}`}>
          {icon}
        </span>

        {/* Topic label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-900 truncate">{topic.label}</span>
            <span className="text-xs text-gray-500 flex-shrink-0 font-medium">
              {solvedCount} / {problems.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
            <div
              className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Problems count badge */}
        <span className="flex-shrink-0 text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
          {filteredProblems.length} shown
        </span>
      </button>

      {/* Problem list */}
      {shouldExpand && (
        <div className="border-t border-gray-100">
          {visibleProblems.map((problem, i) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              status={getStatus(problem.id)}
              index={i + 1}
              onMarkSolved={onMarkSolved}
              onMarkRevision={onMarkRevision}
              onOpen={onOpen}
              isVisible={true}
            />
          ))}

          {/* Show more button */}
          {hasMore && (
            <button
              onClick={handleShowMore}
              className="w-full py-2.5 text-xs font-semibold text-gray-600 hover:text-brand-600
                hover:bg-gray-50 border-t border-gray-100 transition-all duration-150"
            >
              Show {Math.min(PAGE_SIZE, filteredProblems.length - visibleCount)} more
              <span className="text-gray-400 ml-1">
                ({filteredProblems.length - visibleCount} remaining)
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
