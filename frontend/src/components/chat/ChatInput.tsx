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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
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
    <div className="border-t border-gray-200 bg-white px-4 pt-3 pb-3">
      <div className="max-w-3xl mx-auto">
        {/* Input container */}
        <div
          className={`relative rounded-2xl transition-all duration-150 border ${
            isFocused && !disabled
              ? 'border-brand-500 ring-2 ring-brand-500/15 shadow-sm'
              : 'border-gray-200 bg-gray-50/60'
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
                : 'Ask about concepts, patterns, complexity, dry runs...'
            }
            disabled={isLoading || disabled}
            rows={1}
            maxLength={MAX_CHARS + 100}
            className="w-full resize-none bg-transparent rounded-2xl
              text-gray-900 text-xs leading-relaxed px-4 py-3 pr-12
              placeholder:text-gray-400
              focus:outline-none
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors duration-150"
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`absolute right-2 bottom-2 w-7 h-7 rounded-lg
              flex items-center justify-center
              transition-all duration-150
              ${canSend
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-xs shadow-brand-500/30 hover:from-brand-600 hover:to-brand-700 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Footer row: hint + char count */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <CornerDownLeft className="w-3 h-3 text-gray-400" />
            <span>Enter to send</span>
            <span className="text-gray-300">&middot;</span>
            <span>Shift+Enter for newline</span>
          </div>

          {/* Character count */}
          {charCount > 0 && (
            <span className={`text-[10px] font-mono tabular-nums transition-colors ${
              isOverLimit
                ? 'text-red-500 font-bold'
                : isNearLimit
                ? 'text-amber-500 font-bold'
                : 'text-gray-400'
            }`}>
              {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        {/* Brand disclaimer */}
        <p className="text-[10px] text-gray-400 text-center mt-1">
          Deebug teaches concepts only — it guides you without giving full code solutions.
        </p>
      </div>
    </div>
  );
}
