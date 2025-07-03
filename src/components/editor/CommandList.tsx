'use client';

import React, { useState, useEffect } from 'react';
import type { CommandItem } from './slash-command';

interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const CommandList = React.forwardRef((props: CommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: React.KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="z-50 w-72 rounded-md border bg-card p-1 shadow-md">
      {props.items.length > 0 ? (
        props.items.map((item: CommandItem, index: number) => (
          <button
            className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-card-foreground ${index === selectedIndex ? 'bg-muted' : ''}`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="p-2 text-sm">No results</div>
      )}
    </div>
  );
});

CommandList.displayName = 'CommandList';
