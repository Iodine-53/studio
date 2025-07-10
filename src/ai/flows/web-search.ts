
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchInputSchema = z.string().describe('The search query.');

// This is a placeholder tool. It will not function until a proper
// search provider (like Tavily) is configured.
export const searchTheWebTool = ai.defineTool(
  {
    name: 'searchTheWeb',
    description: 'Searches the web for up-to-date information on a given topic. Use this for recent events or when you need current data.',
    input: { schema: SearchInputSchema },
    output: { schema: z.string() },
  },
  async (query) => {
    // In a real implementation, you would use an API client like Tavily here.
    // For now, we return a message indicating the tool is not configured.
    console.warn(`Web search tool was called with query: "${query}", but it is not configured.`);
    return 'Web search is not available in this demo environment.';
  }
);
