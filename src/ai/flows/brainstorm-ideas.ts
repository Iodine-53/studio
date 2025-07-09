
'use server';

/**
 * @fileOverview This file defines a Genkit flow for a general chat interaction with history.
 *
 * - brainstormIdeas - A function that takes a conversation history and returns a text response.
 * - BrainstormIdeasInput - The input type for the function.
 * - BrainstormIdeasOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const BrainstormIdeasInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  apiKey: z.string().optional().describe('Optional API key for Gemini.'),
  documentContext: z.string().optional().describe('Optional text content of the document being edited.'),
});
export type BrainstormIdeasInput = z.infer<typeof BrainstormIdeasInputSchema>;

const BrainstormIdeasOutputSchema = z.object({
  response: z.string().describe('The AI response to the prompt.'),
});
export type BrainstormIdeasOutput = z.infer<typeof BrainstormIdeasOutputSchema>;

export async function brainstormIdeas(input: BrainstormIdeasInput): Promise<BrainstormIdeasOutput> {
  return brainstormIdeasFlow(input);
}

const brainstormIdeasFlow = ai.defineFlow(
  {
    name: 'brainstormIdeasFlow',
    inputSchema: BrainstormIdeasInputSchema,
    outputSchema: BrainstormIdeasOutputSchema,
  },
  async ({ history, apiKey, documentContext }) => {
    if (!apiKey) {
      throw new Error("A Gemini API key is required. Please set it in the settings.");
    }
    const runner = genkit({ plugins: [googleAI({ apiKey })] });
    
    if (history.length === 0) {
        throw new Error("Cannot generate response for an empty history.");
    }

    let systemPrompt = "You are a helpful AI assistant for brainstorming and creative writing.";
    if (documentContext) {
        systemPrompt = `You are an expert writing assistant. The user is currently working on a document. You will be provided with the document's content as a JSON object, following the Tiptap editor's format. Use this document structure as the primary context to answer their questions.

The document is composed of a \`content\` array of nodes. Each node has a \`type\`.

Here are the important node types and their attributes (\`attrs\`):
- 'paragraph': Contains 'content' with text.
- 'heading': Contains 'content' with text and 'attrs.level'.
- 'image': Represents an image. Use its 'attrs.caption' to understand its content. The 'src' is a data URI and should be ignored.
- 'interactiveTable': Represents a table. Its 'attrs.title', 'attrs.headers' (a JSON string of an array), and 'attrs.data' (a JSON string of a 2D array) describe the table.
- 'chartBlock': Represents a chart. Its 'attrs.title', 'attrs.chartType', and 'attrs.chartData' (a JSON string of data points) describe the chart.
- 'progressBarBlock': Represents a set of progress bars. Its 'attrs.title' and 'attrs.items' (an array of objects with 'label', 'value', 'color') describe the content.
- 'todoList': A list of tasks with a 'title' and an array of 'tasks' (objects with 'text' and 'completed' status).
- 'accordion': A series of collapsible items. Look at 'attrs.title', 'attrs.subtitle', and the 'attrs.items' array (objects with 'title' and 'content').

Analyze this JSON structure to understand the full document, including text, tables, charts, and other elements, to provide a comprehensive answer to the user's question.

## Document JSON
${documentContext}
## End of Document JSON`;
    }

    const lastMessage = history[history.length - 1];
    const historyForModel = history.slice(0, -1);

    const response = await runner.generate({
        model: 'googleai/gemini-1.5-flash-latest',
        system: systemPrompt,
        prompt: lastMessage.content,
        history: historyForModel,
    });

    const textResponse = response.text;
    if (!textResponse) {
        throw new Error("AI generation failed. The model returned no content.");
    }

    return { response: textResponse };
  }
);
