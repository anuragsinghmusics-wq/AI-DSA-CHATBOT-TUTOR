'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, ChevronDown, ChevronUp, Terminal, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { runCode } from '@/lib/api';

// Maps our frontend language ID → LeetCode's langSlug for code snippets
const LC_SLUG_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python3',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  go: 'golang',
  rust: 'rust',
  kotlin: 'kotlin',
  swift: 'swift',
  ruby: 'ruby',
};

const LANGUAGES = [
  { id: 'cpp',        name: 'C++' },
  { id: 'java',       name: 'Java' },
  { id: 'python',     name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'c',         name: 'C' },
  { id: 'csharp',    name: 'C#' },
  { id: 'go',        name: 'Go' },
  { id: 'rust',      name: 'Rust' },
  { id: 'kotlin',    name: 'Kotlin' },
  { id: 'swift',     name: 'Swift' },
  { id: 'ruby',      name: 'Ruby' },
];

const DEFAULT_CODE = '// Select a problem to load the starter code\n';

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  codeSnippets?: Record<string, string>;
  exampleTestcases?: string;
}

export function CodeEditor({
  code,
  onChange,
  language,
  onLanguageChange,
  codeSnippets,
  exampleTestcases,
}: CodeEditorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);

  // Auto-fill stdin from example test cases when problem changes
  useEffect(() => {
    if (exampleTestcases) {
      setStdin(exampleTestcases);
    }
  }, [exampleTestcases]);

  const handleRun = async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setShowOutput(true);
    setRunResult(null);
    try {
      const result = await runCode(code, language, stdin);
      setRunResult(result);
    } catch (err) {
      setRunResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Execution failed',
        exitCode: -1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const isSuccess = runResult !== null && runResult.exitCode === 0 && !runResult.stderr;

  return (
    <div className="h-full flex flex-col bg-white border-x border-gray-200">
      {/* Toolbar */}
      <div className="px-4 py-2 bg-white border-b border-gray-200 flex justify-between items-center z-10 gap-3 shadow-xs">
        <span className="text-xs font-bold text-gray-800 tracking-wider uppercase flex-shrink-0">
          Code Editor
        </span>

        <div className="flex gap-2 items-center ml-auto">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-white text-xs text-gray-700 font-medium border border-gray-200 focus:outline-none focus:border-brand-500 cursor-pointer hover:bg-gray-50 transition-colors shadow-xs"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>

          {/* Stdin toggle */}
          <button
            onClick={() => setShowStdin((v) => !v)}
            title="Toggle test input"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <Terminal className="w-3 h-3 text-gray-500" />
            Input
            {showStdin ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all duration-150 shadow-sm shadow-brand-500/25 active:scale-95"
          >
            {isRunning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-white" />
            )}
            {isRunning ? 'Running…' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Stdin Panel */}
      {showStdin && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex flex-col gap-1.5 animate-fade-in">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Test Input (stdin)
          </span>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter test input here..."
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-500 resize-none scrollbar-thin shadow-xs"
          />
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0 relative bg-white">
        <Editor
          height="100%"
          language={language}
          theme="vs"
          value={code}
          onChange={onChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 22,
            padding: { top: 14, bottom: 14 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          }}
        />
      </div>

      {/* Output Panel */}
      {showOutput && (
        <div className="border-t border-gray-200 bg-white flex flex-col animate-fade-in shadow-md" style={{ maxHeight: '40%' }}>
          {/* Output header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Output</span>
              {!isRunning && runResult && (
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {isSuccess ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                  {isSuccess ? 'Accepted' : `Exit code ${runResult.exitCode}`}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowOutput(false)}
              className="text-gray-400 hover:text-gray-600 text-xs transition-colors p-1"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto scrollbar-thin px-4 py-3 flex-1 font-mono text-xs space-y-3 bg-white">
            {isRunning ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                <span>Executing your code…</span>
              </div>
            ) : runResult ? (
              <>
                {runResult.stdout && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">stdout</span>
                    <pre className="text-gray-800 bg-slate-50 border border-slate-200 p-3 rounded-lg whitespace-pre-wrap break-all leading-relaxed font-mono">{runResult.stdout}</pre>
                  </div>
                )}
                {runResult.stderr && (
                  <div>
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest block mb-1">stderr</span>
                    <pre className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg whitespace-pre-wrap break-all leading-relaxed font-mono">{runResult.stderr}</pre>
                  </div>
                )}
                {!runResult.stdout && !runResult.stderr && (
                  <span className="text-gray-400">(no output)</span>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

/** Returns the correct starter snippet for a given language, or a default */
export function getStarterCode(codeSnippets: Record<string, string> | undefined, language: string): string {
  if (!codeSnippets) return DEFAULT_CODE;
  const slug = LC_SLUG_MAP[language] || language;
  return codeSnippets[slug] || DEFAULT_CODE;
}
