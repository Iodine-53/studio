
import { type TiptapNode } from '@/lib/db';

export const tiptapJsonToText = (node: TiptapNode): string => {
  if (node.type === 'text' && node.text) {
    return node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(tiptapJsonToText).join(' ');
  }
  return '';
};
