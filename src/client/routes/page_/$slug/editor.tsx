import React, { useState, useRef, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '@/api/trpc';
import { useLocalStorageState, useDebounce } from 'ahooks';
import { CommonWrapper } from '@/components/CommonWrapper';
import { HtmlEditor, HtmlEditorRef } from '@/components/CodeEditor';
import { Allotment } from 'allotment';
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
} from '@/components/ai-elements/web-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  LuMousePointer2,
  LuColumns2,
  LuPanelTop,
  LuSparkles,
  LuSave,
} from 'react-icons/lu';
import { cn } from '@/utils/style';
import { HtmlEditorAIChatPanel } from '@/components/page/HtmlEditorAIChatPanel';
import { useCurrentWorkspaceId } from '@/store/user';
import { ErrorTip } from '@/components/ErrorTip';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';
import { Separator } from '@/components/ui/separator';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useEvent } from '@/hooks/useEvent';

import 'allotment/dist/style.css';

export const Route = createFileRoute('/page/$slug/editor')({
  component: PageComponent,
});

type LayoutMode = 'split' | 'tabs';

function PageComponent() {
  const workspaceId = useCurrentWorkspaceId();
  const { slug } = Route.useParams();
  const { data: pageInfo } = trpc.page.getPageInfo.useQuery(
    { slug },
    {
      refetchOnWindowFocus: false,
    }
  );
  const editPage = trpc.page.editPage.useMutation();
  const [htmlCode, setHtmlCode] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (pageInfo && pageInfo.type === 'static' && pageInfo.payload?.html) {
      setHtmlCode(pageInfo.payload.html);
    }
  }, [pageInfo, setHtmlCode]);

  const [layoutMode, setLayoutMode] = useLocalStorageState<LayoutMode>(
    'tianji-html-editor-layout',
    {
      defaultValue: 'split',
    }
  );
  const [aiPanelVisible, setAiPanelVisible] = useLocalStorageState(
    'tianji-html-editor-ai-panel',
    {
      defaultValue: false,
    }
  );
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{
    tagName: string;
    className: string;
    id: string;
    lineStart: string;
    lineEnd: string;
    textContent: string;
    outerHTML: string;
  } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorRef = useRef<HtmlEditorRef>(null);

  // Inject line numbers into HTML for accurate element tracking
  const injectLineNumbers = React.useCallback((htmlSource: string): string => {
    const lines = htmlSource.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Match opening tags (exclude closing tags, comments, doctype)
      const tagMatch = line.match(/<(\w+)(\s[^>]*?)?(\s*\/)?>/);

      if (
        tagMatch &&
        !line.trim().startsWith('</') &&
        !line.trim().startsWith('<!--') &&
        !line.trim().startsWith('<!DOCTYPE')
      ) {
        const tagName = tagMatch[1];
        const attributes = tagMatch[2] || '';
        const isSelfClosing = tagMatch[3];

        // Skip non-body tags
        const skipTags = ['meta', 'link', 'script', 'style', 'title'];
        if (skipTags.includes(tagName.toLowerCase())) {
          result.push(line);
          continue;
        }

        // Find closing tag for non-self-closing elements
        let endLine = lineNum;
        if (!isSelfClosing) {
          const closingTag = `</${tagName}>`;
          for (let j = i; j < lines.length; j++) {
            if (lines[j].includes(closingTag)) {
              endLine = j + 1;
              break;
            }
          }
        }

        // Inject data attributes
        const injected = line.replace(
          `<${tagName}${attributes}${isSelfClosing || ''}>`,
          `<${tagName}${attributes} data-line-start="${lineNum}" data-line-end="${endLine}"${isSelfClosing || ''}>`
        );
        result.push(injected);
      } else {
        result.push(line);
      }
    }

    return result.join('\n');
  }, []);

  // Use debounced value and inject line numbers for preview
  const debouncedHtmlCode = useDebounce(htmlCode, { wait: 500 });
  const processedHtmlCode = React.useMemo(() => {
    return injectLineNumbers(debouncedHtmlCode);
  }, [debouncedHtmlCode, injectLineNumbers]);

  // Clear highlight when code changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.clearHighlight();
    }
  }, [htmlCode]);

  // Clear highlight when exiting select mode
  useEffect(() => {
    if (!isSelectMode && editorRef.current) {
      editorRef.current.clearHighlight();
    }
  }, [isSelectMode]);

  const handleSave = useEvent(async () => {
    if (!pageInfo?.id) {
      return;
    }

    try {
      await editPage.mutateAsync({
        id: pageInfo.id,
        workspaceId: pageInfo.workspaceId,
        payload: {
          html: htmlCode,
        },
      });
      toast.success('Saved successfully');
    } catch (e: any) {
      toast.error(e.message);
    }
  });

  // Handle element selection in iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isSelectMode) {
      return;
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      return;
    }

    // Inject styles for highlighting
    const styleId = 'element-selector-style';
    let styleEl = iframeDoc.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = iframeDoc.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = `
        .tianji-element-hover {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
          cursor: pointer !important;
          background-color: rgba(59, 130, 246, 0.1) !important;
        }
      `;
      iframeDoc.head.appendChild(styleEl);
    }

    let hoveredElement: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      e.stopPropagation();
      const target = e.target as HTMLElement;

      // Remove previous highlight
      if (hoveredElement && hoveredElement !== target) {
        hoveredElement.classList.remove('tianji-element-hover');
      }

      // Add highlight to current element
      target.classList.add('tianji-element-hover');
      hoveredElement = target;

      // Highlight corresponding code in editor using injected line numbers
      const startLine = target.getAttribute('data-line-start');
      const endLine = target.getAttribute('data-line-end');

      if (startLine && endLine && editorRef.current) {
        editorRef.current.highlightLines(
          parseInt(startLine, 10),
          parseInt(endLine, 10)
        );
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      target.classList.remove('tianji-element-hover');

      // Clear editor highlight
      if (editorRef.current) {
        editorRef.current.clearHighlight();
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;

      const elementInfo = {
        tagName: target.tagName,
        className: target.className.replace('tianji-element-hover', '').trim(),
        id: target.id,
        lineStart: target.getAttribute('data-line-start') || '',
        lineEnd: target.getAttribute('data-line-end') || '',
        textContent: target.textContent?.substring(0, 100) || '',
        outerHTML: target.outerHTML.substring(0, 300),
      };

      // Save selected element info
      setSelectedElement(elementInfo);

      // Log element information
      console.log('Selected Element:', elementInfo);

      // Clean up and exit select mode
      target.classList.remove('tianji-element-hover');
      setIsSelectMode(false);
    };

    // Add event listeners to all elements
    iframeDoc.body.addEventListener('mouseover', handleMouseOver, true);
    iframeDoc.body.addEventListener('mouseout', handleMouseOut, true);
    iframeDoc.body.addEventListener('click', handleClick, true);

    // Cleanup
    return () => {
      if (hoveredElement) {
        hoveredElement.classList.remove('tianji-element-hover');
      }
      iframeDoc.body.removeEventListener('mouseover', handleMouseOver, true);
      iframeDoc.body.removeEventListener('mouseout', handleMouseOut, true);
      iframeDoc.body.removeEventListener('click', handleClick, true);
    };
  }, [isSelectMode]);

  const handleToggleSelectMode = () => {
    setIsSelectMode((prev) => !prev);
  };

  const renderPreview = () => (
    <WebPreview>
      <WebPreviewNavigation>
        <WebPreviewNavigationButton
          onClick={handleToggleSelectMode}
          tooltip={
            isSelectMode
              ? 'Exit Select Mode (click an element)'
              : 'Select Element'
          }
          className={cn(isSelectMode && 'bg-primary text-primary-foreground')}
          size="icon"
          Icon={LuMousePointer2}
        />

        {isSelectMode && (
          <span className="text-muted-foreground text-xs">
            Click on an element to select it
          </span>
        )}
      </WebPreviewNavigation>
      <WebPreviewBody
        ref={iframeRef}
        className="h-full w-full border-0 bg-white"
        srcDoc={processedHtmlCode}
      />
    </WebPreview>
  );

  const renderEditor = () => (
    <HtmlEditor
      ref={editorRef}
      value={htmlCode}
      onChange={setHtmlCode}
      height="100%"
      onSave={handleSave}
    />
  );

  // Render toolbar buttons
  const renderToolbarButtons = () => (
    <div className="flex items-center gap-1">
      <SimpleTooltip content={t('Split Layout')}>
        <Button
          size="icon-sm"
          variant={layoutMode === 'split' ? 'default' : 'ghost'}
          onClick={() => setLayoutMode('split')}
        >
          <LuColumns2 className="size-4" />
        </Button>
      </SimpleTooltip>
      <SimpleTooltip content={t('Tab Layout')}>
        <Button
          size="icon-sm"
          variant={layoutMode === 'tabs' ? 'default' : 'ghost'}
          onClick={() => setLayoutMode('tabs')}
        >
          <LuPanelTop className="size-4" />
        </Button>
      </SimpleTooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <SimpleTooltip content={t('AI Assistant')}>
        <Button
          size="icon-sm"
          variant={aiPanelVisible ? 'default' : 'ghost'}
          onClick={() => setAiPanelVisible(!aiPanelVisible)}
        >
          <LuSparkles className="size-4" />
        </Button>
      </SimpleTooltip>

      <SimpleTooltip content={t('Save')}>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleSave}
          disabled={editPage.isPending}
        >
          <LuSave className="size-4" />
        </Button>
      </SimpleTooltip>
    </div>
  );

  // Render AI panel
  const renderAIPanel = () =>
    aiPanelVisible ? (
      <Allotment.Pane minSize={400} preferredSize={400} maxSize={600}>
        <HtmlEditorAIChatPanel
          workspaceId={workspaceId}
          currentHtmlCode={htmlCode ?? null}
          selectedElement={selectedElement}
          onHtmlGenerated={setHtmlCode}
          onClearSelectedElement={() => setSelectedElement(null)}
        />
      </Allotment.Pane>
    ) : null;

  // Render header with title and toolbar
  const renderHeader = (centerContent?: React.ReactNode) => (
    <div className="border-b px-4 py-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">HTML Editor</h1>

        {centerContent}

        <div className="flex items-center gap-3">{renderToolbarButtons()}</div>
      </div>
    </div>
  );

  // Render split layout mode
  const renderSplitLayout = () => (
    <>
      {renderHeader()}
      <Allotment>
        <Allotment.Pane className="h-full">{renderEditor()}</Allotment.Pane>
        <Allotment.Pane>{renderPreview()}</Allotment.Pane>
        {renderAIPanel()}
      </Allotment>
    </>
  );

  // Render tabs layout mode
  const renderTabsLayout = () => (
    <Tabs defaultValue="editor" className="flex h-full flex-col">
      {renderHeader(
        <TabsList>
          <TabsTrigger value="editor">{t('Editor')}</TabsTrigger>
          <TabsTrigger value="preview">{t('Preview')}</TabsTrigger>
        </TabsList>
      )}
      <Allotment>
        <Allotment.Pane>
          <TabsContent value="editor" className="mt-0 h-full">
            {renderEditor()}
          </TabsContent>
          <TabsContent value="preview" className="mt-0 h-full">
            {renderPreview()}
          </TabsContent>
        </Allotment.Pane>
        {renderAIPanel()}
      </Allotment>
    </Tabs>
  );

  if (pageInfo?.type !== 'static') {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper>
      <div className="bg-background flex h-screen flex-col overflow-hidden">
        {layoutMode === 'split' ? renderSplitLayout() : renderTabsLayout()}
      </div>
    </CommonWrapper>
  );
}

export default PageComponent;
