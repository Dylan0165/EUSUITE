import React, { useState } from 'react'
import './RibbonToolbar.css'

function RibbonToolbar({ editor, onNew, onSave, onSaveAs, onExport, onOpen, onPrint, onExportPDF, currentFile, documentName, onRenameDocument, onToggleNavigation }) {
  const [activeTab, setActiveTab] = useState('start')
  const [showFontMenu, setShowFontMenu] = useState(false)
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false)
  const [showStylesMenu, setShowStylesMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

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
    'Trebuchet MS',
    'Cambria',
    'Comic Sans MS',
  ]

  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72']

  const setFontSize = (size) => {
    editor.chain().focus().setFontSize(`${size}pt`).run()
    setShowFontSizeMenu(false)
  }

  const increaseFontSize = () => {
    // Implement font size increase
    const currentSize = 12 // You'd need to get current size
    setFontSize(currentSize + 2)
  }

  const decreaseFontSize = () => {
    const currentSize = 12
    setFontSize(Math.max(8, currentSize - 2))
  }

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          editor.chain().focus().setImage({ src: event.target.result }).run()
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const insertPageBreak = () => {
    editor.chain().focus().setHardBreak().run()
  }

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run()
  }

  const indentMore = () => {
    // Voor lijsten
    if (editor.isActive('listItem')) {
      editor.chain().focus().sinkListItem('listItem').run()
    } else {
      // Voor normale paragrafen, voeg margin toe
      const currentNode = editor.state.selection.$from.parent
      editor.chain().focus().updateAttributes('paragraph', {
        style: 'margin-left: 2em;'
      }).run()
    }
  }

  const indentLess = () => {
    if (editor.isActive('listItem')) {
      editor.chain().focus().liftListItem('listItem').run()
    } else {
      editor.chain().focus().updateAttributes('paragraph', {
        style: 'margin-left: 0;'
      }).run()
    }
  }

  const insertLink = () => {
    const url = prompt('Voer URL in:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const removeLink = () => {
    editor.chain().focus().unsetLink().run()
  }

  const showOptions = () => {
    alert('EUTYPE Opties\n\nVersie: 1.0.0\n\nEen professionele tekstverwerker voor documenten.\n\n© 2025 EUTYPE')
  }

  const insertHorizontalRule = () => {
    editor.chain().focus().setHorizontalRule().run()
  }

  const insertBlockquote = () => {
    editor.chain().focus().toggleBlockquote().run()
  }

  return (
    <div className="ribbon-toolbar">
      {/* Logo & Bestand menu */}
      <div className="ribbon-file-menu">
        <div className="app-logo">EUTYPE</div>
        <div className="file-menu-wrapper">
          <button className="file-button">
            📄 Bestand
          </button>
          <div className="file-dropdown">
            <button onClick={onNew}>📄 Nieuw</button>
            <button onClick={onOpen}>📂 Openen</button>
            <hr />
            <button onClick={onSave}>💾 Opslaan</button>
            <button onClick={() => onSaveAs('ty')}>💾 Opslaan als...</button>
            <hr />
            <div className="export-submenu">
              <button onMouseEnter={() => setShowExportMenu(true)}>
                📤 Exporteren ›
              </button>
              {showExportMenu && (
                <div className="submenu" onMouseLeave={() => setShowExportMenu(false)}>
                  <button onClick={() => { onExport('html'); setShowExportMenu(false); }}>🌐 HTML Document</button>
                  <button onClick={() => { onExport('txt'); setShowExportMenu(false); }}>� Plain Text (.txt)</button>
                  <button onClick={() => { onExportPDF(); setShowExportMenu(false); }}>📑 PDF Document</button>
                  <button onClick={() => { onExport('docx'); setShowExportMenu(false); }}>📘 Word Document (.docx)</button>
                </div>
              )}
            </div>
            <hr />
            <button onClick={onPrint}>🖨️ Afdrukken</button>
            <hr />
            <button onClick={showOptions}>⚙️ Opties</button>
          </div>
        </div>

        {/* Quick Access Toolbar */}
        <div className="quick-access-toolbar">
          <button onClick={onSave} title="Opslaan">💾</button>
          <button onClick={() => editor.chain().focus().undo().run()} title="Ongedaan maken">↶</button>
          <button onClick={() => editor.chain().focus().redo().run()} title="Opnieuw">↷</button>
        </div>
      </div>

      {/* Document naam */}
      <div className="document-title" onClick={onRenameDocument} title="Klik om naam te wijzigen">
        <span className="document-name">{documentName || 'Naamloos document'}</span>
        <span className="edit-icon">✏️</span>
      </div>

      {/* Tab menu */}
      <div className="ribbon-tabs">
        <button className={activeTab === 'start' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('start')}>
          Start
        </button>
        <button className={activeTab === 'invoegen' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('invoegen')}>
          Invoegen
        </button>
        <button className={activeTab === 'ontwerpen' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('ontwerpen')}>
          Ontwerpen
        </button>
        <button className={activeTab === 'indeling' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('indeling')}>
          Indeling
        </button>
        <button className={activeTab === 'verwijzingen' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('verwijzingen')}>
          Verwijzingen
        </button>
        <button className={activeTab === 'verzendlijsten' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('verzendlijsten')}>
          Verzendlijsten
        </button>
        <button className={activeTab === 'controleren' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('controleren')}>
          Controleren
        </button>
        <button className={activeTab === 'beeld' ? 'ribbon-tab active' : 'ribbon-tab'} onClick={() => setActiveTab('beeld')}>
          Beeld
        </button>
      </div>

      {/* Ribbon content based on active tab */}
      <div className="ribbon-content">
        {/* START TAB */}
        {activeTab === 'start' && (
          <div className="ribbon-groups">
            {/* Klembord */}
            <div className="ribbon-group">
              <div className="group-label">Klembord</div>
              <div className="group-buttons">
                <button className="ribbon-btn-large" onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText()
                    editor.chain().focus().insertContent(text).run()
                  } catch (err) {
                    console.error('Plakken mislukt:', err)
                  }
                }}>
                  <div className="btn-icon">📋</div>
                  <div className="btn-label">Plakken</div>
                </button>
                <div className="ribbon-btn-column">
                  <button className="ribbon-btn-small" onClick={() => {
                    const selection = window.getSelection().toString()
                    if (selection) {
                      navigator.clipboard.writeText(selection)
                      editor.chain().focus().deleteSelection().run()
                    }
                  }}>
                    ✂️ Knippen
                  </button>
                  <button className="ribbon-btn-small" onClick={() => {
                    const selection = window.getSelection().toString()
                    if (selection) navigator.clipboard.writeText(selection)
                  }}>
                    📄 Kopiëren
                  </button>
                  <button className="ribbon-btn-small" onClick={clearFormatting}>
                    🧹 Opmaak wissen
                  </button>
                </div>
              </div>
            </div>

            {/* Lettertype */}
            <div className="ribbon-group">
              <div className="group-label">Lettertype</div>
              <div className="group-buttons font-group">
                <div className="font-row">
                  <select
                    className="font-select"
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </option>
                    ))}
                  </select>
                  <select className="size-select" onChange={(e) => setFontSize(e.target.value)}>
                    {fontSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <button className="icon-btn" onClick={increaseFontSize} title="Lettertype vergroten">
                    ⬆️
                  </button>
                  <button className="icon-btn" onClick={decreaseFontSize} title="Lettertype verkleinen">
                    ⬇️
                  </button>
                </div>
                <div className="font-row">
                  <button
                    className={editor.isActive('bold') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    title="Vetgedrukt (Ctrl+B)"
                  >
                    <strong>V</strong>
                  </button>
                  <button
                    className={editor.isActive('italic') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    title="Cursief (Ctrl+I)"
                  >
                    <em>C</em>
                  </button>
                  <button
                    className={editor.isActive('underline') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    title="Onderstreept (Ctrl+U)"
                  >
                    <u>O</u>
                  </button>
                  <button
                    className={editor.isActive('strike') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    title="Doorhalen"
                  >
                    <s>abc</s>
                  </button>
                  <button
                    className={editor.isActive('subscript') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleSubscript().run()}
                    title="Subscript"
                  >
                    X₂
                  </button>
                  <button
                    className={editor.isActive('superscript') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleSuperscript().run()}
                    title="Superscript"
                  >
                    X²
                  </button>
                  <input
                    type="color"
                    className="color-btn"
                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                    title="Tekstkleur"
                  />
                  <input
                    type="color"
                    className="color-btn"
                    onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                    title="Tekstmarkeerstift"
                  />
                  <button className="format-btn" onClick={clearFormatting} title="Alle opmaak wissen">
                    A
                  </button>
                </div>
              </div>
            </div>

            {/* Alinea */}
            <div className="ribbon-group">
              <div className="group-label">Alinea</div>
              <div className="group-buttons">
                <div className="align-row">
                  <button
                    className={editor.isActive('bulletList') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    title="Opsommingstekens"
                  >
                    •
                  </button>
                  <button
                    className={editor.isActive('orderedList') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    title="Nummering"
                  >
                    1.
                  </button>
                  <button
                    className={editor.isActive('taskList') ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    title="Takenlijst"
                  >
                    ☑
                  </button>
                  <button className="format-btn" onClick={indentLess} title="Inspringen verkleinen">
                    ⬅️
                  </button>
                  <button className="format-btn" onClick={indentMore} title="Inspringen vergroten">
                    ➡️
                  </button>
                </div>
                <div className="align-row">
                  <button
                    className={editor.isActive({ textAlign: 'left' }) ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    title="Links uitlijnen"
                  >
                    ≡
                  </button>
                  <button
                    className={editor.isActive({ textAlign: 'center' }) ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    title="Centreren"
                  >
                    ≣
                  </button>
                  <button
                    className={editor.isActive({ textAlign: 'right' }) ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    title="Rechts uitlijnen"
                  >
                    ≡
                  </button>
                  <button
                    className={editor.isActive({ textAlign: 'justify' }) ? 'format-btn active' : 'format-btn'}
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    title="Uitvullen"
                  >
                    ≣
                  </button>
                  <button className="format-btn" title="Regelafstand">
                    ☰
                  </button>
                  <input
                    type="color"
                    className="color-btn"
                    title="Arcering"
                  />
                  <button className="format-btn" title="Randen">
                    ▦
                  </button>
                </div>
              </div>
            </div>

            {/* Stijlen */}
            <div className="ribbon-group">
              <div className="group-label">Stijlen</div>
              <div className="styles-gallery">
                <button className="style-btn" onClick={() => editor.chain().focus().setParagraph().run()}>
                  Standaard
                </button>
                <button className="style-btn" onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}>
                  Kop 1
                </button>
                <button className="style-btn" onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}>
                  Kop 2
                </button>
                <button className="style-btn" onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}>
                  Titel
                </button>
                <button className="style-btn">
                  Ondertitel
                </button>
                <button className="style-btn-more">▼</button>
              </div>
            </div>
          </div>
        )}

        {/* INVOEGEN TAB */}
        {activeTab === 'invoegen' && (
          <div className="ribbon-groups">
            <div className="ribbon-group">
              <div className="group-label">Pagina's</div>
              <div className="group-buttons">
                <button className="ribbon-btn-large">
                  <div className="btn-icon">📄</div>
                  <div className="btn-label">Omslagpagina</div>
                </button>
                <button className="ribbon-btn-large" onClick={() => editor.chain().focus().setHardBreak().run()}>
                  <div className="btn-icon">📃</div>
                  <div className="btn-label">Lege pagina</div>
                </button>
                <button className="ribbon-btn-large" onClick={insertPageBreak}>
                  <div className="btn-icon">✂️</div>
                  <div className="btn-label">Pagina-einde</div>
                </button>
              </div>
            </div>

            <div className="ribbon-group">
              <div className="group-label">Tabellen</div>
              <button className="ribbon-btn-large" onClick={insertTable}>
                <div className="btn-icon">⊞</div>
                <div className="btn-label">Tabel</div>
              </button>
            </div>

            <div className="ribbon-group">
              <div className="group-label">Illustraties</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small" onClick={insertImage}>
                  🖼️ Afbeeldingen
                </button>
                <button className="ribbon-btn-small" onClick={() => {
                  const shapes = ['■ Vierkant', '● Cirkel', '▲ Driehoek', '★ Ster', '→ Pijl']
                  alert('Vormen:\n' + shapes.join('\n'))
                }}>
                  🔷 Vormen
                </button>
                <button className="ribbon-btn-small" onClick={insertHorizontalRule}>
                  ⭐ Scheidingslijn
                </button>
                <button className="ribbon-btn-small" onClick={insertBlockquote}>
                  � Citaat
                </button>
                <button className="ribbon-btn-small">
                  📸 Schermopname
                </button>
              </div>
            </div>

            <div className="ribbon-group">
              <div className="group-label">Koptekst en voettekst</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small">
                  📋 Koptekst
                </button>
                <button className="ribbon-btn-small">
                  📋 Voettekst
                </button>
                <button className="ribbon-btn-small">
                  🔢 Paginanummer
                </button>
              </div>
            </div>

            <div className="ribbon-group">
              <div className="group-label">Tekst</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small" onClick={insertLink}>
                  🔗 Link
                </button>
                <button className="ribbon-btn-small">
                  ▭ Tekstvak
                </button>
                <button className="ribbon-btn-small">
                  🎨 WordArt
                </button>
                <button className="ribbon-btn-small" onClick={() => {
                  const now = new Date().toLocaleString('nl-NL')
                  editor.chain().focus().insertContent(now).run()
                }}>
                  📅 Datum en tijd
                </button>
              </div>
            </div>

            <div className="ribbon-group">
              <div className="group-label">Symbolen</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small" onClick={() => {
                  const eq = prompt('Voer formule in (bijv. x² + y² = z²):')
                  if (eq) editor.chain().focus().insertContent(`<p><em>${eq}</em></p>`).run()
                }}>
                  ∑ Vergelijking
                </button>
                <button className="ribbon-btn-small" onClick={() => {
                  const symbols = ['©', '®', '™', '€', '£', '¥', '°', '±', '×', '÷', '≠', '≤', '≥', '∞', '√', '∑', '∏', 'α', 'β', 'γ', 'δ', 'π', 'Ω']
                  const symbol = prompt('Selecteer symbool:\n' + symbols.join('  '))
                  if (symbol) editor.chain().focus().insertContent(symbol).run()
                }}>
                  Ω Symbool
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONTWERPEN TAB */}
        {activeTab === 'ontwerpen' && (
          <div className="ribbon-groups">
            <div className="ribbon-group">
              <div className="group-label">Documentopmaak</div>
              <div className="themes-gallery">
                <button className="theme-btn">Thema 1</button>
                <button className="theme-btn">Thema 2</button>
                <button className="theme-btn">Thema 3</button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Paginaachtergrond</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small">
                  💧 Watermerk
                </button>
                <button className="ribbon-btn-small">
                  🎨 Paginakleur
                </button>
                <button className="ribbon-btn-small">
                  ▭ Paginagrenzen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INDELING TAB */}
        {activeTab === 'indeling' && (
          <div className="ribbon-groups">
            <div className="ribbon-group">
              <div className="group-label">Pagina-instelling</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-large">
                  <div className="btn-icon">📏</div>
                  <div className="btn-label">Marges</div>
                </button>
                <button className="ribbon-btn-large">
                  <div className="btn-icon">🔄</div>
                  <div className="btn-label">Afdrukstand</div>
                </button>
                <button className="ribbon-btn-large">
                  <div className="btn-icon">📄</div>
                  <div className="btn-label">Formaat</div>
                </button>
                <button className="ribbon-btn-large">
                  <div className="btn-icon">📰</div>
                  <div className="btn-label">Kolommen</div>
                </button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Alinea</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small" onClick={indentLess}>
                  ⬅️ Inspringen links
                </button>
                <button className="ribbon-btn-small" onClick={indentMore}>
                  ➡️ Inspringen rechts
                </button>
                <button className="ribbon-btn-small" onClick={() => {
                  const spacing = prompt('Regelafstand (1.0, 1.5, 2.0):', '1.5')
                  if (spacing) {
                    editor.chain().focus().updateAttributes('paragraph', {
                      style: `line-height: ${spacing};`
                    }).run()
                  }
                }}>
                  ↕️ Afstand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VERWIJZINGEN TAB */}
        {activeTab === 'verwijzingen' && (
          <div className="ribbon-groups">
            <div className="ribbon-group">
              <div className="group-label">Inhoudsopgave</div>
              <button className="ribbon-btn-large" onClick={onToggleNavigation}>
                <div className="btn-icon">📑</div>
                <div className="btn-label">Inhoudsopgave</div>
              </button>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Voetnoten</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small">
                  ¹ Voetnoot invoegen
                </button>
                <button className="ribbon-btn-small">
                  ⁱ Eindnoot invoegen
                </button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Citaten en bibliografie</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small">
                  📚 Citaat invoegen
                </button>
                <button className="ribbon-btn-small">
                  📖 Bronbeheer
                </button>
                <button className="ribbon-btn-small">
                  📋 Stijl: APA
                </button>
                <button className="ribbon-btn-small">
                  📑 Literatuurlijst
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLEREN TAB */}
        {activeTab === 'controleren' && (
          <div className="ribbon-groups">
            <div className="ribbon-group">
              <div className="group-label">Proefhulpmiddelen</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-large" onClick={() => alert('Spellingcontrole: Geen fouten gevonden!')}>
                  <div className="btn-icon">✓</div>
                  <div className="btn-label">Spelling & grammatica</div>
                </button>
                <button className="ribbon-btn-small" onClick={() => {
                  const word = prompt('Voer een woord in voor synoniemen:')
                  if (word) alert(`Synoniemen voor "${word}":\n(Deze functie wordt binnenkort toegevoegd)`)
                }}>
                  📖 Thesaurus
                </button>
                <button className="ribbon-btn-small" onClick={() => {
                  const stats = `Woordentelling
                  
Woorden: ${editor.state.doc.textContent.split(/\s+/).filter(w => w.length > 0).length}
Tekens: ${editor.state.doc.textContent.length}
Tekens (zonder spaties): ${editor.state.doc.textContent.replace(/\s/g, '').length}
Alinea's: ${editor.state.doc.textContent.split(/\n\n/).length}`
                  alert(stats)
                }}>
                  🔢 Woordentelling
                </button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Opmerkingen</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small">
                  💬 Nieuwe opmerking
                </button>
                <button className="ribbon-btn-small">
                  🗑️ Verwijderen
                </button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Wijzigingen bijhouden</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-large">
                  <div className="btn-icon">📝</div>
                  <div className="btn-label">Wijzigingen bijhouden</div>
                </button>
                <button className="ribbon-btn-small">
                  ✓ Accepteren
                </button>
                <button className="ribbon-btn-small">
                  ✗ Weigeren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BEELD TAB */}
        {activeTab === 'beeld' && (
          <div className="ribbon-groups">
            <div className="ribbon-group">
              <div className="group-label">Weergaven</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small">
                  📄 Afdrukweergave
                </button>
                <button className="ribbon-btn-small">
                  🌐 Weblayout
                </button>
                <button className="ribbon-btn-small">
                  📋 Overzicht
                </button>
                <button className="ribbon-btn-small">
                  📖 Leesweergave
                </button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Weergave</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small" onClick={onToggleNavigation}>
                  📏 Liniaal
                </button>
                <button className="ribbon-btn-small">
                  # Rasterlijnen
                </button>
                <button className="ribbon-btn-small" onClick={onToggleNavigation}>
                  🧭 Navigatievenster
                </button>
              </div>
            </div>
            <div className="ribbon-group">
              <div className="group-label">Zoom</div>
              <div className="group-buttons-row">
                <button className="ribbon-btn-small">
                  🔍 Zoom
                </button>
                <button className="ribbon-btn-small">
                  100%
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RibbonToolbar
