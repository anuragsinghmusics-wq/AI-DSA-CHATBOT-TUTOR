'use client';

import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import type { ProblemContext } from '@/types';
import { Bot, Sparkles, Trash2, AlertCircle, BookOpen, Zap, Brain, Timer, Eye, Search } from 'lucide-react';

interface ChatPanelProps {
  problemContext: ProblemContext | null;
  userCode: string;
  language: string;
}

const SUGGESTION_CARDS = [
  {
    icon: <Brain className="w-4 h-4" />,
    label: 'Concept',
    text: 'What concept does this problem test?',
    color: 'text-brand-700',
    bg: 'bg-orange-50/70 border-orange-200 hover:border-orange-300 hover:bg-orange-100/70',
  },
  {
    icon: <Timer className="w-4 h-4" />,
    label: 'Complexity',
    text: 'Explain the time and space complexity',
    color: 'text-amber-700',
    bg: 'bg-amber-50/70 border-amber-200 hover:border-amber-300 hover:bg-amber-100/70',
  },
  {
    icon: <Eye className="w-4 h-4" />,
    label: 'Dry Run',
    text: 'Walk me through a dry run with example input',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100/70',
  },
  {
    icon: <Search className="w-4 h-4" />,
    label: 'Strategy',
    text: 'What algorithm pattern should I use here?',
    color: 'text-brand-700',
    bg: 'bg-orange-50/70 border-orange-200 hover:border-orange-300 hover:bg-orange-100/70',
  },
];

/**
 * Main chat panel component.
 * Contains the message list, auto-scroll, empty state, and input with pure white background.
 */
export function ChatPanel({ problemContext, userCode, language }: ChatPanelProps) {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat(problemContext, userCode, language);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const messageCount = messages.length;

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white z-10 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Bot avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-500/25">
              <Bot className="w-4 h-4 text-white" />
            </div>
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
          </div>

          <div>
            <h2 className="text-xs font-bold text-gray-900 tracking-tight">
              Deebug AI Tutor
            </h2>
            <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <span className="flex gap-0.5 items-center">
                    <span className="w-1 h-1 rounded-full bg-brand-500 animate-pulse-dot" style={{ animationDelay: '-0.32s' }} />
                    <span className="w-1 h-1 rounded-full bg-brand-500 animate-pulse-dot" style={{ animationDelay: '-0.16s' }} />
                    <span className="w-1 h-1 rounded-full bg-brand-500 animate-pulse-dot" />
                  </span>
                  <span className="text-brand-600 font-medium">Processing…</span>
                </>
              ) : problemContext ? (
                <>
                  <Zap className="w-2.5 h-2.5 text-emerald-600" />
                  <span className="truncate max-w-[200px]">{`Problem: ${problemContext.title}`}</span>
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

        {/* Message count + clear */}
        <div className="flex items-center gap-2">
          {messageCount > 0 && (
            <span className="text-[10px] text-gray-400 font-mono">
              {messageCount} msg{messageCount !== 1 ? 's' : ''}
            </span>
          )}
          {messageCount > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 group"
              title="Clear chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin z-10 bg-white"
      >
        {messages.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-4 shadow-xs">
              <Sparkles className="w-7 h-7 text-brand-500" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1.5 tracking-tight">
              Welcome to <span className="text-gradient">Deebug</span>
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mb-6 leading-relaxed">
              Your AI tutor for DSA concepts. Ask me about patterns, complexity,
              dry runs, or step-by-step guidance!
            </p>

            {problemContext ? (
              <div className="w-full max-w-sm space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">
                  Suggested Questions
                </p>
                {SUGGESTION_CARDS.map((card, i) => (
                  <button
                    key={card.label}
                    onClick={() => sendMessage(card.text)}
                    disabled={isLoading}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs border
                      flex items-center gap-3 shadow-xs
                      transition-all duration-150 disabled:opacity-50
                      animate-slide-up ${card.bg}`}
                  >
                    <span className={`flex-shrink-0 ${card.color}`}>{card.icon}</span>
                    <div className="min-w-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${card.color}`}>
                        {card.label}
                      </span>
                      <p className="text-gray-700 text-xs mt-0.5 truncate">{card.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <BookOpen className="w-8 h-8 text-gray-300" />
                <p className="text-xs text-gray-400">
                  Select a problem from the dropdown to start chatting
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
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[10px] uppercase tracking-wider mb-0.5">Error</p>
              <p className="text-red-600 break-words whitespace-pre-wrap">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10 bg-white">
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!problemContext}
        />
      </div>
    </div>
  );
}
