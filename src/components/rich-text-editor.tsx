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
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * Convert pasted markdown (e.g. AI-generated job descriptions) into rich text.
 * Only runs when no rich HTML is on the clipboard, so pasting from Word/Google
 * Docs still preserves its native formatting.
 */
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

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground disabled:opacity-40',
        active && 'bg-accent text-foreground'
      )}
    >
      {children}
    </button>
  );
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
        <ToolbarButton
          label="Bold"
          active={editorState?.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editorState?.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editorState?.isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editorState?.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          label="Heading 1"
          active={editorState?.isH1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editorState?.isH2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editorState?.isH3}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3Icon className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          label="Bullet list"
          active={editorState?.isBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          active={editorState?.isOrderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          active={editorState?.isBlockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editorState?.isCodeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <CodeIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <MinusIcon className="size-4" />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />

        <ToolbarButton
          label="Undo"
          disabled={!editorState?.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!editorState?.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2Icon className="size-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className={EDITOR_CLASS} />

      <BubbleMenu editor={editor}>
        <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md">
          <ToolbarButton
            label="Bold"
            active={editorState?.isBold}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            active={editorState?.isItalic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Underline"
            active={editorState?.isUnderline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            active={editorState?.isStrike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <StrikethroughIcon className="size-4" />
          </ToolbarButton>

          <span className="mx-1 h-4 w-px bg-border" />

          <ToolbarButton
            label="Heading 1"
            active={editorState?.isH1}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1Icon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 2"
            active={editorState?.isH2}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Heading 3"
            active={editorState?.isH3}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3Icon className="size-4" />
          </ToolbarButton>

          <span className="mx-1 h-4 w-px bg-border" />

          <ToolbarButton
            label="Bullet list"
            active={editorState?.isBulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <ListIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Ordered list"
            active={editorState?.isOrderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrderedIcon className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Blockquote"
            active={editorState?.isBlockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <QuoteIcon className="size-4" />
          </ToolbarButton>
        </div>
      </BubbleMenu>
    </div>
  );
}
