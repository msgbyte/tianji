import { useRef, useCallback, useEffect } from 'react';
import type { editor as MonacoEditor, IRange } from 'monaco-editor';

export interface HighlightOptions {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  scrollToLine?: boolean;
}

const DEFAULT_HIGHLIGHT_OPTIONS: Required<HighlightOptions> = {
  backgroundColor: 'rgba(59, 130, 246, 0.15)',
  borderColor: '#3b82f6',
  borderWidth: 3,
  scrollToLine: true,
};

/**
 * Inject CSS styles for editor line highlighting
 * Call this once when the editor is mounted
 */
export function injectEditorHighlightStyles(
  options: HighlightOptions = {}
): void {
  const styleId = 'monaco-editor-highlight-styles';

  // Check if already injected
  if (document.getElementById(styleId)) {
    return;
  }

  const opts = { ...DEFAULT_HIGHLIGHT_OPTIONS, ...options };

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .highlighted-line {
      background-color: ${opts.backgroundColor} !important;
      border-left: ${opts.borderWidth}px solid ${opts.borderColor} !important;
    }
    .highlighted-glyph {
      background-color: ${opts.borderColor} !important;
      width: ${opts.borderWidth}px !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Create highlight decorations for specific lines in Monaco editor
 */
export function createLineHighlight(
  editor: MonacoEditor.IStandaloneCodeEditor,
  monaco: typeof import('monaco-editor'),
  startLine: number,
  endLine: number,
  options: HighlightOptions = {}
): MonacoEditor.IEditorDecorationsCollection {
  const opts = { ...DEFAULT_HIGHLIGHT_OPTIONS, ...options };

  const decorations = editor.createDecorationsCollection([
    {
      range: new monaco.Range(startLine, 1, endLine, 1),
      options: {
        isWholeLine: true,
        className: 'highlighted-line',
        glyphMarginClassName: 'highlighted-glyph',
      },
    },
  ]);

  // Scroll to the highlighted line if enabled
  if (opts.scrollToLine) {
    editor.revealLineInCenter(startLine);
  }

  return decorations;
}

/**
 * Hook to manage editor line highlighting
 * Returns functions to highlight and clear highlights
 */
export function useEditorHighlight(
  editorRef: React.RefObject<MonacoEditor.IStandaloneCodeEditor | null>,
  monacoRef: React.RefObject<typeof import('monaco-editor') | null>,
  options: HighlightOptions = {}
) {
  const decorationsRef = useRef<
    MonacoEditor.IEditorDecorationsCollection | undefined
  >(undefined);

  // Inject styles on mount
  useEffect(() => {
    injectEditorHighlightStyles(options);
  }, []);

  const highlightLines = useCallback(
    (startLine: number, endLine: number) => {
      if (!editorRef.current || !monacoRef.current) {
        return;
      }

      // Clear previous decorations
      if (decorationsRef.current) {
        decorationsRef.current.clear();
      }

      // Create new decorations
      decorationsRef.current = createLineHighlight(
        editorRef.current,
        monacoRef.current,
        startLine,
        endLine,
        options
      );
    },
    [editorRef, monacoRef, options]
  );

  const clearHighlight = useCallback(() => {
    if (decorationsRef.current) {
      decorationsRef.current.clear();
      decorationsRef.current = undefined;
    }
  }, []);

  return {
    highlightLines,
    clearHighlight,
  };
}
