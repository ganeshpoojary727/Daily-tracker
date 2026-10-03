import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  X,
  Terminal,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCode,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { executeJavaCode, JavaExecutionResult } from '../../lib/pistonApi';
import { JAVA_TEMPLATES, JavaTemplate } from '../../data/javaTemplates';

interface JavaPlaygroundPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_CODE = 'dt_java_scratchpad_code';
const STORAGE_KEY_STDIN = 'dt_java_scratchpad_stdin';

const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java Playground!");
        
        // Quick experiment:
        int sum = 0;
        for (int i = 1; i <= 5; i++) {
            sum += i;
        }
        System.out.println("Sum 1..5 = " + sum);
    }
}`;

export const JavaPlaygroundPanel: React.FC<JavaPlaygroundPanelProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_CODE) || DEFAULT_JAVA_CODE;
  });
  const [stdin, setStdin] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_STDIN) || '';
  });

  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<JavaExecutionResult | null>(null);
  const [showStdin, setShowStdin] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scrolling between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Persist code and stdin on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CODE, code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STDIN, stdin);
  }, [stdin]);

  // Keyboard shortcut Ctrl + Enter to run code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, code, stdin, isRunning]);

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setExecutionResult(null);

    const result = await executeJavaCode(code, stdin);
    setExecutionResult(result);
    setIsRunning(false);
  };

  const handleSelectTemplate = (template: JavaTemplate) => {
    setSelectedTemplateId(template.id);
    setCode(template.code);
    if (template.defaultStdin) {
      setStdin(template.defaultStdin);
      setShowStdin(true);
    }
    setExecutionResult(null);
  };

  const handleReset = () => {
    setCode(DEFAULT_JAVA_CODE);
    setStdin('');
    setSelectedTemplateId('default');
    setExecutionResult(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Tab key inside editor for indentation
  const handleKeyDownEditor = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const nextCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(nextCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Calculate line numbers
  const linesCount = Math.max(code.split('\n').length, 1);
  const lineNumbersArray = Array.from({ length: linesCount }, (_, i) => i + 1);

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-surface-border-dark bg-surface-dark/95 shadow-2xl backdrop-blur-xl sm:w-[460px] md:w-[500px] lg:w-[520px] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border-dark px-4 py-3 bg-surface-dark">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-text-primary-dark">Java Compiler</h3>
              <span className="rounded bg-surface-border-dark/60 px-1.5 py-0.2 font-mono text-[9px] text-emerald-400 border border-emerald-500/30">
                OpenJDK 21
              </span>
            </div>
            <p className="text-[10px] text-text-muted-dark">Run and test code while watching</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="hidden sm:inline-block rounded px-1.5 py-0.5 font-mono text-[10px] text-text-muted-dark bg-surface-border-dark/40">
            Ctrl + \
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark transition-colors"
            title="Close Playground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-border-dark/60 bg-bg-dark/40 px-3 py-2 text-xs">
        {/* Template Selector */}
        <div className="flex items-center gap-1.5">
          <FileCode className="h-3.5 w-3.5 text-text-muted-dark" />
          <select
            value={selectedTemplateId}
            onChange={(e) => {
              const tmpl = JAVA_TEMPLATES.find((t) => t.id === e.target.value);
              if (tmpl) handleSelectTemplate(tmpl);
            }}
            className="rounded border border-surface-border-dark bg-surface-dark px-2 py-1 text-[11px] text-text-primary-dark focus:border-emerald-500 focus:outline-none"
          >
            <option value="default" disabled>
              Select Starter Template...
            </option>
            {JAVA_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                {tmpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              showStdin || stdin.trim()
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                : 'text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark'
            }`}
            title="Toggle user input console (stdin)"
          >
            <span>Stdin</span>
            {showStdin ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <button
            onClick={handleCopy}
            className="rounded p-1 text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark"
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={handleReset}
            className="rounded p-1 text-text-muted-dark hover:bg-surface-border-dark hover:text-text-primary-dark"
            title="Reset code to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Stdin Drawer (collapsible) */}
      {showStdin && (
        <div className="border-b border-surface-border-dark/60 bg-amber-500/5 p-2.5">
          <div className="flex items-center justify-between text-[11px] text-amber-400 font-semibold mb-1">
            <span>Program Input (stdin for Scanner / BufferedReader):</span>
            <button onClick={() => setStdin('')} className="text-[10px] text-text-muted-dark hover:text-amber-400">
              Clear
            </button>
          </div>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Type input values here, separated by newlines..."
            rows={2}
            className="w-full rounded border border-surface-border-dark bg-surface-dark px-2 py-1 font-mono text-xs text-text-primary-dark placeholder-text-muted-dark/40 focus:border-amber-500 focus:outline-none"
          />
        </div>
      )}

      {/* Code Editor Container */}
      <div className="relative flex flex-1 overflow-hidden bg-[#0d1117] font-mono text-xs">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          className="select-none overflow-hidden border-r border-surface-border-dark/40 bg-[#0d1117]/80 px-2 py-3 text-right font-mono text-[11px] text-text-muted-dark/40"
          style={{ width: '42px' }}
        >
          {lineNumbersArray.map((n) => (
            <div key={n} className="leading-5">
              {n}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDownEditor}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-3 font-mono text-xs leading-5 text-gray-200 caret-emerald-400 focus:outline-none overflow-y-auto whitespace-pre tab-4"
          placeholder="public class Main { ... }"
        />
      </div>

      {/* Action / Execution Bar */}
      <div className="flex items-center justify-between border-t border-surface-border-dark bg-surface-dark px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-text-muted-dark">
          <span className="font-mono text-[11px]">
            {linesCount} {linesCount === 1 ? 'line' : 'lines'}
          </span>
          {executionResult?.executionTimeMs !== undefined && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-text-muted-dark">
              <Clock className="h-3 w-3" />
              <span>{executionResult.executionTimeMs}ms</span>
            </span>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 font-display text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
          title="Compile and run with OpenJDK (Ctrl + Enter)"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Compiling...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Code</span>
              <span className="ml-1 text-[10px] opacity-75 font-mono">↵</span>
            </>
          )}
        </button>
      </div>

      {/* Terminal Output Console */}
      <div className="flex flex-col border-t border-surface-border-dark bg-[#0a0d12] max-h-56 min-h-36">
        <div className="flex items-center justify-between border-b border-surface-border-dark/40 px-3 py-1.5 text-[11px] font-mono text-text-muted-dark">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-3 w-3 text-emerald-400" />
            <span className="font-semibold uppercase tracking-wider text-text-primary-dark">Console Output</span>
          </div>

          <div className="flex items-center gap-2">
            {executionResult && (
              <span
                className={`flex items-center gap-1 font-mono text-[10px] font-bold ${
                  executionResult.success ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {executionResult.success ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertCircle className="h-3 w-3" />
                )}
                <span>Exit {executionResult.exitCode}</span>
              </span>
            )}

            {executionResult && (
              <button
                onClick={() => setExecutionResult(null)}
                className="text-[10px] text-text-muted-dark hover:text-text-primary-dark"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Console Text Window */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed select-text">
          {isRunning ? (
            <div className="flex items-center gap-2 text-text-muted-dark animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
              <span>Sending code to OpenJDK compiler sandbox...</span>
            </div>
          ) : !executionResult ? (
            <div className="text-text-muted-dark/50 italic text-[11px]">
              Ready. Click "Run Code" or press Ctrl+Enter to compile.
            </div>
          ) : (
            <div className="space-y-1">
              {/* Stdout */}
              {executionResult.stdout && (
                <pre className="text-emerald-300 whitespace-pre-wrap font-mono">{executionResult.stdout}</pre>
              )}

              {/* Stderr or compiler error */}
              {executionResult.stderr && (
                <pre className="text-rose-400 whitespace-pre-wrap font-mono">{executionResult.stderr}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
