"use client";

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css'; // Import KaTeX CSS

interface MathViewProps extends NodeViewProps {
  node: NodeViewProps['node'] & {
    attrs: {
      content: string;
    };
  };
}

const MathComponent = ({ node, updateAttributes, deleteNode }: MathViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [latex, setLatex] = useState(node.attrs.content || '');
  const isBlock = node.type.name === 'mathBlock';

  const handleSave = () => {
    updateAttributes({ content: latex });
    setIsEditing(false);
  };

  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setLatex(node.attrs.content || ''); // Revert changes
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <NodeViewWrapper className={isBlock ? 'my-4' : 'inline-block'}>
        <textarea
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onBlur={handleSave}
          onKeyDown={onTextareaKeyDown}
          autoFocus
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-800 focus:outline-blue-500 font-mono"
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer p-2 rounded transition-colors ${isBlock ? 'block text-center my-4 hover:bg-gray-100 dark:hover:bg-gray-800' : 'inline-block hover:bg-gray-200 dark:hover:bg-gray-700'}`}
    >
      {isBlock ? (
        <BlockMath math={latex || 'E = mc^2'} />
      ) : (
        <InlineMath math={latex || '\\int_0^\\infty x^2 dx'} />
      )}
    </NodeViewWrapper>
  );
};

export default MathComponent;
