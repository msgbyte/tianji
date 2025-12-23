import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { AIChatbot } from '@/components/ai/AIChatbot';
import { useHtmlEditorAIChat } from '@/hooks/useHtmlEditorAIChat';
import { Button } from '@/components/ui/button';
import { LuX } from 'react-icons/lu';

export interface SelectedElementInfo {
  tagName: string;
  className: string;
  id: string;
  lineStart: string;
  lineEnd: string;
  textContent: string;
  outerHTML: string;
}

interface HtmlEditorAIChatPanelProps {
  workspaceId: string;
  currentHtmlCode: string | null;
  selectedElement: SelectedElementInfo | null;
  onHtmlGenerated?: (html: string) => void;
  onClearSelectedElement?: () => void;
}

export const HtmlEditorAIChatPanel: React.FC<HtmlEditorAIChatPanelProps> =
  React.memo((props) => {
    const { t } = useTranslation();

    const {
      messages,
      status,
      input,
      setInput,
      usage,
      addToolResult,
      handleReset,
      handleSend,
      handleRegenerate,
      handleSuggestionClick,
    } = useHtmlEditorAIChat({
      workspaceId: props.workspaceId,
      currentHtmlCode: props.currentHtmlCode,
      selectedElement: props.selectedElement,
      onHtmlGenerated: props.onHtmlGenerated,
      onSelectionCleared: props.onClearSelectedElement,
    });

    const suggestions = [
      t('Create a responsive login page'),
      t('Add a navigation bar'),
      t('Optimize current code for accessibility'),
      t('Add mobile adaptation'),
    ];

    return (
      <div className="flex h-full flex-col">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">{t('AI Assistant')}</h3>
          <p className="text-muted-foreground text-xs">
            {t('AI-powered HTML code generation')}
          </p>
        </div>

        <AIChatbot
          className="flex-1 overflow-hidden"
          messages={messages}
          status={status}
          input={input}
          setInput={setInput}
          usage={usage}
          suggestions={suggestions}
          selectedContext={
            props.selectedElement ? (
              <div className="bg-muted mb-2 rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {t('Selected Element')}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={props.onClearSelectedElement}
                  >
                    <LuX className="size-3" />
                  </Button>
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-muted-foreground">{t('Tag')}:</span>{' '}
                    <code className="bg-background rounded px-1">
                      {props.selectedElement.tagName.toLowerCase()}
                    </code>
                  </div>
                  {props.selectedElement.id && (
                    <div>
                      <span className="text-muted-foreground">{t('ID')}:</span>{' '}
                      <code className="bg-background rounded px-1">
                        #{props.selectedElement.id}
                      </code>
                    </div>
                  )}
                  {props.selectedElement.className && (
                    <div>
                      <span className="text-muted-foreground">
                        {t('Class')}:
                      </span>{' '}
                      <code className="bg-background rounded px-1">
                        {props.selectedElement.className}
                      </code>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t('Lines')}:</span>{' '}
                    <code className="bg-background rounded px-1">
                      {props.selectedElement.lineStart}-
                      {props.selectedElement.lineEnd}
                    </code>
                  </div>
                </div>
              </div>
            ) : undefined
          }
          onAddToolResult={addToolResult}
          onSubmit={handleSend}
          onReset={handleReset}
          onRegenerate={handleRegenerate}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>
    );
  });
HtmlEditorAIChatPanel.displayName = 'HtmlEditorAIChatPanel';
