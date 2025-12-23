import {
  tool,
  ToolSet,
  streamText,
  convertToModelMessages,
  UIMessage,
  stepCountIs,
  LanguageModel,
} from 'ai';
import z from 'zod';

export const createHtmlEditorAITools = (): ToolSet => {
  return {
    generateHtml: tool({
      description:
        'Generate complete HTML code based on user requirements. Use this when creating new HTML content from scratch.',
      inputSchema: z.object({
        html: z
          .string()
          .describe(
            'The complete HTML document to generate. Should include DOCTYPE, html, head, and body tags with appropriate meta tags and styling.'
          ),
        description: z
          .string()
          .describe('Brief description of what was created'),
      }),
    }),
    modifyHtml: tool({
      description:
        'Modify existing HTML code based on user requirements. Use this when updating or changing current HTML content.',
      inputSchema: z.object({
        html: z
          .string()
          .describe(
            'The modified HTML code. Should maintain the original structure unless explicitly asked to change.'
          ),
        changes: z
          .string()
          .describe(
            'Summary of changes made, explaining what was modified, added, or removed'
          ),
      }),
    }),
    explainCode: tool({
      description:
        'Explain HTML/CSS/JavaScript code to help users understand what the code does.',
      inputSchema: z.object({
        explanation: z
          .string()
          .describe(
            'Clear explanation of the code, including purpose, structure, and key features'
          ),
      }),
    }),
  };
};

export const htmlEditorAISystemPrompt = () => {
  return `You are an expert HTML/CSS/JavaScript developer assistant.
Help users create and modify web pages by generating clean, semantic HTML.

## Guidelines

- Generate modern, responsive HTML with inline CSS or style tags
- Use semantic HTML5 elements (header, nav, main, section, article, footer, etc.)
- Ensure accessibility (ARIA labels, alt text for images, proper heading hierarchy)
- Include meta tags for proper rendering (viewport, charset)
- When modifying code, preserve existing structure unless explicitly asked to change
- Use modern CSS features (flexbox, grid) for layouts
- Ensure mobile responsiveness with appropriate media queries
- Write clean, readable code with proper indentation
- Add helpful comments for complex sections

## Tool Usage

- Use \`generateHtml\` when creating completely new HTML content
- Use \`modifyHtml\` when updating existing HTML code
- Use \`explainCode\` when asked to explain how code works
- Always include a description or summary of changes

## Best Practices

- Keep HTML structure clean and semantic
- Use external stylesheets or style tags, avoid excessive inline styles
- Ensure proper document structure with DOCTYPE and meta tags
- Make content accessible and SEO-friendly
- Test responsiveness for different screen sizes
`;
};

/**
 * Create a streaming text response for HTML editor AI chat
 */
export function createHtmlEditorAIStream({
  model,
  inputMessages = [],
  messages,
  aiTools,
}: {
  model: LanguageModel;
  inputMessages: Parameters<typeof streamText>[0]['messages'];
  messages: Array<Omit<UIMessage, 'id'>>;
  aiTools: ToolSet;
}) {
  return streamText({
    model,
    messages: [...inputMessages, ...convertToModelMessages(messages)],
    stopWhen: stepCountIs(5),
    tools: aiTools,
  });
}
