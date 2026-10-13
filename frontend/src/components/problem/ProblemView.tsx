'use client';

import React, { useState, useEffect } from 'react';
import type { ProblemContext } from '@/types';
import {
  BookOpen,
  Tag,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  ListChecks,
  FileText,
  StickyNote,
  Building2,
} from 'lucide-react';
import { NotepadView } from './NotepadView';
import { problemHasNote } from '@/hooks/useNotepad';
import { COMPANY_MAP } from '@/lib/companyData';

interface ProblemViewProps {
  problem: ProblemContext;
}

type Tab = 'description' | 'constraints' | 'examples' | 'notes';

const difficultyConfig = {
  EASY: {
    label: 'Easy',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: BarChart3,
  },
  HARD: {
    label: 'Hard',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertTriangle,
  },
};

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'description', label: 'Description', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'constraints', label: 'Constraints', icon: <ListChecks className="w-3.5 h-3.5" /> },
  { id: 'examples', label: 'Examples', icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
];

/**
 * Problem view panel — displays the full problem with title, difficulty badge,
 * description, constraints, and examples in a clean tabbed layout with pure white background.
 */
export function ProblemView({ problem }: ProblemViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [hasExistingNote, setHasExistingNote] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [showCompanies, setShowCompanies] = useState(false);

  // Reset topics and companies collapse state when problem changes
  useEffect(() => {
    setShowTopics(false);
    setShowCompanies(false);
  }, [problem.id]);

  // Check if a note already exists for this problem
  useEffect(() => {
    setHasExistingNote(problemHasNote(problem.id));
  }, [problem.id]);

  const handleTabChange = (tab: Tab) => {
    if (activeTab === 'notes') {
      setHasExistingNote(problemHasNote(problem.id));
    }
    setActiveTab(tab);
  };

  const difficulty = difficultyConfig[problem.difficulty] || difficultyConfig.EASY;
  const DiffIcon = difficulty.icon;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 pt-4 pb-0">
        {/* Title row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 flex-shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 tracking-tight leading-snug">
              {problem.title}
            </h1>
            {/* Meta stats row */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Difficulty badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold
                ${difficulty.bg} ${difficulty.color} border ${difficulty.border}`}>
                <DiffIcon className="w-3 h-3" />
                {difficulty.label}
              </span>

              {/* Stats */}
              {problem.acceptanceRate !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs
                  bg-gray-50 border border-gray-200 text-gray-600">
                  <span className="text-emerald-700 font-semibold">{problem.acceptanceRate}%</span>
                  <span className="text-gray-500">accepted</span>
                </span>
              )}

              {problem.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs
                  bg-gray-50 border border-gray-200 text-gray-600 font-medium">
                  {problem.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Topics & Companies row — collapsed by default */}
        {((problem.tags && problem.tags.length > 0) || (problem.companies && problem.companies.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {/* Topics toggle */}
            {problem.tags && problem.tags.length > 0 && (
              <button
                onClick={() => setShowTopics((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer shadow-xs select-none ${
                  showTopics
                    ? 'bg-orange-50 text-brand-700 border-orange-200 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50/60 hover:text-brand-700 hover:border-orange-200'
                }`}
                title={showTopics ? 'Hide topic tags' : 'Show topic tags'}
              >
                <Tag className="w-3 h-3 text-brand-600" />
                <span>Topics</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-gray-200/70 text-gray-600">
                  {problem.tags.length}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                    showTopics ? 'rotate-180 text-brand-600' : ''
                  }`}
                />
              </button>
            )}

            {/* Companies toggle */}
            {problem.companies && problem.companies.length > 0 && (
              <button
                onClick={() => setShowCompanies((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer shadow-xs select-none ${
                  showCompanies
                    ? 'bg-orange-50 text-brand-700 border-orange-200 shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-orange-50/60 hover:text-brand-700 hover:border-orange-200'
                }`}
                title={showCompanies ? 'Hide company tags' : 'Show companies asking this question'}
              >
                <Building2 className="w-3 h-3 text-brand-600" />
                <span>Companies</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-orange-100/80 text-brand-700">
                  {problem.companies.length}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
                    showCompanies ? 'rotate-180 text-brand-600' : ''
                  }`}
                />
              </button>
            )}

            {/* Revealed topic tags when clicked */}
            {showTopics && problem.tags && (
              <div className="flex flex-wrap items-center gap-1.5 animate-fade-in w-full pt-1">
                {problem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium
                      bg-orange-50/70 text-brand-700 border border-orange-200/80
                      hover:bg-orange-100 hover:text-brand-800 transition-colors cursor-default"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Revealed company badges when clicked */}
            {showCompanies && problem.companies && (
              <div className="flex flex-wrap items-center gap-1.5 animate-fade-in w-full pt-1">
                {problem.companies.map((comp) => {
                  const info = COMPANY_MAP[comp.toLowerCase()];
                  return (
                    <span
                      key={comp}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                        info
                          ? `${info.bg} ${info.color} ${info.border}`
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <Building2 className="w-2.5 h-2.5 opacity-75" />
                      {info ? info.name : comp}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 -mx-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold
                border-b-2 transition-all duration-150 rounded-t-lg mx-0.5
                ${activeTab === tab.id
                  ? 'border-brand-500 text-brand-600 bg-orange-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'constraints' && problem.constraints.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold
                  ${activeTab === tab.id ? 'bg-brand-500/15 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                  {problem.constraints.length}
                </span>
              )}
              {tab.id === 'examples' && problem.examples.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold
                  ${activeTab === tab.id ? 'bg-brand-500/15 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                  {problem.examples.length}
                </span>
              )}
              {tab.id === 'notes' && hasExistingNote && activeTab !== 'notes' && (
                <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab !== 'notes' && (
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-white">
          {/* Description Tab */}
          {activeTab === 'description' && (
            <div className="px-5 py-4 animate-fade-in">
              <div
                className="text-xs text-gray-700 leading-relaxed
                  prose prose-sm max-w-none
                  prose-p:mb-3 prose-p:leading-relaxed prose-p:text-gray-700
                  prose-code:text-brand-600 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:border prose-code:border-orange-200
                  prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-pre:rounded-xl prose-pre:p-4 prose-pre:text-slate-800
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:ml-4 prose-li:text-gray-700
                  prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-headings:text-gray-900 prose-headings:font-bold"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              />
            </div>
          )}

          {/* Constraints Tab */}
          {activeTab === 'constraints' && (
            <div className="px-5 py-4 animate-fade-in space-y-2">
              {problem.constraints.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-8">No constraints specified</p>
              ) : (
                problem.constraints.map((constraint, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl
                      bg-gray-50 border border-gray-200
                      hover:border-gray-300 hover:bg-gray-100/60 transition-all duration-150"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                    <code className="text-xs text-gray-800 font-mono leading-relaxed flex-1">
                      {constraint}
                    </code>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="px-5 py-4 animate-fade-in space-y-3">
              {problem.examples.length === 0 ? (
                <p className="text-gray-400 text-xs text-center py-8">No examples available</p>
              ) : (
                problem.examples.map((example, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-xs"
                  >
                    {/* Example header */}
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 border-b border-gray-200">
                      <FlaskConical className="w-3.5 h-3.5 text-brand-600" />
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        Example {i + 1}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      {/* Input */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Input
                        </span>
                        <div className="mt-1 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                          <code className="text-xs font-mono text-slate-800 whitespace-pre-wrap break-all">
                            {example.input}
                          </code>
                        </div>
                      </div>

                      {/* Output */}
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Output
                        </span>
                        <div className="mt-1 px-3 py-2 bg-orange-50/50 rounded-lg border border-orange-200/70">
                          <code className="text-xs font-mono text-orange-950 whitespace-pre-wrap break-all font-semibold">
                            {example.output}
                          </code>
                        </div>
                      </div>

                      {/* Explanation */}
                      {example.explanation && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Explanation
                          </span>
                          <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                            {example.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="flex-1 overflow-hidden bg-white">
          <NotepadView
            problemId={problem.id}
            problemTitle={problem.title}
          />
        </div>
      )}
    </div>
  );
}
