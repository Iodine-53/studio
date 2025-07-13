
"use client";

import { useState, type FC, type KeyboardEvent } from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
};

export const TagInput: FC<TagInputProps> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border p-2 bg-background focus-within:ring-2 focus-within:ring-ring">
      <TagIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      {value.map(tag => (
        <Badge key={tag} variant="secondary" className="text-sm">
          {tag}
          <button onClick={() => removeTag(tag)} className="ml-1.5 rounded-full hover:bg-destructive/20 p-0.5 transition-colors">
            <X size={12} />
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a tag..."
        className="flex-1 bg-transparent p-1 text-sm h-auto border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[80px]"
      />
    </div>
  );
};
