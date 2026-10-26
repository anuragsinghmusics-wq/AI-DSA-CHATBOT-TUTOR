'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Code2,
  BookOpen,
  Search,
  RotateCcw,
  Star,
  Shuffle,
  Sparkles,
  AlertTriangle,
  Loader2,
  Building2,
} from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { getProblems } from '@/lib/api';
import type { ProblemListItem } from '@/types';
import { TopicSection } from './TopicSection';
import { DSAProgressPanel } from './DSAProgressPanel';
import { SHEET_TOPICS, getTopicForProblem } from '@/lib/sheetData';
import { COMPANIES } from '@/lib/companyData';

type FilterTab = 'all' | 'revision';
type DiffFilter = 'all' | 'easy' | 'medium' | 'hard';

/**
 * DSASheetPage — A2Z-style DSA Sheet with topic accordions, progress tracking,
 * and seamless navigation to the problem editor. Pure white background theme.
 */
export function DSASheetPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await getProblems();
        setProblems(data);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load problems');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const { getStatus, markSolved, markRevision, resetAll, getStats } = useProgress(problems);
  const stats = useMemo(() => getStats(), [getStats]);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  // Debounced search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    const timeout = setTimeout(() => setSearchQuery(val), 200);
    return () => clearTimeout(timeout);
  };

  // Problem counts per company
  const companyCounts = useMemo(() => {
    const counts: Record<string, number> = { all: problems.length };
    for (const c of COMPANIES) {
      counts[c.id] = problems.filter((p) =>
        p.companies?.some((comp) => comp.toLowerCase() === c.id.toLowerCase())
      ).length;
    }
    return counts;
  }, [problems]);

  // Group problems by topic, optionally filtered by company
  const groupedTopics = useMemo(() => {
    return SHEET_TOPICS.map((topic) => {
      const topicProblems = problems.filter((p) => {
        if (getTopicForProblem(p) !== topic.id) return false;
        if (selectedCompany !== 'all') {
          return p.companies?.some(
            (c) => c.toLowerCase() === selectedCompany.toLowerCase()
          );
        }
        return true;
      });
      return { topic, problems: topicProblems };
    }).filter((g) => g.problems.length > 0);
  }, [problems, selectedCompany]);

  // Compute active filter string
  const activeFilter = useMemo(() => {
    if (activeTab === 'revision') return 'revision';
    if (diffFilter !== 'all') return diffFilter;
    return 'all';
  }, [activeTab, diffFilter]);

  // Random problem
  const handleRandom = useCallback(() => {
    if (problems.length === 0) return;
    const unsolved = problems.filter((p) => getStatus(p.id) !== 'solved');
    const pool = unsolved.length > 0 ? unsolved : problems;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    if (picked) {
      router.push(`/editor?problemId=${picked.id}`);
    }
  }, [problems, getStatus, router]);

  const handleOpen = useCallback(
    (problemId: string) => {
      router.push(`/editor?problemId=${problemId}`);
    },
    [router]
  );

  const handleResetConfirm = useCallback(() => {
    resetAll();
    setShowResetModal(false);
  }, [resetAll]);

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 overflow-hidden">
      {/* ── Top Nav Bar ────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-gray-200 z-20 shadow-xs flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-xs shadow-brand-500/20">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight leading-none">
              <span className="text-gradient">dee</span>
              <span className="text-gray-900">bug</span>
            </span>
            <span className="text-[9px] text-gray-400 font-semibold tracking-widest uppercase">DSA Tutor</span>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-1 bg-gray-100/80 border border-gray-200 rounded-xl p-1">
          <button
            onClick={() => router.push('/editor')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all duration-150"
          >
            <Code2 className="w-3.5 h-3.5" />
            Editor
          </button>
          <button
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-brand-600 border border-gray-200/80 shadow-xs transition-all duration-150"
          >
            <BookOpen className="w-3.5 h-3.5" />
            DSA Sheet
          </button>
        </div>

        {/* Right badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-brand-700 text-[11px] font-semibold border border-orange-200/80">
            <Sparkles className="w-3 h-3 text-brand-600" />
            {stats.solved} Solved
          </div>
        </div>
      </nav>

      {/* ── Sheet Header ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                <span className="text-gradient">DSA</span> Problem Sheet
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                A structured roadmap to master Data Structures &amp; Algorithms from scratch.
              </p>
            </div>

            {/* Reset button */}
            <button
              onClick={() => setShowResetModal(true)}
              disabled={stats.solved === 0 && stats.revision === 0}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-gray-200
                text-xs font-semibold text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Progress
            </button>
          </div>

          {/* ── Overall progress bar ── */}
          {!isLoading && problems.length > 0 && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-brand-600">
                    {stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-800">Overall Progress</div>
                  <div className="text-[10px] text-gray-500">{stats.solved} / {stats.total}</div>
                </div>
              </div>

              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.solved / stats.total) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Easy {stats.byDifficulty.easy.solved}/{stats.byDifficulty.easy.total}
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Medium {stats.byDifficulty.medium.solved}/{stats.byDifficulty.medium.total}
                </span>
                <span className="flex items-center gap-1 text-red-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Hard {stats.byDifficulty.hard.solved}/{stats.byDifficulty.hard.total}
                </span>
              </div>
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {/* All / Revision tabs */}
            <div className="flex items-center gap-1 bg-gray-100/80 border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                  ${activeTab === 'all' ? 'bg-white text-brand-600 border border-gray-200/80 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All Problems
              </button>
              <button
                onClick={() => setActiveTab('revision')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                  ${activeTab === 'revision' ? 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Star className="w-3 h-3 text-amber-500" />
                Revision
                {stats.revision > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">{stats.revision}</span>
                )}
              </button>
            </div>

            {/* Difficulty filter */}
            <div className="flex items-center gap-1 bg-gray-100/80 border border-gray-200 rounded-xl p-1">
              {(['all', 'easy', 'medium', 'hard'] as DiffFilter[]).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDiffFilter(d); setActiveTab('all'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150
                    ${diffFilter === d && activeTab !== 'revision'
                      ? d === 'easy'   ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                      : d === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs'
                      : d === 'hard'   ? 'bg-red-50 text-red-700 border border-red-200/80 shadow-xs'
                      : 'bg-white text-gray-900 border border-gray-200/80 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[160px] max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 shadow-xs">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search problems or tags..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
            </div>

            {/* Random problem */}
            <button
              onClick={handleRandom}
              disabled={problems.length === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200
                text-xs font-semibold text-brand-700 hover:bg-orange-100
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 ml-auto shadow-xs"
            >
              <Shuffle className="w-3.5 h-3.5 text-brand-600" />
              Random Problem
            </button>
          </div>

          {/* ── MNC Company Filter Bar ── */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 overflow-x-auto scrollbar-none pb-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0 mr-1">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              <span>MNC Filter:</span>
            </div>

            {/* All MNCs button */}
            <button
              onClick={() => setSelectedCompany('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                selectedCompany === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              <span>All MNCs</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  selectedCompany === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {problems.length}
              </span>
            </button>

            {/* Top MNC pills */}
            {COMPANIES.map((comp) => {
              const isSelected = selectedCompany.toLowerCase() === comp.id.toLowerCase();
              const count = companyCounts[comp.id] || 0;
              return (
                <button
                  key={comp.id}
                  onClick={() => setSelectedCompany(isSelected ? 'all' : comp.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all duration-150 ${
                    isSelected
                      ? `${comp.activeBg} ${comp.activeColor} ${comp.activeBorder} shadow-xs font-bold ring-1 ring-orange-400/40`
                      : `bg-white ${comp.color} ${comp.border} hover:bg-gray-50`
                  }`}
                >
                  <span>{comp.name}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/80 text-gray-900 shadow-xs'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex bg-white">
        {/* Left — Problem list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 bg-white">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p className="text-sm text-gray-500">Loading problems...</p>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="text-sm text-red-600">{loadError}</p>
              </div>
            ) : (
              <>
                {groupedTopics.map((group, i) => (
                  <TopicSection
                    key={group.topic.id}
                    topic={group.topic}
                    problems={group.problems}
                    getStatus={getStatus}
                    onMarkSolved={markSolved}
                    onMarkRevision={markRevision}
                    onOpen={handleOpen}
                    activeFilter={activeFilter}
                    selectedCompany={selectedCompany}
                    searchQuery={searchQuery}
                    defaultExpanded={i === 0 || selectedCompany !== 'all'}
                  />
                ))}

                {groupedTopics.length === 0 && (
                  <div className="text-center py-16 text-gray-500 text-sm">
                    No problems found for {selectedCompany !== 'all' ? (COMPANIES.find(c => c.id === selectedCompany)?.name || selectedCompany) : 'the current filters'}.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right — Progress panel */}
        <div className="w-76 flex-shrink-0 border-l border-gray-200 p-5 overflow-y-auto scrollbar-thin bg-gray-50/50">
          <DSAProgressPanel stats={stats} />
        </div>
      </div>

      {/* ── Reset Confirm Modal ─────────────────────────────────────────────── */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Reset All Progress?</h2>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-5 leading-relaxed">
              This will clear all your solved and revision marks ({stats.solved + stats.revision} problems).
              Your notes will not be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-all duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold transition-all duration-150 shadow-xs"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
