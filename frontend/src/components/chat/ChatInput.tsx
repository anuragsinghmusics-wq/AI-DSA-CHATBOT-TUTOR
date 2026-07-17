'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MAX_CHARS = 2000;

/**
 * Chat input with send button.
 * - Auto-focuses on mount
 * - Enter to send, Shift+Enter for newline
 * - Auto-resizes textarea up to max height
 * - Shows character count and keyboard shortcut hint
 * - Animated glow border on focus
 */
export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = input.length;
  const isNearLimit = charCount > MAX_CHARS * 0.8;
  const isOverLimit = charCount > MAX_CHARS;
  const canSend = input.trim() && !isLoading && !disabled && !isOverLimit;

  return (
    <div className="border-t border-surface-700/40 bg-surface-850/95 backdrop-blur-md px-4 pt-3 pb-4">
      <div className="max-w-3xl mx-auto">
        {/* Input container with animated glow */}
        <div
          className={`relative rounded-2xl transition-all duration-300 ${
            isFocused && !disabled
              ? 'ring-2 ring-brand-500/40 shadow-lg shadow-brand-500/10'
              : 'ring-1 ring-surface-700/50'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              disabled
                ? 'Select a problem to start chatting...'
                : 'Ask about concepts, complexity, dry runs, debugging...'
            }
            disabled={isLoading || disabled}
            rows={1}
            maxLength={MAX_CHARS + 100} // soft enforcement via UI, hard cutoff here
            className="w-full resize-none bg-surface-800/80 rounded-2xl
              text-gray-100 text-sm leading-relaxed px-4 py-3 pr-12
              placeholder:text-gray-600
              focus:outline-none
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-200"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`absolute right-2.5 bottom-2.5 w-8 h-8 rounded-xl
              flex items-center justify-center
              transition-all duration-200
              ${canSend
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 hover:from-brand-400 hover:to-brand-500 hover:scale-105 active:scale-95'
                : 'bg-surface-700/50 text-gray-600 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Footer row: hint + char count */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <CornerDownLeft className="w-3 h-3" />
            <span>Enter to send</span>
            <span className="text-gray-700">·</span>
            <span>Shift+Enter for newline</span>
          </div>

          {/* Character count — only show when typing */}
          {charCount > 0 && (
            <span className={`text-[10px] font-mono tabular-nums transition-colors ${
              isOverLimit
                ? 'text-red-400'
                : isNearLimit
                ? 'text-amber-400'
                : 'text-gray-600'
            }`}>
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        {/* Brand disclaimer */}
        <p className="text-[10px] text-gray-700 text-center mt-1.5">
          Deebug teaches concepts only — it will never provide complete code solutions.
        </p>
      </div>
    </div>
  );
}
