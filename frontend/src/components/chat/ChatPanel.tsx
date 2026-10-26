'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import type { ProblemContext, UserProfile } from '@/types';
import {
  Bot, Sparkles, Trash2, AlertCircle, BookOpen, Zap, Brain,
  Timer, Eye, Search, Plus, History, X, ChevronRight, Trash,
} from 'lucide-react';

interface ChatPanelProps {
  problemContext: ProblemContext | null;
  userCode: string;
  language: string;
  learnerProfile?: UserProfile | null;
  memoryCount?: number;
  onOpenProfile?: () => void;
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

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Main chat panel component.
 */
export function ChatPanel({
  problemContext,
  userCode,
  language,
  learnerProfile,
  memoryCount,
  onOpenProfile,
}: ChatPanelProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    startNewChat,
    clearMessages,
    chatHistory,
    viewingSession,
    setViewingSession,
    deleteHistorySession,
  } = useChat(problemContext, userCode, language);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, viewingSession]);

  // Close history panel when problem changes
  useEffect(() => {
    setIsHistoryOpen(false);
    setViewingSession(null);
  }, [problemContext?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayMessages = viewingSession ? viewingSession.messages : messages;
  const messageCount = messages.length;
  const isViewingHistory = viewingSession !== null;

  return (
    <div className="flex h-full bg-white relative overflow-hidden">
      {/* History Sidebar */}
      <div
        className={`absolute left-0 top-0 bottom-0 z-20 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg ${
          isHistoryOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-brand-500" />
            <span className="text-xs font-bold text-gray-900">Chat History</span>
            {chatHistory.length > 0 && (
              <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 rounded-full">
                {chatHistory.length}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsHistoryOpen(false)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* New Chat CTA inside sidebar */}
        <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => {
              startNewChat();
              setIsHistoryOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
          {/* Current session */}
          {messageCount > 0 && (
            <div>
              <p className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current</p>
              <button
                onClick={() => { setViewingSession(null); setIsHistoryOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all group flex items-start gap-2 ${
                  !isViewingHistory
                    ? 'bg-orange-50 border border-orange-200 text-brand-700'
                    : 'hover:bg-gray-50 border border-transparent text-gray-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-[11px]">
                    {messages.find((m) => m.role === 'USER')?.content.slice(0, 50) || 'Active chat'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{messageCount} messages</p>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Past sessions */}
          {chatHistory.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Past Sessions</p>
              {chatHistory.map((session) => {
                const firstUserMsg = session.messages.find((m) => m.role === 'USER');
                const preview = firstUserMsg?.content.slice(0, 55) || 'Chat session';
                const isActive = viewingSession?.id === session.id;
                return (
                  <div
                    key={session.id}
                    className={`group flex items-start gap-1 rounded-xl mb-1 transition-all ${
                      isActive
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => { setViewingSession(session); setIsHistoryOpen(false); }}
                      className="flex-1 text-left px-3 py-2.5 min-w-0"
                    >
                      <p className={`font-semibold truncate text-[11px] ${isActive ? 'text-brand-700' : 'text-gray-700'}`}>
                        {preview}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatRelativeDate(session.startedAt)} · {session.messages.length} msgs
                      </p>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteHistorySession(session.id); }}
                      className="p-1.5 mt-1.5 mr-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete this session"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {chatHistory.length === 0 && messageCount === 0 && (
            <div className="py-10 text-center text-gray-400">
              <History className="w-6 h-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No chat history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white z-10 shadow-xs flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Bot avatar */}
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm shadow-brand-500/25">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            <div>
              <h2 className="text-xs font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                Deebug AI Tutor
                {isViewingHistory && (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    History View
                  </span>
                )}
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
                ) : isViewingHistory ? (
                  <>
                    <History className="w-2.5 h-2.5 text-amber-500" />
                    <span>{formatRelativeDate(viewingSession!.startedAt)} · {viewingSession!.messages.length} messages</span>
                  </>
                ) : problemContext ? (
                  <>
                    <Zap className="w-2.5 h-2.5 text-emerald-600" />
                    <span className="truncate max-w-[180px]">{`Problem: ${problemContext.title}`}</span>
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

          {/* Right-side controls */}
          <div className="flex items-center gap-1.5">
            {learnerProfile && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50/70 border border-orange-200/80 text-[10px] font-semibold text-brand-700 hover:bg-orange-100/70 hover:border-brand-300 transition-all shadow-xs"
                title="Click to view/edit learner profile and AI memories"
              >
                <Brain className="w-3 h-3 text-brand-500" />
                <span>{learnerProfile.skillLevel}</span>
                {typeof memoryCount === 'number' && memoryCount > 0 && (
                  <span className="bg-brand-500 text-white px-1.5 rounded-full text-[9px] font-bold">
                    {memoryCount}
                  </span>
                )}
              </button>
            )}

            {/* History button */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`p-1.5 rounded-lg transition-all duration-150 relative ${
                isHistoryOpen
                  ? 'bg-brand-100 text-brand-600'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Chat history"
            >
              <History className="w-3.5 h-3.5" />
              {chatHistory.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-brand-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {chatHistory.length > 9 ? '9+' : chatHistory.length}
                </span>
              )}
            </button>

            {/* New Chat button */}
            {(messageCount > 0 || isViewingHistory) && (
              <button
                onClick={startNewChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-brand-600 border border-brand-200 bg-orange-50/60 hover:bg-orange-100/70 transition-all shadow-xs"
                title="Archive this chat and start fresh"
              >
                <Plus className="w-3 h-3" />
                New Chat
              </button>
            )}

            {/* Msg count + clear */}
            {messageCount > 0 && !isViewingHistory && (
              <>
                <span className="text-[10px] text-gray-400 font-mono">
                  {messageCount} msg{messageCount !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={clearMessages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                  title="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* History view banner */}
        {isViewingHistory && (
          <div className="flex items-center justify-between px-5 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
            <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
              <History className="w-3 h-3" />
              Viewing past session from {formatRelativeDate(viewingSession!.startedAt)}. This is read-only.
            </span>
            <button
              onClick={() => setViewingSession(null)}
              className="text-[11px] font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              Back to current chat <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="relative flex-1 overflow-y-auto px-5 py-5 space-y-4 scrollbar-thin z-10 bg-white"
        >
          {displayMessages.length === 0 ? (
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
            <>
              {displayMessages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </>
          )}

          {/* Error message */}
          {error && !isViewingHistory && (
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

        {/* Input — hidden when viewing history */}
        {!isViewingHistory && (
          <div className="relative z-10 bg-white flex-shrink-0">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              disabled={!problemContext}
            />
          </div>
        )}

        {/* History view bottom CTA */}
        {isViewingHistory && (
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50/60 flex items-center justify-between flex-shrink-0">
            <span className="text-[11px] text-gray-500">This is a read-only past session</span>
            <button
              onClick={() => setViewingSession(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-[11px] font-semibold hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-3 h-3" /> Back to Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
