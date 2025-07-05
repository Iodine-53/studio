
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

            // Auto-Embed: If pasting a URL on an empty line, create an embed.
            const isPastedUrl = isUrl(text);
            const isonEmptyLine = selection.$from.parent.content.size === 0;

            if (isPastedUrl && isonEmptyLine) {
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
