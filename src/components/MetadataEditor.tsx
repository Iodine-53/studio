
"use client";

import React, { FC, useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

type MetadataEditorProps = {
  initialMetadata: Record<string, string>;
  onUpdate: (newMetadata: Record<string, string>) => void;
};

const EditableField: FC<{
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onSave, placeholder, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(text);
    setIsEditing(false);
  };
  
  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="text"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setIsEditing(false);
        }}
        className={className}
      />
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className={className}>
      {value || <span className="text-muted-foreground italic">{placeholder}</span>}
    </div>
  );
};


export const MetadataEditor: FC<MetadataEditorProps> = ({ initialMetadata, onUpdate }) => {
  const [metadata, setMetadata] = useState(initialMetadata || {});
  
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const debouncedUpdate = useCallback(() => {
    const handler = setTimeout(() => {
      onUpdateRef.current(metadata);
    }, 1000);

    return () => clearTimeout(handler);
  }, [metadata]);
  
  useEffect(() => {
    const cleanup = debouncedUpdate();
    return cleanup;
  }, [metadata, debouncedUpdate]);


  const handleKeyChange = (oldKey: string, newKey: string) => {
    const trimmedNewKey = newKey.trim();
    if (!trimmedNewKey || (trimmedNewKey !== oldKey && metadata.hasOwnProperty(trimmedNewKey))) {
        return;
    }
    
    const newMeta = Object.keys(metadata).reduce((acc, key) => {
        if (key === oldKey) {
            acc[trimmedNewKey] = metadata[oldKey];
        } else {
            acc[key] = metadata[key];
        }
        return acc;
    }, {} as Record<string, string>);
    
    setMetadata(newMeta);
  };

  const handleValueChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleAddProperty = () => {
    let newKey = 'New Property';
    let i = 1;
    while (metadata.hasOwnProperty(newKey)) {
        newKey = `New Property ${i++}`;
    }
    setMetadata(prev => ({ ...prev, [newKey]: '' }));
  };

  const handleDeleteProperty = (keyToDelete: string) => {
    const newMeta = { ...metadata };
    delete newMeta[keyToDelete];
    setMetadata(newMeta);
  };

  return (
    <div className="p-2 border rounded-lg bg-background">
      <div className="space-y-2">
        {Object.keys(metadata).map((key) => (
          <div key={key} className="flex items-center gap-2 group">
            <EditableField 
                value={key} 
                onSave={(newKey) => handleKeyChange(key, newKey)}
                placeholder="Key"
                className="p-1 rounded-md hover:bg-muted cursor-pointer text-sm truncate w-28 font-semibold text-muted-foreground h-8" 
            />
            <EditableField 
                value={metadata[key]} 
                onSave={(newValue) => handleValueChange(key, newValue)}
                placeholder="Value"
                className="p-1 rounded-md hover:bg-muted cursor-pointer text-sm truncate flex-1 h-8"
            />
            <Button variant="ghost" size="icon" onClick={() => handleDeleteProperty(key)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 h-7 w-7">
              <X size={14} />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="link" onClick={handleAddProperty} className="mt-1 p-1 text-xs h-auto text-primary">
        <Plus size={14} className="mr-1"/>
        Add a property
      </Button>
    </div>
  );
};
