import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, ImageIcon } from 'lucide-react';

export default function PlanEditor({ content, onChange }: { content: string, onChange: (val: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        className: 'prose prose-sm prose-slate max-w-none min-h-full focus:outline-none p-4',
        dir: 'rtl',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                  const node = view.state.schema.nodes.image.create({ src: result });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                }
              };
              reader.readAsDataURL(file);
              return true; // Stop default paste
            }
          }
        }
        return false;
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white/50 focus-within:bg-white focus-within:border-blue-400 transition-colors flex flex-col h-full min-h-[300px]">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        <button
          onClick={() => {
            const url = window.prompt('URL الصورة:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          className="p-1.5 rounded-lg transition-colors text-slate-500 hover:bg-slate-100"
          title="أضف صورة (أو الصقها مباشرة بـ Ctrl+V)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>
      
      <div className="bg-transparent flex-1 overflow-y-auto" dir="rtl">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
