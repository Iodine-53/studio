
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Helper to check if a string is a valid URL
const isUrl = (str: string) => {
  try {
    // Use a more robust regex to check for URLs, as new URL() can be too strict for partial pastes
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  } catch (_) {
    return false;
  }
};

const YOUTUBE_REGEX = /^(https?:)?\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/;
const VIMEO_REGEX = /^(https?:)?\/\/(www\.)?(vimeo\.com)\/.+$/;

export const PasteHandler = Extension.create({
  name: 'pasteHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('pasteHandler'),
        props: {
          handlePaste: (view, event, slice) => {
            const { state } = view;
            const { selection } = state;
            const text = event.clipboardData?.getData('text/plain') || '';

            // 1. Smart Link: If there's a selection and the pasted text is a URL
            if (selection.from !== selection.to && isUrl(text)) {
              // Ensure we don't apply to a selected embed or image node
              if (state.selection.content().size > 0) {
                 const node = state.selection.content().content.firstChild;
                 if (node && (node.type.name === 'image' || node.type.name === 'embed')) {
                    return false;
                 }
              }
              this.editor.commands.setLink({ href: text });
              return true; // We've handled the paste
            }

            // 2. Auto-Embed: Check for video links on empty lines
            const isVideoUrl = YOUTUBE_REGEX.test(text) || VIMEO_REGEX.test(text);
            const isonEmptyLine = selection.$from.parent.content.size === 0;

            if (isVideoUrl && isonEmptyLine) {
              this.editor.chain().focus().deleteRange(selection).setEmbed({ src: text }).run();
              return true; // We've handled the paste
            }

            return false; // Let other paste handlers run
          },
        },
      }),
    ];
  },
});
