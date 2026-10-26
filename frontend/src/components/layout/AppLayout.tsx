'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ProblemView } from '@/components/problem/ProblemView';
import { CodeEditor, getStarterCode } from '@/components/problem/CodeEditor';
import { LearnerProfileModal } from '@/components/profile/LearnerProfileModal';
import { getProblems, getProblemById, getUserProfile } from '@/lib/api';
import type { ProblemContext, ProblemListItem, UserProfile, UserMemory } from '@/types';
import {
  Code2,
  ChevronDown,
  GripVertical,
  Shield,
  BookOpen,
  Search,
  Loader2,
  Sparkles,
  Brain,
} from 'lucide-react';

/**
 * Main application layout.
 * Split-panel: Problem view (left) + Code Editor (middle) + Chat panel (right).
 */
export function AppLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<ProblemContext | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  
  // 3-panel state
  const [panelWidths, setPanelWidths] = useState([30, 70]);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  
  const [userCode, setUserCode] = useState('// Write your solution here...\n');
  const [language, setLanguage] = useState('cpp');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Learner Profile & AI Memory State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [learnerProfile, setLearnerProfile] = useState<UserProfile | null>(null);
  const [userMemories, setUserMemories] = useState<UserMemory[]>([]);

  useEffect(() => {
    async function loadLearnerProfile() {
      try {
        const data = await getUserProfile();
        if (data?.profile) {
          setLearnerProfile(data.profile);
          if (data.profile.preferredLanguage) {
            setLanguage(data.profile.preferredLanguage);
          }
        }
        if (data?.memories) {
          setUserMemories(data.memories);
        }
      } catch (err) {
        console.warn('Could not load learner profile:', err);
      }
    }
    loadLearnerProfile();
  }, []);

  const handleProfileUpdated = (profile: UserProfile, memories: UserMemory[]) => {
    setLearnerProfile(profile);
    setUserMemories(memories);
    if (profile.preferredLanguage && profile.preferredLanguage !== language) {
      setLanguage(profile.preferredLanguage);
      if (selectedProblem?.codeSnippets) {
        setUserCode(getStarterCode(selectedProblem.codeSnippets, profile.preferredLanguage));
      }
    }
  };

  useEffect(() => {
    const deepLinkId = searchParams?.get('problemId');

    async function loadProblems() {
      try {
        const data = await getProblems();
        setProblems(data);

        const targetId = deepLinkId || (data.length > 0 ? data[0].id : null);
        if (targetId) {
          if (typeof window !== 'undefined' && !deepLinkId) {
            window.history.replaceState(null, '', `/editor?problemId=${targetId}`);
          }
          setIsLoadingProblem(true);
          try {
            const problem = await getProblemById(targetId);
            setSelectedProblem(problem);
            setUserCode(getStarterCode(problem.codeSnippets, 'cpp'));
          } catch {
            if (deepLinkId && data.length > 0) {
              try {
                const first = await getProblemById(data[0].id);
                setSelectedProblem(first);
                setUserCode(getStarterCode(first.codeSnippets, 'cpp'));
                if (typeof window !== 'undefined') {
                  window.history.replaceState(null, '', `/editor?problemId=${data[0].id}`);
                }
              } catch { /* ignore */ }
            }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleSelectProblem = async (problemId: string) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/editor?problemId=${problemId}`);
    }
    setIsLoadingProblem(true);
    try {
      const problem = await getProblemById(problemId);
      setSelectedProblem(problem);
      setUserCode(getStarterCode(problem.codeSnippets, language));
    } catch (err) {
      console.error('Failed to load problem:', err);
    } finally {
      setIsLoadingProblem(false);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const percentage = (e.clientX / window.innerWidth) * 100;
      if (isDragging === 'left') {
        setPanelWidths(prev => [Math.min(Math.max(percentage, 15), prev[1] - 15), prev[1]]);
      } else {
        setPanelWidths(prev => [prev[0], Math.min(Math.max(percentage, prev[0] + 15), 85)]);
      }
    };

    const handleMouseUp = () => setIsDragging(null);

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
    EASY:   'text-emerald-700 bg-emerald-50 border-emerald-200',
    MEDIUM: 'text-amber-700 bg-amber-50 border-amber-200',
    HARD:   'text-red-700 bg-red-50 border-red-200',
  };
  const difficultyDot: Record<string, string> = {
    EASY:   'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    HARD:   'bg-red-500',
  };

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-gray-200 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-500/20">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold tracking-tight leading-none">
              <span className="text-gradient">dee</span>
              <span className="text-gray-900">bug</span>
            </span>
            <span className="text-[9px] text-gray-400 font-semibold tracking-widest uppercase">
              DSA Tutor
            </span>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex items-center gap-1 bg-gray-100/80 border border-gray-200 rounded-xl p-1">
          <button
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-brand-600 border border-gray-200/80 shadow-xs transition-all duration-150"
          >
            <Code2 className="w-3.5 h-3.5" />
            Editor
          </button>
          <button
            onClick={() => router.push('/sheet')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-white/60 transition-all duration-150"
          >
            <BookOpen className="w-3.5 h-3.5" />
            DSA Sheet
          </button>
        </div>

        {/* Problem Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setSearchQuery('');
            }}
            disabled={isLoadingProblems}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium hover:border-brand-500/50 hover:bg-orange-50/20 disabled:opacity-50 transition-all duration-150 group min-w-[210px] shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            <span className="flex-1 text-left max-w-[170px] truncate text-gray-800 font-medium">
              {isLoadingProblem ? (
                <span className="text-gray-400">Loading…</span>
              ) : selectedProblem ? (
                selectedProblem.title
              ) : isLoadingProblems ? (
                <span className="text-gray-400">Loading problems…</span>
              ) : (
                <span className="text-gray-400">Select a Problem</span>
              )}
            </span>
            {isLoadingProblems || isLoadingProblem ? (
              <Loader2 className="w-3 h-3 text-gray-400 animate-spin flex-shrink-0" />
            ) : (
              <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in">
              <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-xs">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search problems or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  )}
                </div>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto scrollbar-thin">
                {filteredProblems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">No problems found</div>
                ) : (
                  filteredProblems.map((problem) => (
                    <button
                      key={problem.id}
                      onClick={() => handleSelectProblem(problem.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all duration-150 flex items-center justify-between gap-3 ${selectedProblem?.id === problem.id ? 'bg-orange-50 border border-orange-200 text-brand-900 font-semibold' : 'hover:bg-gray-50 border border-transparent text-gray-700'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${difficultyDot[problem.difficulty] || 'bg-gray-400'}`} />
                        <span className="truncate">{problem.title}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex-shrink-0 ${difficultyColor[problem.difficulty] || 'text-gray-500 border-gray-200'}`}>
                        {problem.difficulty}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Learner Profile & AI Memory Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:border-brand-400 hover:text-brand-600 hover:bg-orange-50/30 transition-all shadow-xs group"
            title="Open Learner Profile & AI Long-Term Memory"
          >
            <Brain className="w-3.5 h-3.5 text-brand-500 group-hover:scale-110 transition-transform" />
            <span>Profile & Memory</span>
            {userMemories.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                {userMemories.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/80">
            <Shield className="w-3 h-3 text-emerald-600" /> 5-Layer Safety
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-brand-700 text-[11px] font-semibold border border-orange-200/80">
            <Sparkles className="w-3 h-3 text-brand-600" /> Gemini 2.5 Flash
          </div>
        </div>
      </nav>

      {/* Main Content — Split panels */}
      <div className="flex-1 flex overflow-hidden bg-white">
        {/* Left Panel — Problem View */}
        <div style={{ width: `${panelWidths[0]}%` }} className="flex-shrink-0 overflow-hidden border-r border-gray-200">
          {isLoadingProblem ? (
            <div className="h-full flex items-center justify-center text-gray-400 bg-white">
              <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
            </div>
          ) : selectedProblem ? (
            <ProblemView problem={selectedProblem} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-300 bg-white">
              <BookOpen className="w-8 h-8 opacity-40" />
            </div>
          )}
        </div>

        {/* Left Resize Handle */}
        <div
          onMouseDown={() => setIsDragging('left')}
          className={`w-1 flex-shrink-0 cursor-col-resize relative group transition-colors duration-150 ${isDragging === 'left' ? 'bg-brand-500' : 'bg-gray-100 hover:bg-brand-400'}`}
        >
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${isDragging === 'left' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Middle Panel — Code Editor */}
        <div style={{ width: `${panelWidths[1] - panelWidths[0]}%` }} className="flex-shrink-0 overflow-hidden border-r border-gray-200">
           <CodeEditor
            code={userCode}
            onChange={(val) => setUserCode(val || '')}
            language={language}
            onLanguageChange={(lang) => {
              setLanguage(lang);
              if (selectedProblem?.codeSnippets) {
                setUserCode(getStarterCode(selectedProblem.codeSnippets, lang));
              }
            }}
            codeSnippets={selectedProblem?.codeSnippets}
            exampleTestcases={selectedProblem?.exampleTestcases}
          />
        </div>

        {/* Right Resize Handle */}
        <div
          onMouseDown={() => setIsDragging('right')}
          className={`w-1 flex-shrink-0 cursor-col-resize relative group transition-colors duration-150 ${isDragging === 'right' ? 'bg-brand-500' : 'bg-gray-100 hover:bg-brand-400'}`}
        >
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150 ${isDragging === 'right' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <GripVertical className="w-3 h-3 text-gray-400" />
          </div>
        </div>

        {/* Right Panel — Chat */}
        <div className="flex-1 min-w-0 bg-white">
          <ChatPanel
            problemContext={selectedProblem}
            userCode={userCode}
            language={language}
            learnerProfile={learnerProfile}
            memoryCount={userMemories.length}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />
        </div>
      </div>

      {/* Learner Profile & AI Memory Modal */}
      <LearnerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}
