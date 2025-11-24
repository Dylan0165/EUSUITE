import React, { useState, useEffect } from 'react'
import './TableOfContents.css'

function TableOfContents({ editor }) {
  const [headings, setHeadings] = useState([])

  useEffect(() => {
    if (!editor) return

    const updateHeadings = () => {
      const items = []
      const doc = editor.state.doc

      doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level || 1
          const text = node.textContent || ''
          const id = `heading-${pos}`

          items.push({
            level,
            text,
            id,
            pos,
          })
        }
      })

      setHeadings(items)
    }

    updateHeadings()
    editor.on('update', updateHeadings)

    return () => {
      editor.off('update', updateHeadings)
    }
  }, [editor])

  const scrollToHeading = (pos) => {
    try {
      editor.commands.setTextSelection(pos)
      editor.commands.focus()
      const dom = editor.view.domAtPos(pos)
      if (dom && dom.node && typeof dom.node.scrollIntoView === 'function') {
        dom.node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } catch (err) {
      // ignore
    }
  }

  if (!editor) return <div>Laadt...</div>
  if (headings.length === 0) return <div>Geen koppen gevonden.</div>

  return (
    <div className="toc">
      <h3>Inhoudsopgave</h3>
      <ul>
        {headings.map((h, i) => (
          <li key={h.id || i} className={`toc-item toc-level-${h.level}`}>
            <button className="toc-link" onClick={() => scrollToHeading(h.pos)}>
              {h.text || '(lege kop)'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TableOfContents
