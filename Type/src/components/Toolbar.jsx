import React, { useState } from 'react'
import './Toolbar.css'

function Toolbar({ editor, onNew, onSave, onOpen, currentFile, onInsertTOC }) {
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false)
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showInsertMenu, setShowInsertMenu] = useState(false)

  if (!editor) {
    return null
  }

  const fonts = [
    'Calibri',
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Palatino',
    'Cambria',
  ]

  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72']

  const styles = [
    { name: 'Standaard', action: () => editor.chain().focus().setParagraph().run() },
    { name: 'Titel', action: () => editor.chain().focus().setHeading({ level: 1 }).run() },
    { name: 'Kop 1', action: () => editor.chain().focus().setHeading({ level: 1 }).run() },
    { name: 'Kop 2', action: () => editor.chain().focus().setHeading({ level: 2 }).run() },
    { name: 'Kop 3', action: () => editor.chain().focus().setHeading({ level: 3 }).run() },
    { name: 'Kop 4', action: () => editor.chain().focus().setHeading({ level: 4 }).run() },
    { name: 'Kop 5', action: () => editor.chain().focus().setHeading({ level: 5 }).run() },
    { name: 'Kop 6', action: () => editor.chain().focus().setHeading({ level: 6 }).run() },
    { name: 'Ondertitel', action: () => editor.chain().focus().setHeading({ level: 2 }).run() },
  ]

  const setFontSize = (size) => {
    editor.chain().focus().setFontSize(`${size}pt`).run()
    setShowFontSizeMenu(false)
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertImage = () => {
    const url = prompt('Voer afbeelding URL in:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const setLink = () => {
    const url = prompt('Voer link URL in:', editor.getAttributes('link').href || '')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
  }

  return (
    <div className="toolbar-container">
      {/* Hoofdmenu */}
      <div className="toolbar menu-bar">
        <button onClick={onNew} className="menu-button" title="Nieuw document">
          📄 Nieuw
        </button>
        <button onClick={onOpen} className="menu-button" title="Document openen">
          📂 Openen
        </button>
        <button onClick={onSave} className="menu-button" title="Document opslaan">
          💾 Opslaan
        </button>

        <div className="menu-divider"></div>

        {/* Invoegen menu */}
        <div className="dropdown-container">
          <button
            className="menu-button"
            onClick={() => setShowInsertMenu(!showInsertMenu)}
          >
            ➕ Invoegen
          </button>
          {showInsertMenu && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  onInsertTOC()
                  setShowInsertMenu(false)
                }}
              >
                📑 Inhoudsopgave
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  insertTable()
                  setShowInsertMenu(false)
                }}
              >
                ⊞ Tabel
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  insertImage()
                  setShowInsertMenu(false)
                }}
              >
                🖼️ Afbeelding
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  editor.chain().focus().setHorizontalRule().run()
                  setShowInsertMenu(false)
                }}
              >
                ─ Horizontale lijn
              </button>
            </div>
          )}
        </div>
        
        {currentFile && (
          <div className="current-file">
            {currentFile.split('\\').pop().split('/').pop()}
          </div>
        )}
      </div>

      {/* Opmaak toolbar */}
      <div className="toolbar format-bar">
        {/* Stijlen dropdown */}
        <div className="dropdown-container">
          <button
            className="toolbar-button dropdown-trigger style-dropdown"
            onClick={() => setShowStyleMenu(!showStyleMenu)}
          >
            📋 Stijlen
          </button>
          {showStyleMenu && (
            <div className="dropdown-menu">
              {styles.map((style) => (
                <button
                  key={style.name}
                  className="dropdown-item"
                  onClick={() => {
                    style.action()
                    setShowStyleMenu(false)
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-divider"></div>

        {/* Font selectie */}
        <div className="dropdown-container">
          <button
            className="toolbar-button dropdown-trigger"
            onClick={() => setShowFontMenu(!showFontMenu)}
          >
            📝 Lettertype
          </button>
          {showFontMenu && (
            <div className="dropdown-menu">
              {fonts.map((font) => (
                <button
                  key={font}
                  className="dropdown-item"
                  style={{ fontFamily: font }}
                  onClick={() => {
                    editor.chain().focus().setFontFamily(font).run()
                    setShowFontMenu(false)
                  }}
                >
                  {font}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font size */}
        <div className="dropdown-container">
          <button
            className="toolbar-button dropdown-trigger"
            onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
          >
            📏 Grootte
          </button>
          {showFontSizeMenu && (
            <div className="dropdown-menu">
              {fontSizes.map((size) => (
                <button
                  key={size}
                  className="dropdown-item"
                  onClick={() => setFontSize(size)}
                >
                  {size}pt
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="toolbar-divider"></div>

        {/* Basis opmaak */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'toolbar-button active' : 'toolbar-button'}
          title="Vetgedrukt (Ctrl+B)"
        >
          <strong>V</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'toolbar-button active' : 'toolbar-button'}
          title="Cursief (Ctrl+I)"
        >
          <em>C</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'toolbar-button active' : 'toolbar-button'}
          title="Onderstreept (Ctrl+U)"
        >
          <u>O</u>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'toolbar-button active' : 'toolbar-button'}
          title="Doorhalen"
        >
          <s>D</s>
        </button>

        <div className="toolbar-divider"></div>

        {/* Tekst kleur */}
        <input
          type="color"
          className="color-picker"
          onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
          title="Tekstkleur"
        />
        <input
          type="color"
          className="color-picker"
          onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
          title="Markeerstift"
        />

        <div className="toolbar-divider"></div>

        {/* Subscript/Superscript */}
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={editor.isActive('subscript') ? 'toolbar-button active' : 'toolbar-button'}
          title="Subscript"
        >
          X₂
        </button>
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={editor.isActive('superscript') ? 'toolbar-button active' : 'toolbar-button'}
          title="Superscript"
        >
          X²
        </button>

        <div className="toolbar-divider"></div>

        {/* Uitlijning */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'toolbar-button active' : 'toolbar-button'}
          title="Links uitlijnen"
        >
          ≡
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'toolbar-button active' : 'toolbar-button'}
          title="Centreren"
        >
          ≣
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'toolbar-button active' : 'toolbar-button'}
          title="Rechts uitlijnen"
        >
          ≡
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'toolbar-button active' : 'toolbar-button'}
          title="Uitvullen"
        >
          ≣
        </button>

        <div className="toolbar-divider"></div>

        {/* Lijsten */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'toolbar-button active' : 'toolbar-button'}
          title="Opsommingstekens"
        >
          • Lijst
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'toolbar-button active' : 'toolbar-button'}
          title="Genummerde lijst"
        >
          1. Lijst
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={editor.isActive('taskList') ? 'toolbar-button active' : 'toolbar-button'}
          title="Takenlijst"
        >
          ☑ Taken
        </button>

        <div className="toolbar-divider"></div>

        {/* Koppen */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'toolbar-button active' : 'toolbar-button'}
          title="Kop 1"
        >
          K1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'toolbar-button active' : 'toolbar-button'}
          title="Kop 2"
        >
          K2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'toolbar-button active' : 'toolbar-button'}
          title="Kop 3"
        >
          K3
        </button>

        <div className="toolbar-divider"></div>

        {/* Inhoudsopgave */}
        <button
          onClick={onInsertTOC}
          className="toolbar-button toc-button"
          title="Inhoudsopgave invoegen"
        >
          📑 Inhoudsopgave
        </button>

        <div className="toolbar-divider"></div>

        {/* Extra functies */}
        <button
          onClick={insertTable}
          className="toolbar-button"
          title="Tabel invoegen"
        >
          ⊞ Tabel
        </button>
        <button
          onClick={insertImage}
          className="toolbar-button"
          title="Afbeelding invoegen"
        >
          🖼️ Afbeelding
        </button>
        <button
          onClick={setLink}
          className={editor.isActive('link') ? 'toolbar-button active' : 'toolbar-button'}
          title="Link invoegen"
        >
          🔗 Link
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'toolbar-button active' : 'toolbar-button'}
          title="Citaat"
        >
          " Citaat
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="toolbar-button"
          title="Horizontale lijn"
        >
          ─ Lijn
        </button>
      </div>
    </div>
  )
}

export default Toolbar
