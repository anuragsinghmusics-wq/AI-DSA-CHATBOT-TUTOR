'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ProblemView } from '@/components/problem/ProblemView';
import { getProblems, getProblemById } from '@/lib/api';
import type { ProblemContext, ProblemListItem } from '@/types';
import {
  Code2,
  ChevronDown,
  GripVertical,
  Zap,
  Shield,
  BookOpen,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';

/**
 * Main application layout.
 * Split-panel: Problem view (left) + Chat panel (right).
 * Includes a searchable problem selector dropdown and resizable panels.
 */
export function AppLayout() {
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<ProblemContext | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load problems on mount
  useEffect(() => {
    async function loadProblems() {
      try {
        const data = await getProblems();
        setProblems(data);

        // ✅ FIX: Auto-select first REAL problem from DB, not a hardcoded mock
        if (data.length > 0) {
          setIsLoadingProblem(true);
          try {
            const first = await getProblemById(data[0].id);
            setSelectedProblem(first);
          } catch {
            // If auto-load fails, let user pick manually
          } finally {
            setIsLoadingProblem(false);
          }
        }
      } catch (err) {
        console.error('Failed to load problems:', err);
      } finally {
        setIsLoadingProblems(false);
      }
    }
    loadProblems();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle problem selection
  const handleSelectProblem = async (problemId: string) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    setIsLoadingProblem(true);
    try {
      const problem = await getProblemById(problemId);
      setSelectedProblem(problem);
    } catch (err) {
      console.error('Failed to load problem:', err);
    } finally {
      setIsLoadingProblem(false);
    }
  };

  // Resizable panel handling
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      setPanelWidth(Math.min(Math.max(newWidth, 25), 75));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const difficultyColor: Record<string, string> = {
    EASY: 'text-emerald-400',
    MEDIUM: 'text-amber-400',
    HARD: 'text-red-400',
  };

  const difficultyDot: Record<string, string> = {
    EASY: 'bg-emerald-400',
    MEDIUM: 'bg-amber-400',
    HARD: 'bg-red-400',
  };

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen flex flex-col bg-surface-900 text-gray-100">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-5 py-2.5
        bg-surface-850/95 backdrop-blur-xl border-b border-surface-700/40 z-20
        shadow-lg shadow-black/20">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-700
            flex items-center justify-center shadow-md shadow-brand-500/30 animate-glow-strong">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight leading-none">
              <span className="text-gradient">dee</span>
              <span className="text-gray-100">bug</span>
            </span>
            <span className="text-[9px] text-gray-600 font-medium tracking-widest uppercase">
              DSA Tutor
            </span>
          </div>
        </div>

        {/* Problem Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setSearchQuery('');
            }}
            disabled={isLoadingProblems}
            className="flex items-center gap-2.5 px-4 py-2 rounded-xl
              bg-surface-800/80 border border-surface-700/50 text-sm
              hover:border-brand-500/40 hover:bg-surface-750/80 disabled:opacity-50
              transition-all duration-200 backdrop-blur-sm group min-w-[220px]"
          >
            <BookOpen className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span className="flex-1 text-left max-w-[180px] truncate text-gray-300">
              {isLoadingProblem ? (
                <span className="text-gray-500">Loading…</span>
              ) : selectedProblem ? (
                selectedProblem.title
              ) : isLoadingProblems ? (
                <span className="text-gray-500">Loading problems…</span>
              ) : (
                <span className="text-gray-500">Select a Problem</span>
              )}
            </span>
            {isLoadingProblems || isLoadingProblem ? (
              <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin flex-shrink-0" />
            ) : (
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-96
              bg-surface-800/95 backdrop-blur-xl border border-surface-700/50
              rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-scale-in">

              {/* Search */}
              <div className="p-3 border-b border-surface-700/40">
                <div className="flex items-center gap-2 bg-surface-900/60 border border-surface-700/40
                  rounded-xl px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search problems or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600
                      focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-600 hover:text-gray-400 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Problem list */}
              <div className="p-2 max-h-80 overflow-y-auto scrollbar-thin">
                {filteredProblems.length === 0 ? (
                  <div className="text-center py-8 text-gray-600 text-sm">
                    No problems found
                  </div>
                ) : (
                  filteredProblems.map((problem) => (
                    <button
                      key={problem.id}
                      onClick={() => handleSelectProblem(problem.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm
                        transition-all duration-150 flex items-center justify-between gap-3
                        ${
                          selectedProblem?.id === problem.id
                            ? 'bg-brand-500/10 border border-brand-500/25'
                            : 'hover:bg-surface-700/50 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${difficultyDot[problem.difficulty] || 'bg-gray-500'}`} />
                        <span className="font-medium text-gray-200 truncate">{problem.title}</span>
                      </div>
                      <span className={`text-xs font-semibold flex-shrink-0 ${difficultyColor[problem.difficulty] || 'text-gray-400'}`}>
                        {problem.difficulty}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-surface-700/40 px-4 py-2">
                <p className="text-[10px] text-gray-600 text-center">
                  {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right section — status badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10
            text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
            <Shield className="w-3 h-3" />
            5-Layer Safety
          </div>
          {/* ✅ FIX: Changed from "Qwen3 8B" to the actual model */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10
            text-brand-400 text-[11px] font-semibold border border-brand-500/20">
            <Zap className="w-3 h-3" />
            Gemini 2.5 Flash
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10
            text-purple-400 text-[11px] font-semibold border border-purple-500/20">
            <Sparkles className="w-3 h-3" />
            RAG
          </div>
        </div>
      </nav>

      {/* Main Content — Split panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Problem View */}
        <div style={{ width: `${panelWidth}%` }} className="flex-shrink-0 overflow-hidden">
          {isLoadingProblem ? (
            <div className="h-full flex items-center justify-center text-gray-600">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                <p className="text-sm">Loading problem…</p>
              </div>
            </div>
          ) : selectedProblem ? (
            <ProblemView problem={selectedProblem} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600 bg-mesh">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-800/60 border border-surface-700/30
                  flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-sm text-gray-600">
                  {isLoadingProblems ? 'Loading problems…' : 'Select a problem from the dropdown above'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 flex-shrink-0 cursor-col-resize relative group
            transition-colors duration-200
            ${isDragging ? 'bg-brand-500' : 'bg-surface-700/40 hover:bg-brand-500/60'}`}
        >
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            transition-opacity duration-200 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Right Panel — Chat */}
        <div className="flex-1 min-w-0">
          <ChatPanel problemContext={selectedProblem} />
        </div>
      </div>
    </div>
  );
}
