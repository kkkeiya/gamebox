import { useState } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'

const TOOLBAR = [
  commands.title2,
  commands.bold,
  commands.italic,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.hr,
]

export default function MarkdownField({ value, onChange, placeholder, minHeight = 120 }) {
  const [preview, setPreview] = useState('edit')

  return (
    <div className="markdown-field" data-color-mode="light">
      <div className="flex justify-end mb-1">
        <div className="flex gap-1">
          <button type="button" onClick={() => setPreview('edit')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${preview === 'edit' ? 'bg-navy text-white' : 'bg-navy/10 text-navy/50'}`}>
            編集
          </button>
          <button type="button" onClick={() => setPreview('preview')}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${preview === 'preview' ? 'bg-navy text-white' : 'bg-navy/10 text-navy/50'}`}>
            プレビュー
          </button>
        </div>
      </div>
      <MDEditor
        value={value || ''}
        onChange={(v) => onChange(v || '')}
        preview={preview}
        commands={TOOLBAR}
        extraCommands={[]}
        textareaProps={{ placeholder }}
        height={minHeight}
        visibleDragbar={false}
        style={{
          borderRadius: '12px',
          border: '2px solid #C5D5FF',
          overflow: 'hidden',
        }}
      />
    </div>
  )
}
