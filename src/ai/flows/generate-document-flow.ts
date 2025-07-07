
'use server';
/**
 * @fileOverview A Genkit flow for generating structured document content from a single prompt.
 *
 * - generateDocument - A function that takes a prompt and returns an array of structured blocks.
 * - GenerateDocumentInput - The input type for the generateDocument function.
 * - GenerateDocumentOutput - The return type for the generateDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Schemas for individual block types
const HeadingBlockSchema = z.object({
  type: z.string().describe("The type of content block. For a heading, this MUST be the exact string 'heading'."),
  level: z.number().min(1).max(3).describe('The heading level, from 1 to 3.'),
  content: z.string().describe('The text content of the heading.'),
});

const ParagraphBlockSchema = z.object({
  type: z.string().describe("The type of content block. For a paragraph, this MUST be the exact string 'paragraph'."),
  content: z.string().describe('The text content of the paragraph. Can include multiple sentences.'),
});

const ListBlockSchema = z.object({
  type: z.enum(['bulletList', 'orderedList']).describe("The type of list. Can be 'bulletList' or 'orderedList'."),
  items: z.array(z.string()).describe('An array of strings, where each string is an item in the list.'),
});

// Union of all possible blocks
const DocumentBlockSchema = z.union([
  HeadingBlockSchema,
  ParagraphBlockSchema,
  ListBlockSchema,
]);

const GenerateDocumentInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for document content.'),
});
export type GenerateDocumentInput = z.infer<typeof GenerateDocumentInputSchema>;

const GenerateDocumentOutputSchema = z.object({
  blocks: z.array(DocumentBlockSchema).describe('An array of content blocks that make up the document.'),
});
export type GenerateDocumentOutput = z.infer<typeof GenerateDocumentOutputSchema>;


export async function generateDocument(input: GenerateDocumentInput): Promise<GenerateDocumentOutput> {
  return generateDocumentFlow(input);
}


const generateDocumentPrompt = ai.definePrompt({
    name: 'generateDocumentPrompt',
    input: { schema: GenerateDocumentInputSchema },
    output: { schema: GenerateDocumentOutputSchema },
    prompt: `You are an expert document creation assistant. Based on the user's prompt, generate a sequence of content blocks to build a document.

You can create headings (levels 1-3), paragraphs, bulleted lists, and ordered lists.

Analyze the user's request and structure your response as an array of block objects.

For example, if the user asks for "a title about dogs, a paragraph, and then a list of dog breeds", you should generate a heading, a paragraph, and a list block.

Prompt: {{{prompt}}}
`,
});

const generateDocumentFlow = ai.defineFlow(
  {
    name: 'generateDocumentFlow',
    inputSchema: GenerateDocumentInputSchema,
    outputSchema: GenerateDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await generateDocumentPrompt(input);
    if (!output || !output.blocks || output.blocks.length === 0) {
      // This allows the frontend to catch the error and display a message.
      throw new Error('AI generation failed. The model returned no content. Please try rephrasing your prompt.');
    }
    return output;
  }
);
