'use client';

import React, { useState } from 'react';
import type { ProblemContext } from '@/types';
import {
  BookOpen,
  Tag,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  FlaskConical,
  ListChecks,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface ProblemViewProps {
  problem: ProblemContext;
}

type Tab = 'description' | 'constraints' | 'examples';

const difficultyConfig = {
  EASY: {
    label: 'Easy',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    icon: CheckCircle,
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/10',
    icon: BarChart3,
  },
  HARD: {
    label: 'Hard',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/10',
    icon: AlertTriangle,
  },
};

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'description', label: 'Description', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'constraints', label: 'Constraints', icon: <ListChecks className="w-3.5 h-3.5" /> },
  { id: 'examples', label: 'Examples', icon: <FlaskConical className="w-3.5 h-3.5" /> },
];

/**
 * Problem view panel — displays the full problem with title, difficulty badge,
 * description, constraints, and examples in a clean tabbed layout.
 */
export function ProblemView({ problem }: ProblemViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const difficulty = difficultyConfig[problem.difficulty] || difficultyConfig.EASY;
  const DiffIcon = difficulty.icon;

  return (
    <div className="h-full flex flex-col bg-surface-900 overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-surface-850/95 backdrop-blur-xl
        border-b border-surface-700/40 px-5 pt-4 pb-0">

        {/* Title row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 flex-shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-brand-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-100 tracking-tight leading-snug">
              {problem.title}
            </h1>
            {/* Meta stats row */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Difficulty badge */}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold
                ${difficulty.bg} ${difficulty.color} border ${difficulty.border} shadow-sm ${difficulty.glow}`}>
                <DiffIcon className="w-3 h-3" />
                {difficulty.label}
              </span>

              {/* Stats */}
              {problem.acceptanceRate !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs
                  bg-surface-800/60 border border-surface-700/40 text-gray-400">
                  <span className="text-emerald-400 font-semibold">{problem.acceptanceRate}%</span>
                  <span className="text-gray-600">accepted</span>
                </span>
              )}

              {problem.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs
                  bg-surface-800/60 border border-surface-700/40 text-gray-500">
                  {problem.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {problem.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium
                bg-brand-500/8 text-brand-400/80 border border-brand-500/15
                hover:bg-brand-500/15 hover:text-brand-300 transition-colors cursor-default"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mx-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold
                border-b-2 transition-all duration-200 rounded-t-lg mx-0.5
                ${activeTab === tab.id
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-surface-800/40'
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'constraints' && problem.constraints.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold
                  ${activeTab === tab.id ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-700/50 text-gray-600'}`}>
                  {problem.constraints.length}
                </span>
              )}
              {tab.id === 'examples' && problem.examples.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold
                  ${activeTab === tab.id ? 'bg-brand-500/20 text-brand-300' : 'bg-surface-700/50 text-gray-600'}`}>
                  {problem.examples.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="px-5 py-4 animate-fade-in">
            <div
              className="text-sm text-gray-300 leading-relaxed
                prose prose-invert prose-sm max-w-none
                prose-p:mb-3 prose-p:leading-relaxed
                prose-code:text-brand-300 prose-code:bg-surface-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:border prose-code:border-surface-700/30
                prose-pre:bg-surface-950/80 prose-pre:border prose-pre:border-surface-700/40 prose-pre:rounded-xl prose-pre:p-4
                prose-strong:text-gray-100 prose-strong:font-semibold
                prose-ul:ml-4 prose-li:text-gray-300
                prose-h1:text-base prose-h2:text-sm prose-h3:text-sm"
              dangerouslySetInnerHTML={{ __html: problem.description }}
            />
          </div>
        )}

        {/* Constraints Tab */}
        {activeTab === 'constraints' && (
          <div className="px-5 py-4 animate-fade-in space-y-2">
            {problem.constraints.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No constraints specified</p>
            ) : (
              problem.constraints.map((constraint, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl
                    bg-surface-800/50 border border-surface-700/30
                    hover:border-surface-700/50 hover:bg-surface-800/70 transition-all duration-150"
                >
                  <ChevronRight className="w-4 h-4 text-brand-500/60 flex-shrink-0 mt-0.5" />
                  <code className="text-sm text-gray-300 font-mono leading-relaxed flex-1">
                    {constraint}
                  </code>
                </div>
              ))
            )}
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="px-5 py-4 animate-fade-in space-y-4">
            {problem.examples.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No examples available</p>
            ) : (
              problem.examples.map((example, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-surface-700/30 overflow-hidden
                    bg-surface-800/30 hover:border-surface-700/50 transition-all duration-200"
                >
                  {/* Example header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-800/60 border-b border-surface-700/30">
                    <FlaskConical className="w-3.5 h-3.5 text-brand-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Example {i + 1}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Input */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Input
                      </span>
                      <div className="mt-1.5 px-3 py-2.5 bg-surface-900/60 rounded-lg border border-surface-700/30">
                        <code className="text-sm font-mono text-emerald-300 whitespace-pre-wrap break-all">
                          {example.input}
                        </code>
                      </div>
                    </div>

                    {/* Output */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Output
                      </span>
                      <div className="mt-1.5 px-3 py-2.5 bg-surface-900/60 rounded-lg border border-surface-700/30">
                        <code className="text-sm font-mono text-amber-300 whitespace-pre-wrap break-all">
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
                        <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">
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
    </div>
  );
}
