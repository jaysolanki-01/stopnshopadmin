'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write here…',
  minHeight = 140,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose-editor focus:outline-none',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  // Sync external value changes (e.g. form reset) without fighting the editor
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const btn = (
    active: boolean,
    onClick: () => void,
    label: string,
    title: string,
    cls = '',
  ) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={[
        'px-2 py-1 rounded text-xs min-w-[26px] text-center transition-colors',
        active
          ? 'bg-neutral-200 text-neutral-900'
          : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900',
        cls,
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-neutral-900 focus-within:border-transparent transition-shadow">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-neutral-100 bg-neutral-50 flex-wrap">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B', 'Bold', 'font-bold')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I', 'Italic', 'italic')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'U', 'Underline', 'underline')}

        <div className="w-px h-4 bg-neutral-200 mx-0.5" />

        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', 'Heading 2')}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', 'Heading 3')}

        <div className="w-px h-4 bg-neutral-200 mx-0.5" />

        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '•', 'Bullet list')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1.', 'Numbered list')}

        <div className="w-px h-4 bg-neutral-200 mx-0.5" />

        {btn(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), 'Aa', 'Clear formatting', 'text-neutral-400')}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="px-3 py-2.5" />
    </div>
  );
}
