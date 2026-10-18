import type { Editor } from '@tiptap/react';
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
  type LucideIcon,
} from 'lucide-react';
import { Fragment } from 'react';
import { ToolbarButton } from './rich-text-toolbar-button';

export interface RichTextEditorState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  isH1: boolean;
  isH2: boolean;
  isH3: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isBlockquote: boolean;
  isCodeBlock: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

interface ToolbarItem {
  label: string;
  icon: LucideIcon;
  run: (editor: Editor) => void;
  active?: keyof RichTextEditorState;
  enabledWhen?: keyof RichTextEditorState;
}

const MARKS: ToolbarItem[] = [
  {
    label: 'Bold',
    icon: BoldIcon,
    active: 'isBold',
    run: e => e.chain().focus().toggleBold().run(),
  },
  {
    label: 'Italic',
    icon: ItalicIcon,
    active: 'isItalic',
    run: e => e.chain().focus().toggleItalic().run(),
  },
  {
    label: 'Underline',
    icon: UnderlineIcon,
    active: 'isUnderline',
    run: e => e.chain().focus().toggleUnderline().run(),
  },
  {
    label: 'Strikethrough',
    icon: StrikethroughIcon,
    active: 'isStrike',
    run: e => e.chain().focus().toggleStrike().run(),
  },
];

const HEADINGS: ToolbarItem[] = [
  {
    label: 'Heading 1',
    icon: Heading1Icon,
    active: 'isH1',
    run: e => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'Heading 2',
    icon: Heading2Icon,
    active: 'isH2',
    run: e => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'Heading 3',
    icon: Heading3Icon,
    active: 'isH3',
    run: e => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
];

const LISTS: ToolbarItem[] = [
  {
    label: 'Bullet list',
    icon: ListIcon,
    active: 'isBulletList',
    run: e => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: 'Ordered list',
    icon: ListOrderedIcon,
    active: 'isOrderedList',
    run: e => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'Blockquote',
    icon: QuoteIcon,
    active: 'isBlockquote',
    run: e => e.chain().focus().toggleBlockquote().run(),
  },
];

const BLOCKS: ToolbarItem[] = [
  {
    label: 'Code block',
    icon: CodeIcon,
    active: 'isCodeBlock',
    run: e => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: 'Horizontal rule',
    icon: MinusIcon,
    run: e => e.chain().focus().setHorizontalRule().run(),
  },
];

const HISTORY: ToolbarItem[] = [
  {
    label: 'Undo',
    icon: Undo2Icon,
    enabledWhen: 'canUndo',
    run: e => e.chain().focus().undo().run(),
  },
  {
    label: 'Redo',
    icon: Redo2Icon,
    enabledWhen: 'canRedo',
    run: e => e.chain().focus().redo().run(),
  },
];

const FULL_GROUPS = [MARKS, HEADINGS, [...LISTS, ...BLOCKS], HISTORY];
const BUBBLE_GROUPS = [MARKS, HEADINGS, LISTS];

interface RichTextToolbarProps {
  editor: Editor;
  state: RichTextEditorState | null;
  variant: 'full' | 'bubble';
}

export function RichTextToolbar({
  editor,
  state,
  variant,
}: RichTextToolbarProps) {
  const groups = variant === 'full' ? FULL_GROUPS : BUBBLE_GROUPS;

  return (
    <>
      {groups.map((group, i) => (
        <Fragment key={group[0].label}>
          {i > 0 && <span className="mx-1 h-4 w-px bg-border" />}
          {group.map(({ label, icon: Icon, active, enabledWhen, run }) => (
            <ToolbarButton
              key={label}
              label={label}
              active={active ? state?.[active] : undefined}
              disabled={enabledWhen ? !state?.[enabledWhen] : undefined}
              onClick={() => run(editor)}
            >
              <Icon className="size-4" />
            </ToolbarButton>
          ))}
        </Fragment>
      ))}
    </>
  );
}
