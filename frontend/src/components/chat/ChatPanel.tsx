'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import type { ProblemContext } from '@/types';
import { Bot, Sparkles, Trash2, AlertCircle, BookOpen, Zap, Brain, Timer, Eye, Search } from 'lucide-react';

interface ChatPanelProps {
  problemContext: ProblemContext | null;
}

const SUGGESTION_CARDS = [
  {
    icon: <Brain className="w-4 h-4" />,
    label: 'Concept',
    text: 'What concept does this problem test?',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/15',
  },
  {
    icon: <Timer className="w-4 h-4" />,
    label: 'Complexity',
    text: 'Explain the time and space complexity',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/15',
  },
  {
    icon: <Eye className="w-4 h-4" />,
    label: 'Dry Run',
    text: 'Walk me through a dry run with example input',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/15',
  },
  {
    icon: <Search className="w-4 h-4" />,
    label: 'Strategy',
    text: 'What algorithm pattern should I use here?',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/15',
  },
];

/**
 * Main chat panel component.
 * Contains the message list, auto-scroll, empty state, and input.
 */
export function ChatPanel({ problemContext }: ChatPanelProps) {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat(problemContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages / streaming tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const messageCount = messages.length;

  return (
    <div className="flex flex-col h-full bg-surface-900 relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-mesh opacity-60 pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-3
        border-b border-surface-700/40 bg-surface-850/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          {/* Bot avatar with glow */}
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-700
              flex items-center justify-center shadow-lg shadow-brand-500/25 animate-glow">
              <Bot className="w-5 h-5 text-white" />
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full
              border-2 border-surface-850 shadow-sm" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-100 tracking-tight">
              Deebug AI Tutor
            </h2>
            <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <span className="flex gap-0.5 items-center">
                    <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse-dot" style={{ animationDelay: '-0.32s' }} />
                    <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse-dot" style={{ animationDelay: '-0.16s' }} />
                    <span className="w-1 h-1 rounded-full bg-brand-400 animate-pulse-dot" />
                  </span>
                  <span className="text-brand-400">Processing…</span>
                </>
              ) : problemContext ? (
                <>
                  <Zap className="w-2.5 h-2.5 text-emerald-400" />
                  {`Helping with: ${problemContext.title}`}
                </>
              ) : (
                <>
                  <BookOpen className="w-2.5 h-2.5" />
                  Select a problem to begin
                </>
              )}
            </p>
          </div>
        </div>

        {/* Message count + clear button */}
        <div className="flex items-center gap-2">
          {messageCount > 0 && (
            <span className="text-[10px] text-gray-600 font-mono">
              {messageCount} msg{messageCount !== 1 ? 's' : ''}
            </span>
          )}
          {messageCount > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10
                transition-all duration-200 group"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin z-10"
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500/20 to-purple-700/20
                border border-brand-500/20 flex items-center justify-center animate-glow">
                <Sparkles className="w-9 h-9 text-brand-400 animate-float" />
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-3 rounded-full border border-brand-500/10 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold text-gray-100 mb-2 tracking-tight">
              Welcome to <span className="text-gradient">Deebug</span>
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mb-8 leading-relaxed">
              Your AI tutor for DSA concepts. Ask me about patterns, complexity,
              dry runs, or anything conceptual!
            </p>

            {problemContext ? (
              <div className="w-full max-w-sm space-y-2.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  Try asking…
                </p>
                {SUGGESTION_CARDS.map((card, i) => (
                  <button
                    key={card.label}
                    onClick={() => sendMessage(card.text)}
                    disabled={isLoading}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm border
                      flex items-center gap-3
                      transition-all duration-200 disabled:opacity-50
                      animate-slide-up ${card.bg}`}
                  >
                    <span className={`flex-shrink-0 ${card.color}`}>{card.icon}</span>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${card.color}`}>
                        {card.label}
                      </span>
                      <p className="text-gray-300 text-xs mt-0.5">{card.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <BookOpen className="w-10 h-10 text-gray-700" />
                <p className="text-sm text-gray-600">
                  Select a problem from the dropdown above to get started
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Message list */
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20
            rounded-xl text-red-400 text-sm animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-xs uppercase tracking-wider mb-1">Error</p>
              <p className="text-red-300 break-words whitespace-pre-wrap">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!problemContext}
        />
      </div>
    </div>
  );
}
