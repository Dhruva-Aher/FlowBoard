import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { api } from '@/lib/api'
import type { Document } from '@/types'
import {
  Check,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  Minus,
  Image as ImageIcon,
} from 'lucide-react'
import { clsx } from 'clsx'

type SaveState = 'saved' | 'saving' | 'unsaved'

// A bare `{}` is NOT valid TipTap/ProseMirror JSON — the editor renders blank
// and the Placeholder extension has no <p> node to attach its ::before pseudo-element to.
const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

function isValidDoc(content: Record<string, unknown>): boolean {
  return !!content && typeof content.type === 'string'
}

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------
function ToolbarBtn({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      // onMouseDown + preventDefault keeps editor focus intact
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={clsx(
        'p-1.5 rounded-md transition-colors',
        active
          ? 'bg-neutral-700 text-white'
          : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-neutral-700 mx-1 shrink-0" />
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  if (!editor) return null

  const insertImage = () => {
    const url = imageUrl.trim()
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
      setImageUrl('')
    }
    setShowImageInput(false)
  }

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-neutral-700 flex-wrap">
      <ToolbarBtn
        active={editor.isActive('bold')}
        title="Bold (⌘B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('italic')}
        title="Italic (⌘I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <span className="text-xs font-bold leading-none">H1</span>
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="text-xs font-bold leading-none">H2</span>
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="text-xs font-bold leading-none">H3</span>
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        active={editor.isActive('bulletList')}
        title="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('orderedList')}
        title="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        active={editor.isActive('code')}
        title="Inline code"
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('blockquote')}
        title="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={false}
        title="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={14} />
      </ToolbarBtn>

      <Divider />

      {/* Image insert — URL-based */}
      <div className="relative">
        <ToolbarBtn
          active={showImageInput}
          title="Insert image from URL"
          onClick={() => setShowImageInput((s) => !s)}
        >
          <ImageIcon size={14} />
        </ToolbarBtn>

        {showImageInput && (
          <div className="absolute top-full left-0 mt-1.5 z-20 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl p-3 flex gap-2 min-w-[300px]">
            <input
              autoFocus
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') insertImage()
                if (e.key === 'Escape') setShowImageInput(false)
              }}
              placeholder="https://example.com/photo.jpg"
              className="flex-1 bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-neutral-600"
            />
            <button
              type="button"
              onClick={insertImage}
              className="px-3 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shrink-0"
            >
              Insert
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DocEditor
// ---------------------------------------------------------------------------
export default function DocEditor() {
  const { docId } = useParams<{ docId: string }>()
  const [title, setTitle] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('saved')

  // Two independent debounce timers so title and content saves never cancel each other
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flag: while we programmatically call setContent on load, suppress onUpdate
  // so we don't schedule a phantom "save" of the content we just fetched.
  const isSettingContentRef = useRef(false)

  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ['doc', docId],
    queryFn: () => api.get(`/docs/${docId}`).then((r) => r.data),
    enabled: !!docId,
  })

  const save = useMutation({
    mutationFn: (payload: { title?: string; content?: Record<string, unknown> }) =>
      api.patch(`/docs/${docId}`, payload).then((r) => r.data),
    onMutate: () => setSaveState('saving'),
    onSuccess: () => setSaveState('saved'),
    onError: () => setSaveState('unsaved'),
  })

  const scheduleContentSave = useCallback(
    (content: Record<string, unknown>) => {
      setSaveState('unsaved')
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current)
      contentDebounceRef.current = setTimeout(() => {
        save.mutate({ content })
      }, 800)
    },
    [save],
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing…' }),
      // Image extension — URL-based embeds; base64 disabled to avoid bloating the DB
      Image.configure({ inline: false, allowBase64: false }),
    ],
    // Always start with a valid ProseMirror doc; the useEffect below replaces it
    // once the real content arrives from the API.
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        // @tailwindcss/typography is not installed, so apply formatting via
        // Tailwind's arbitrary child-selector variants instead.
        class: [
          'focus:outline-none min-h-[400px]',
          'text-neutral-200 text-sm leading-relaxed',
          // Headings
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-neutral-100 [&_h1]:mb-3 [&_h1]:mt-6',
          '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-neutral-100 [&_h2]:mb-2 [&_h2]:mt-5',
          '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-neutral-100 [&_h3]:mb-2 [&_h3]:mt-4',
          // Paragraphs
          '[&_p]:mb-3',
          // Lists
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3',
          '[&_li]:mb-1',
          // Blockquote
          '[&_blockquote]:border-l-2 [&_blockquote]:border-neutral-600 [&_blockquote]:pl-4 [&_blockquote]:text-neutral-400 [&_blockquote]:italic [&_blockquote]:my-3',
          // Code
          '[&_code]:bg-neutral-800 [&_code]:text-emerald-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs',
          '[&_pre]:bg-neutral-800 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:mb-3 [&_pre]:overflow-x-auto',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-emerald-400',
          // HR
          '[&_hr]:border-neutral-700 [&_hr]:my-6',
          // Images
          '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3',
          // Strong / Em
          '[&_strong]:font-semibold [&_strong]:text-neutral-100',
          '[&_em]:italic',
        ].join(' '),
      },
    },
    onUpdate: ({ editor }) => {
      // Skip: we called setContent ourselves (initial load) — not a real user edit
      if (isSettingContentRef.current) return
      scheduleContentSave(editor.getJSON() as Record<string, unknown>)
    },
  })

  // Populate editor once the doc arrives from the API
  useEffect(() => {
    if (!doc || !editor || editor.isDestroyed) return

    setTitle(doc.title)

    // Raise the flag BEFORE setContent so onUpdate (if it fires) is suppressed,
    // then pass emitUpdate=false as a belt-and-suspenders measure.
    isSettingContentRef.current = true
    editor.commands.setContent(
      isValidDoc(doc.content) ? doc.content : EMPTY_DOC,
      false, // emitUpdate — prevents onUpdate from firing for this programmatic change
    )
    isSettingContentRef.current = false

    setSaveState('saved')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setSaveState('unsaved')
    // Use its own separate debounce ref — content edits must not cancel this
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    titleDebounceRef.current = setTimeout(() => {
      save.mutate({ title: newTitle })
    }, 800)
  }

  // Clean up both timers on unmount to avoid calling setState on an unmounted component
  useEffect(
    () => () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current)
    },
    [],
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-neutral-500" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Save-state indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          {saveState === 'saving' && (
            <>
              <Loader2 size={12} className="animate-spin" />
              Saving…
            </>
          )}
          {saveState === 'saved' && (
            <>
              <Check size={12} className="text-emerald-500" />
              Saved
            </>
          )}
          {saveState === 'unsaved' && 'Unsaved changes'}
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Untitled"
        className="w-full bg-transparent text-3xl font-bold text-neutral-100 placeholder-neutral-700 outline-none mb-6 border-none"
      />

      {/* Editor card */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <EditorToolbar editor={editor} />
        <div className="p-6">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
