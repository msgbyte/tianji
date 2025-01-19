import { getOpenAIClient } from '../../openai.js';
import { PromptToolDefinition } from './tools.js';

interface AIToolsSelectionOptions {
  systemPrompt: string;
  question: string;
  functions: PromptToolDefinition[];
}
export async function aiToolsSelection(options: AIToolsSelectionOptions) {
  const chatCompletion = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: options.systemPrompt,
      },
      {
        role: 'user',
        content: options.question,
      },
    ],
    tools: options.functions.map((func) => ({
      type: 'function',
      function: func,
    })),
    tool_choice: 'required',
    stream: false,
  });

  const calls = chatCompletion.choices[0].message.tool_calls;

  if (!calls) {
    return null;
  }

  const selectedFunction = calls[0].function;

  try {
    return {
      name: selectedFunction.name,
      arguments: JSON.parse(selectedFunction.arguments) satisfies Record<
        string,
        any
      >,
    };
  } catch {
    return null;
  }
}
