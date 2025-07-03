
"use client";

import { type Editor } from "@tiptap/react";

type Props = {
  editor: Editor | null;
};

const Toolbar = ({ editor }: Props) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-t-xl border-b bg-muted/50 p-3">
      {/* Buttons will go here in the next step */}
    </div>
  );
};

export default Toolbar;
