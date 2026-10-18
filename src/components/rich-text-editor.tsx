import { descriptionToHtml, looksLikeMarkdown } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import Underline from '@tiptap/extension-underline';
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { RichTextToolbar } from './rich-text-toolbar';

function handleMarkdownPaste(
  editor: Editor | null,
  event: ClipboardEvent
): boolean {
  if (!editor) return false;
  const html = event.clipboardData?.getData('text/html') ?? '';
  const text = event.clipboardData?.getData('text/plain') ?? '';
  if (html.trim()) return false; // rich text present — let TipTap paste natively
  if (!looksLikeMarkdown(text)) return false;
  editor.commands.insertContent(descriptionToHtml(text));
  return true;
}

const EDITOR_CLASS = cn(
  'min-h-[140px] rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs',
  'focus-within:outline-none focus-within:ring-3 focus-within:ring-ring/50 focus-within:border-ring',
  'dark:bg-input/30'
);

export function RichTextEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (html: string) => void;
  className?: string;
}) {
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline],
    content: descriptionToHtml(value),
    editorProps: {
      attributes: {
        class:
          'prose-sm focus:outline-none min-h-[120px] [&_p]:mb-2 [&_li_p]:mb-0 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs [&_a]:underline',
      },
      handlePaste: (_view, event) =>
        handleMarkdownPaste(editorRef.current, event),
    },
    onCreate({ editor: created }) {
      editorRef.current = created;
    },
    onUpdate({ editor }) {
      onChange(editor.isEmpty ? '' : editor.getHTML());
    },
  });

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e?.isActive('bold') ?? false,
      isItalic: e?.isActive('italic') ?? false,
      isUnderline: e?.isActive('underline') ?? false,
      isStrike: e?.isActive('strike') ?? false,
      isH1: e?.isActive('heading', { level: 1 }) ?? false,
      isH2: e?.isActive('heading', { level: 2 }) ?? false,
      isH3: e?.isActive('heading', { level: 3 }) ?? false,
      isBulletList: e?.isActive('bulletList') ?? false,
      isOrderedList: e?.isActive('orderedList') ?? false,
      isBlockquote: e?.isActive('blockquote') ?? false,
      isCodeBlock: e?.isActive('codeBlock') ?? false,
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
    }),
  });

  // Sync external value changes (e.g. sheet reopened with a different job).
  useEffect(() => {
    if (!editor) return;
    const next = descriptionToHtml(value);
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return <div className={cn(EDITOR_CLASS, className)} />;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex flex-wrap items-center gap-0.5 rounded-md border border-input bg-muted/40 px-1 py-0.5">
        <RichTextToolbar editor={editor} state={editorState} variant="full" />
      </div>

      <EditorContent editor={editor} className={EDITOR_CLASS} />

      <BubbleMenu editor={editor}>
        <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md">
          <RichTextToolbar editor={editor} state={editorState} variant="bubble" />
        </div>
      </BubbleMenu>
    </div>
  );
}
