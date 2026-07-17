'use client';

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';
import { Bot, User, Copy, Check, Brain, Timer, Code, Search, Eye, Bug } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

// Intent badge config — color + icon + label for each intent type
const intentConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  concept: {
    label: 'Concept',
    color: 'text-indigo-300',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: <Brain className="w-2.5 h-2.5" />,
  },
  complexity: {
    label: 'Complexity',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <Timer className="w-2.5 h-2.5" />,
  },
  dryrun: {
    label: 'Dry Run',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <Eye className="w-2.5 h-2.5" />,
  },
  debugging: {
    label: 'Debug',
    color: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: <Bug className="w-2.5 h-2.5" />,
  },
  theory: {
    label: 'Theory',
    color: 'text-purple-300',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: <Search className="w-2.5 h-2.5" />,
  },
  code_review: {
    label: 'Code Review',
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: <Code className="w-2.5 h-2.5" />,
  },
  visualization: {
    label: 'Visual',
    color: 'text-pink-300',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    icon: <Eye className="w-2.5 h-2.5" />,
  },
  rejected: {
    label: 'Guided',
    color: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: <Brain className="w-2.5 h-2.5" />,
  },
  off_topic: {
    label: 'Off Topic',
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    icon: <Brain className="w-2.5 h-2.5" />,
  },
};

/**
 * Individual chat message bubble.
 * - User messages: right-aligned gradient bubbles
 * - Assistant messages: left-aligned glassmorphism cards with copy button, intent badge
 * - Streaming indicator with blinking cursor
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'USER';
  const isStreaming = message.isStreaming;
  const showTypingDots = isStreaming && message.content === '';
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const intent = message.intent ? intentConfig[message.intent] : null;

  return (
    <div
      className={`flex w-full gap-3 animate-slide-up group ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
          isUser
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-brand-500/20'
            : 'bg-gradient-to-br from-brand-500/80 to-purple-700/80 text-white shadow-purple-500/20'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[82%] min-w-0 flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Role label row */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${
            isUser ? 'text-brand-300' : 'text-purple-400'
          }`}>
            {isUser ? 'You' : 'Deebug'}
          </span>

          {/* Intent badge — shown on assistant messages after streaming */}
          {!isUser && intent && !isStreaming && (
            <span className={`intent-badge ${intent.color} ${intent.bg} ${intent.border}`}>
              {intent.icon}
              {intent.label}
            </span>
          )}

          {/* Streaming indicator badge */}
          {!isUser && isStreaming && (
            <span className="intent-badge text-brand-300 bg-brand-500/10 border-brand-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Thinking…
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-3 min-w-0 w-full overflow-hidden ${
            isUser
              ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-md shadow-lg shadow-brand-900/40'
              : 'bg-surface-800/70 backdrop-blur-sm text-gray-100 border border-surface-700/40 rounded-tl-md shadow-lg shadow-black/20'
          }`}
        >
          {/* Content */}
          {showTypingDots ? (
            // Pure typing dots — no text yet
            <div className="flex items-center gap-1.5 py-0.5 px-1">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" style={{ animationDelay: '-0.32s' }} />
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" style={{ animationDelay: '-0.16s' }} />
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
          ) : (
            // Assistant markdown content with optional streaming cursor
            <div className={`prose prose-invert prose-sm max-w-none break-words
              prose-p:leading-relaxed prose-p:my-1.5
              prose-headings:text-brand-200 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
              prose-strong:text-brand-200 prose-strong:font-semibold
              prose-ul:my-1.5 prose-li:my-0.5
              prose-blockquote:border-brand-500 prose-blockquote:text-gray-300
              prose-code:text-brand-300 prose-code:bg-surface-950/60 prose-code:px-1 prose-code:rounded prose-code:text-xs prose-code:break-words
              prose-pre:bg-surface-950/80 prose-pre:border prose-pre:border-surface-700/40 prose-pre:rounded-xl
              ${isStreaming ? 'cursor-blink' : ''}
            `}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Copy button — visible on hover for assistant messages */}
          {!isUser && !isStreaming && message.content && (
            <button
              onClick={handleCopy}
              title="Copy response"
              className="absolute top-2 right-2 p-1.5 rounded-lg
                opacity-0 group-hover:opacity-100
                bg-surface-700/60 hover:bg-surface-700 text-gray-400 hover:text-gray-100
                transition-all duration-200 border border-surface-600/30"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] px-1 ${isUser ? 'text-brand-300/50' : 'text-gray-600'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}
