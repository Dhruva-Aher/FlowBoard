import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
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
  ArrowLeft,
  Copy,
  Trash2,
  Heading1,
  Heading2,
  Strikethrough,
} from 'lucide-react'
import { clsx } from 'clsx'

import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'
import type { Document } from '@/types'

type SaveState = 'saved' | 'saving' | 'unsaved' | 'error'

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

function isValidDoc(content: Record<string, unknown>): boolean {
  return !!content && typeof content.type === 'string'
}

function countWordsFromEditor(editor: Editor | null): number {
  if (!editor) return 0
  const text = editor.getText().trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

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
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={clsx(
        'rounded-md p-1.5 transition-colors',
        active ? 'bg-white/15 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-white/15" />
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
    <div className="flex flex-wrap items-center gap-0.5 border-b border-white/10 px-3 py-2">
      <ToolbarBtn
        active={editor.isActive('bold')}
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('italic')}
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('strike')}
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </ToolbarBtn>

      <Divider />

      <ToolbarBtn
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 size={14} />
      </ToolbarBtn>
      <ToolbarBtn
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="text-[10px] font-bold leading-none">H3</span>
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
        active={editor.isActive('codeBlock')}
        title="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <span className="text-[10px] font-mono font-bold">{'</>'}</span>
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

      <div className="relative">
        <ToolbarBtn
          active={showImageInput}
          title="Insert image from URL"
          onClick={() => setShowImageInput((s) => !s)}
        >
          <ImageIcon size={14} />
        </ToolbarBtn>
        {showImageInput && (
          <div className="absolute left-0 top-full z-20 mt-1.5 flex min-w-[300px] gap-2 rounded-xl border border-white/15 bg-[#121820] p-3 shadow-2xl">
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
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/35 focus:ring-1 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={insertImage}
              className="shrink-0 rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-300"
            >
              Insert
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Outline({ editor }: { editor: Editor | null }) {
  const headings = useMemo(() => {
    if (!editor) return [] as { level: number; text: string; pos: number }[]
    const items: { level: number; text: string; pos: number }[] = []
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        items.push({
          level: node.attrs.level as number,
          text: node.textContent || 'Untitled heading',
          pos,
        })
      }
    })
    return items
  }, [editor, editor?.state.doc])

  if (!editor || headings.length === 0) {
    return (
      <p className="text-xs text-white/40">
        Add H1–H3 headings to build an outline while you write.
      </p>
    )
  }

  return (
    <ul className="space-y-1">
      {headings.map((h, i) => (
        <li key={`${h.pos}-${i}`}>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().setTextSelection(h.pos + 1).run()
              const dom = editor.view.domAtPos(h.pos + 1).node as HTMLElement
              ;(dom as HTMLElement).scrollIntoView?.({ behavior: 'smooth', block: 'center' })
            }}
            className={clsx(
              'w-full truncate rounded-md px-2 py-1 text-left text-xs text-white/60 hover:bg-white/10 hover:text-white',
              h.level === 1 && 'font-semibold text-white/80',
              h.level === 2 && 'pl-3',
              h.level === 3 && 'pl-5'
            )}
          >
            {h.text}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function DocEditor() {
  const { workspaceId, docId } = useParams<{ workspaceId: string; docId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [error, setError] = useState<string | null>(null)
  const [wordCount, setWordCount] = useState(0)
  const [, bumpOutline] = useState(0)

  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSettingContentRef = useRef(false)

  const { data: doc, isLoading } = useQuery<Document>({
    queryKey: ['doc', docId],
    queryFn: () => api.get(`/docs/${docId}`).then((r) => r.data),
    enabled: !!docId,
  })

  const save = useMutation({
    mutationFn: (payload: { title?: string; content?: Record<string, unknown> }) =>
      api.patch(`/docs/${docId}`, payload).then((r) => r.data),
    onMutate: () => {
      setSaveState('saving')
      setError(null)
    },
    onSuccess: () => {
      setSaveState('saved')
      qc.invalidateQueries({ queryKey: ['docs', workspaceId] })
    },
    onError: (err) => {
      setSaveState('error')
      setError(apiErrorMessage(err, 'Save failed.'))
    },
  })

  const duplicate = useMutation({
    mutationFn: () => api.post<{ id: string }>(`/docs/${docId}/duplicate`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['docs', workspaceId] })
      navigate(`/app/workspace/${workspaceId}/docs/${data.id}`)
    },
    onError: (err) => setError(apiErrorMessage(err, 'Duplicate failed.')),
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/docs/${docId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['docs', workspaceId] })
      navigate(`/app/workspace/${workspaceId}/docs`)
    },
    onError: (err) => setError(apiErrorMessage(err, 'Delete failed.')),
  })

  const scheduleContentSave = useCallback(
    (content: Record<string, unknown>) => {
      setSaveState('unsaved')
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current)
      contentDebounceRef.current = setTimeout(() => {
        save.mutate({ content })
      }, 800)
    },
    [save]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing… Use H1/H2 for structure, lists for actions.',
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        class: [
          'focus:outline-none min-h-[420px]',
          'text-white/90 text-sm leading-relaxed',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-3 [&_h1]:mt-6',
          '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-2 [&_h2]:mt-5',
          '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mb-2 [&_h3]:mt-4',
          '[&_p]:mb-3',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3',
          '[&_li]:mb-1',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-teal-500/40 [&_blockquote]:pl-4 [&_blockquote]:text-white/60 [&_blockquote]:italic [&_blockquote]:my-3',
          '[&_code]:bg-white/10 [&_code]:text-teal-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs',
          '[&_pre]:bg-[#0a0f16] [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-white/10',
          '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-teal-300',
          '[&_hr]:border-white/15 [&_hr]:my-6',
          '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-3',
          '[&_strong]:font-semibold [&_strong]:text-white',
          '[&_em]:italic',
          '[&_s]:text-white/50',
        ].join(' '),
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isSettingContentRef.current) return
      setWordCount(countWordsFromEditor(ed))
      bumpOutline((n) => n + 1)
      scheduleContentSave(ed.getJSON() as Record<string, unknown>)
    },
  })

  useEffect(() => {
    if (!doc || !editor || editor.isDestroyed) return
    setTitle(doc.title)
    isSettingContentRef.current = true
    editor.commands.setContent(isValidDoc(doc.content) ? doc.content : EMPTY_DOC, false)
    isSettingContentRef.current = false
    setWordCount(doc.word_count ?? countWordsFromEditor(editor))
    setSaveState('saved')
    bumpOutline((n) => n + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    setSaveState('unsaved')
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
    titleDebounceRef.current = setTimeout(() => {
      save.mutate({ title: newTitle })
    }, 800)
  }

  useEffect(
    () => () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current)
      if (contentDebounceRef.current) clearTimeout(contentDebounceRef.current)
    },
    []
  )

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-white/40" size={24} />
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_220px]">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/app/workspace/${workspaceId}/docs`}
            className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-white"
          >
            <ArrowLeft size={12} /> All documents
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/50">
            {saveState === 'saving' && (
              <span className="inline-flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Saving…
              </span>
            )}
            {saveState === 'saved' && (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Check size={12} /> Saved
              </span>
            )}
            {saveState === 'unsaved' && <span>Unsaved changes</span>}
            {saveState === 'error' && <span className="text-rose-300">Save failed</span>}
            <span className="text-white/30">·</span>
            <span>{wordCount} words</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="mb-2 w-full border-none bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/25"
        />
        {doc && (
          <p className="mb-5 text-xs text-white/40">
            Updated {format(parseISO(doc.updated_at), 'MMM d, yyyy · HH:mm')} (
            {formatDistanceToNow(parseISO(doc.updated_at), { addSuffix: true })})
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e1520]">
          <EditorToolbar editor={editor} />
          <div className="p-6">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Outline
          </p>
          <Outline editor={editor} />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Actions
          </p>
          <div className="space-y-2">
            <button
              type="button"
              disabled={duplicate.isPending}
              onClick={() => duplicate.mutate()}
              className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <Copy size={13} /> Duplicate
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() => {
                if (confirm(`Delete “${title || 'this document'}”?`)) remove.mutate()
              }}
              className="flex w-full items-center gap-2 rounded-lg border border-rose-400/20 px-3 py-2 text-xs text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200 disabled:opacity-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
