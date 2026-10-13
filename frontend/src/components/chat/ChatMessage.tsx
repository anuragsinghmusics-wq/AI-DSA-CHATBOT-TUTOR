'use client';

import React, { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/types';
import { Bot, User, Copy, Check, Brain, Timer, Code, Search, Eye, Bug } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

// Intent badge config — high-contrast light colors with clean borders
const intentConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  concept: {
    label: 'Concept',
    color: 'text-brand-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <Brain className="w-2.5 h-2.5 text-brand-600" />,
  },
  complexity: {
    label: 'Complexity',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <Timer className="w-2.5 h-2.5 text-amber-600" />,
  },
  dryrun: {
    label: 'Dry Run',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <Eye className="w-2.5 h-2.5 text-emerald-600" />,
  },
  debugging: {
    label: 'Debug',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <Bug className="w-2.5 h-2.5 text-red-600" />,
  },
  theory: {
    label: 'Theory',
    color: 'text-brand-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <Search className="w-2.5 h-2.5 text-brand-600" />,
  },
  code_review: {
    label: 'Review',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: <Code className="w-2.5 h-2.5 text-cyan-600" />,
  },
  visualization: {
    label: 'Visual',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: <Eye className="w-2.5 h-2.5 text-pink-600" />,
  },
  rejected: {
    label: 'Guided',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: <Brain className="w-2.5 h-2.5 text-orange-600" />,
  },
  off_topic: {
    label: 'Off Topic',
    color: 'text-gray-700',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    icon: <Brain className="w-2.5 h-2.5 text-gray-500" />,
  },
};

/**
 * Individual chat message bubble.
 * - User messages: right-aligned orange gradient bubbles with crisp white text
 * - Assistant messages: left-aligned off-white cards with dark readable text and copy button
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
      className={`flex w-full gap-2.5 animate-slide-up group ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center shadow-xs ${
          isUser
            ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-500/20'
            : 'bg-gray-100 border border-gray-200 text-brand-600'
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[85%] min-w-0 flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Role label row */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isUser ? 'text-brand-600' : 'text-gray-500'
          }`}>
            {isUser ? 'You' : 'Deebug'}
          </span>

          {/* Intent badge */}
          {!isUser && intent && !isStreaming && (
            <span className={`intent-badge ${intent.color} ${intent.bg} ${intent.border}`}>
              {intent.icon}
              {intent.label}
            </span>
          )}

          {/* Streaming indicator badge */}
          {!isUser && isStreaming && (
            <span className="intent-badge text-brand-700 bg-orange-50 border-orange-200">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Thinking…
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 min-w-0 w-full overflow-hidden ${
            isUser
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-tr-sm shadow-sm shadow-brand-500/20'
              : 'bg-gray-50/90 border border-gray-200 text-gray-800 rounded-tl-sm shadow-xs'
          }`}
        >
          {/* Content */}
          {showTypingDots ? (
            <div className="flex items-center gap-1.5 py-1 px-1">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-dot" style={{ animationDelay: '-0.32s' }} />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-dot" style={{ animationDelay: '-0.16s' }} />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-dot" />
            </div>
          ) : isUser ? (
            <p className="text-xs leading-relaxed break-words whitespace-pre-wrap font-medium">{message.content}</p>
          ) : (
            // Assistant markdown content
            <div className={`prose prose-sm max-w-none break-words text-gray-800
              prose-p:leading-relaxed prose-p:my-1.5 prose-p:text-gray-800
              prose-headings:text-gray-900 prose-headings:font-bold prose-headings:mt-2.5 prose-headings:mb-1
              prose-strong:text-gray-900 prose-strong:font-bold
              prose-ul:my-1.5 prose-li:my-0.5 prose-li:text-gray-800
              prose-blockquote:border-brand-500 prose-blockquote:bg-orange-50/50 prose-blockquote:text-gray-700
              prose-code:text-brand-700 prose-code:bg-orange-50 prose-code:border prose-code:border-orange-200/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:break-words
              prose-pre:bg-white prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-xl prose-pre:shadow-xs prose-pre:text-slate-800
              ${isStreaming ? 'cursor-blink' : ''}
            `}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Copy button */}
          {!isUser && !isStreaming && message.content && (
            <button
              onClick={handleCopy}
              title="Copy response"
              className="absolute top-2 right-2 p-1.5 rounded-lg
                opacity-0 group-hover:opacity-100
                bg-white hover:bg-gray-100 text-gray-500 hover:text-gray-900
                transition-all duration-150 border border-gray-200 shadow-xs"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
