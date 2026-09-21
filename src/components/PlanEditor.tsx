import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function PlanEditor({ content, onChange }: { content: string, onChange: (val: string) => void }) {
  const isUpdating = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      isUpdating.current = true;
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        className: 'prose prose-sm prose-slate max-w-none h-full focus:outline-none p-4',
        dir: 'rtl',
      }
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !isUpdating.current) {
      editor.commands.setContent(content);
    }
    isUpdating.current = false;
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-400 transition-colors flex flex-col h-full min-h-[250px] shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200'}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      
      <div className="bg-transparent flex-1 overflow-y-auto" dir="rtl">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
