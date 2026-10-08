import { useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Plus, Save, Sticker, Trash2 } from 'lucide-react'
import type { FrameDesign, FrameLayer, FramePhotoSlot } from './frameDesigns'
import './FrameStudio.css'

export type FrameStarter = { id: string; title: string; image: string }

type FrameStudioProps = {
  designs: FrameDesign[]
  starters: FrameStarter[]
  onSave: (design: FrameDesign) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

type DragState = {
  pointerId: number
  itemId: string
  kind: 'layer' | 'slot'
  mode: 'move' | 'resize'
  startX: number
  startY: number
  x: number
  y: number
  width: number
  height: number
}

function createDesign(name = 'Untitled frame'): FrameDesign {
  return {
    id: crypto.randomUUID(),
    name,
    width: 900,
    height: 1600,
    background: '#f1eee5',
    backgroundImage: '',
    layers: [],
    photoSlots: [
      { id: 'photo-1', x: 0.12, y: 0.11, width: 0.76, height: 0.34 },
      { id: 'photo-2', x: 0.12, y: 0.55, width: 0.76, height: 0.34 },
    ],
    updatedAt: Date.now(),
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this image.'))
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.readAsDataURL(file)
  })
}

function imageDimensions(source: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Could not open this image.'))
    image.src = source
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export default function FrameStudio({ designs, starters, onSave, onDelete, onClose }: FrameStudioProps) {
  const [draft, setDraft] = useState(() => createDesign())
  const [selectedId, setSelectedId] = useState('photo-1')
  const [status, setStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameInputRef = useRef<HTMLInputElement>(null)
  const stickerInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const selectedLayer = draft.layers.find((layer) => layer.id === selectedId)
  const selectedSlot = draft.photoSlots.find((slot) => slot.id === selectedId)
  const selectedItem = selectedLayer ?? selectedSlot

  function startNewDesign() {
    setDraft(createDesign())
    setSelectedId('photo-1')
    setStatus('New frame')
  }

  async function loadStarter(starter: FrameStarter) {
    try {
      const dimensions = await imageDimensions(starter.image)
      const next = createDesign(starter.title)
      next.width = dimensions.width
      next.height = dimensions.height
      next.backgroundImage = starter.image
      setDraft(next)
      setSelectedId('photo-1')
      setStatus('Starter loaded. Adjust the photo windows to fit.')
    } catch {
      setStatus('This starter image could not be opened.')
    }
  }

  async function addImage(event: ChangeEvent<HTMLInputElement>, kind: 'frame' | 'sticker') {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (kind === 'frame' && file.type !== 'image/png') {
      setStatus('Frame overlays must be PNG files.')
      return
    }

    try {
      const image = await fileToDataUrl(file)
      const dimensions = await imageDimensions(image)
      const layerWidth = kind === 'frame' ? 1 : Math.min(0.28, 360 / draft.width)
      const layerHeight = kind === 'frame' ? 1 : layerWidth * dimensions.height / dimensions.width * draft.width / draft.height
      const layer: FrameLayer = {
        id: crypto.randomUUID(),
        name: file.name,
        image,
        x: (1 - layerWidth) / 2,
        y: (1 - layerHeight) / 2,
        width: layerWidth,
        height: layerHeight,
        rotation: 0,
      }
      setDraft((current) => ({ ...current, layers: [...current.layers, layer] }))
      setSelectedId(layer.id)
      setStatus(kind === 'frame' ? 'Frame layer added.' : 'Sticker added.')
    } catch {
      setStatus('That image could not be opened.')
    }
  }

  function updateLayer(id: string, update: Partial<FrameLayer>) {
    setDraft((current) => ({
      ...current,
      layers: current.layers.map((layer) => layer.id === id ? { ...layer, ...update } : layer),
    }))
  }

  function updateSlot(id: string, update: Partial<FramePhotoSlot>) {
    setDraft((current) => ({
      ...current,
      photoSlots: current.photoSlots.map((slot) => slot.id === id ? { ...slot, ...update } : slot),
    }))
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, kind: DragState['kind'], item: FrameLayer | FramePhotoSlot) {
    if (!stageRef.current) return
    event.preventDefault()
    event.stopPropagation()
    const target = event.target as HTMLElement
    const mode = target.closest('[data-resize]') ? 'resize' : 'move'
    dragRef.current = {
      pointerId: event.pointerId,
      itemId: item.id,
      kind,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    }
    setSelectedId(item.id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveItem(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    const bounds = stageRef.current?.getBoundingClientRect()
    if (!drag || !bounds || drag.pointerId !== event.pointerId) return
    const deltaX = (event.clientX - drag.startX) / bounds.width
    const deltaY = (event.clientY - drag.startY) / bounds.height

    if (drag.mode === 'move') {
      const update = {
        x: clamp(drag.x + deltaX, 0, 1 - drag.width),
        y: clamp(drag.y + deltaY, 0, 1 - drag.height),
      }
      if (drag.kind === 'layer') updateLayer(drag.itemId, update)
      else updateSlot(drag.itemId, update)
      return
    }

    if (drag.kind === 'layer') {
      const scale = Math.max(0.08, 1 + Math.max(deltaX / drag.width, deltaY / drag.height))
      const width = Math.min(2, drag.width * scale)
      const height = Math.min(2, drag.height * scale)
      updateLayer(drag.itemId, {
        width,
        height,
        x: clamp(drag.x, 0, 1 - Math.min(width, 1)),
        y: clamp(drag.y, 0, 1 - Math.min(height, 1)),
      })
    } else {
      updateSlot(drag.itemId, {
        width: clamp(drag.width + deltaX, 0.04, 1 - drag.x),
        height: clamp(drag.height + deltaY, 0.04, 1 - drag.y),
      })
    }
  }

  function stopDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  function updateSelected(key: 'x' | 'y' | 'width' | 'height', value: number) {
    if (!selectedItem) return
    const normalized = clamp(value / 100, 0.02, 1)
    if (selectedLayer) {
      const nextValue = key === 'x' ? clamp(normalized, 0, 1 - selectedLayer.width)
        : key === 'y' ? clamp(normalized, 0, 1 - selectedLayer.height)
          : normalized
      updateLayer(selectedLayer.id, { [key]: nextValue })
    } else if (selectedSlot) {
      const nextValue = key === 'x' ? clamp(normalized, 0, 1 - selectedSlot.width)
        : key === 'y' ? clamp(normalized, 0, 1 - selectedSlot.height)
          : normalized
      updateSlot(selectedSlot.id, { [key]: nextValue })
    }
  }

  function reorderLayer(direction: -1 | 1) {
    if (!selectedLayer) return
    setDraft((current) => {
      const index = current.layers.findIndex((layer) => layer.id === selectedLayer.id)
      const nextIndex = clamp(index + direction, 0, current.layers.length - 1)
      const layers = [...current.layers]
      const [layer] = layers.splice(index, 1)
      layers.splice(nextIndex, 0, layer)
      return { ...current, layers }
    })
  }

  async function saveDraft() {
    const name = draft.name.trim()
    if (!name) {
      setStatus('Give this frame a name before saving.')
      return
    }
    setIsSaving(true)
    try {
      await onSave({ ...draft, name, updatedAt: Date.now() })
      setDraft((current) => ({ ...current, name }))
      setStatus('Saved on this device.')
    } catch {
      setStatus('Could not save. The browser may be low on storage.')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeDesign(id: string) {
    if (!window.confirm('Delete this saved frame from this device?')) return
    try {
      await onDelete(id)
      if (draft.id === id) startNewDesign()
      setStatus('Saved frame deleted.')
    } catch {
      setStatus('Could not delete this frame.')
    }
  }

  const stageStyle = {
    '--studio-ratio': `${draft.width} / ${draft.height}`,
    backgroundColor: draft.background,
  } as CSSProperties

  return (
    <main className="studio-page">
      <div className="studio-heading">
        <div>
          <p className="eyebrow">JAIN GENIUS <span>/</span> FRAME STUDIO</p>
          <h1>Build a frame<span>.</span></h1>
        </div>
        <button className="studio-back" type="button" onClick={onClose}><ArrowLeft size={16} /> Back to booth</button>
      </div>

      <div className="studio-toolbar">
        <label className="studio-name-field">
          <span>FRAME NAME</span>
          <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} maxLength={48} />
        </label>
        <div className="studio-toolbar-actions">
          <button className="studio-quiet-button" type="button" onClick={startNewDesign}><Plus size={16} /> New frame</button>
          <button className="studio-save-button" type="button" onClick={() => void saveDraft()} disabled={isSaving}><Save size={16} /> {isSaving ? 'Saving' : 'Save locally'}</button>
        </div>
      </div>

      <div className="studio-workspace">
        <section className="studio-stage-column" aria-label="Frame canvas">
          <div className="studio-stage-header"><span>CANVAS</span><span>{draft.width} × {draft.height}</span></div>
          <div className="studio-stage-wrap">
            <div className="studio-canvas" ref={stageRef} style={stageStyle}>
              {draft.backgroundImage && <img className="studio-background" src={draft.backgroundImage} alt="" />}
              {draft.photoSlots.map((slot, index) => (
                <button
                  className={`studio-photo-slot ${selectedId === slot.id ? 'is-selected' : ''}`}
                  key={slot.id}
                  type="button"
                  aria-label={`Photo ${index + 1} window, drag to move or resize handle to adjust`}
                  style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.width * 100}%`, height: `${slot.height * 100}%` }}
                  onPointerDown={(event) => startDrag(event, 'slot', slot)}
                  onPointerMove={moveItem}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                >
                  <span>PHOTO 0{index + 1}</span>
                  <i data-resize="true" aria-hidden="true" />
                </button>
              ))}
              {draft.layers.map((layer) => (
                <button
                  className={`studio-layer ${selectedId === layer.id ? 'is-selected' : ''}`}
                  key={layer.id}
                  type="button"
                  aria-label={`${layer.name}, drag to move or resize handle to adjust`}
                  style={{ left: `${layer.x * 100}%`, top: `${layer.y * 100}%`, width: `${layer.width * 100}%`, height: `${layer.height * 100}%`, transform: `rotate(${layer.rotation}deg)` }}
                  onPointerDown={(event) => startDrag(event, 'layer', layer)}
                  onPointerMove={moveItem}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                >
                  <img src={layer.image} alt="" draggable="false" />
                  {selectedId === layer.id && <i data-resize="true" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
          <p className="studio-canvas-note">Select a photo window or image layer to move and format it.</p>
        </section>

        <aside className="studio-controls" aria-label="Frame tools">
          <section className="studio-tool-section">
            <div className="studio-section-title"><span>01</span><h2>Add artwork</h2></div>
            <div className="studio-tool-buttons">
              <button type="button" onClick={() => frameInputRef.current?.click()}><ImagePlus size={16} /> PNG frame</button>
              <button type="button" onClick={() => stickerInputRef.current?.click()}><Sticker size={16} /> Sticker or logo</button>
            </div>
            <input ref={frameInputRef} type="file" accept="image/png" hidden onChange={(event) => void addImage(event, 'frame')} />
            <input ref={stickerInputRef} type="file" accept="image/*" hidden onChange={(event) => void addImage(event, 'sticker')} />
            <label className="studio-color-field"><span>Canvas color</span><input type="color" value={draft.background} onChange={(event) => setDraft((current) => ({ ...current, background: event.target.value }))} /></label>
            <div className="studio-starters">
              <span className="studio-field-label">START FROM AN EXISTING FRAME</span>
              <div>{starters.map((starter) => (
                <button key={starter.id} type="button" title={`Edit a copy of ${starter.title}`} onClick={() => void loadStarter(starter)}>
                  <img src={starter.image} alt="" /><span>{starter.title}</span>
                </button>
              ))}</div>
            </div>
          </section>

          <section className="studio-tool-section">
            <div className="studio-section-title"><span>02</span><h2>Selected layer</h2></div>
            <div className="studio-element-list" aria-label="Canvas elements">
              {draft.photoSlots.map((slot, index) => (
                <button className={selectedId === slot.id ? 'is-selected' : ''} type="button" aria-pressed={selectedId === slot.id} key={slot.id} onClick={() => setSelectedId(slot.id)}>
                  <span>PHOTO 0{index + 1}</span><small>Window</small>
                </button>
              ))}
              {draft.layers.map((layer) => (
                <button className={selectedId === layer.id ? 'is-selected' : ''} type="button" aria-pressed={selectedId === layer.id} key={layer.id} onClick={() => setSelectedId(layer.id)}>
                  <span>{layer.name}</span><small>Image</small>
                </button>
              ))}
            </div>
            {selectedItem ? (
              <>
                <p className="studio-selection-name">{selectedLayer?.name ?? `Photo window ${selectedId.slice(-1)}`}</p>
                <div className="studio-property-grid">
                  {(['x', 'y', 'width', 'height'] as const).map((key) => (
                    <label key={key}><span>{key === 'x' ? 'X' : key === 'y' ? 'Y' : key === 'width' ? 'W' : 'H'} %</span>
                      <input type="number" min="0" max="200" step="1" value={Math.round(selectedItem[key] * 100)} onChange={(event) => updateSelected(key, Number(event.target.value))} />
                    </label>
                  ))}
                  {selectedLayer && <label><span>ROTATION</span><input type="number" min="-180" max="180" step="1" value={selectedLayer.rotation} onChange={(event) => updateLayer(selectedLayer.id, { rotation: Number(event.target.value) })} /></label>}
                </div>
                {selectedLayer && <div className="studio-layer-actions">
                  <button type="button" title="Send layer backward" aria-label="Send layer backward" onClick={() => reorderLayer(-1)}><ArrowDown size={15} /></button>
                  <button type="button" title="Bring layer forward" aria-label="Bring layer forward" onClick={() => reorderLayer(1)}><ArrowUp size={15} /></button>
                  <button type="button" title="Delete layer" aria-label="Delete layer" onClick={() => { setDraft((current) => ({ ...current, layers: current.layers.filter((layer) => layer.id !== selectedLayer.id) })); setSelectedId('photo-1') }}><Trash2 size={15} /></button>
                </div>}
              </>
            ) : <p className="studio-empty-selection">Choose a layer on the canvas.</p>}
          </section>

          <section className="studio-tool-section studio-library">
            <div className="studio-section-title"><span>03</span><h2>Saved on this device</h2></div>
            {designs.length ? designs.map((design) => (
              <div className={`studio-saved-row ${draft.id === design.id ? 'is-current' : ''}`} key={design.id}>
                <button type="button" onClick={() => { setDraft({ ...design, layers: design.layers.map((layer) => ({ ...layer })), photoSlots: design.photoSlots.map((slot) => ({ ...slot })) }); setSelectedId(design.photoSlots[0]?.id ?? '') }}>
                  <strong>{design.name}</strong><small>{design.layers.length} image layers</small>
                </button>
                <button type="button" aria-label={`Delete ${design.name}`} title="Delete frame" onClick={() => void removeDesign(design.id)}><Trash2 size={14} /></button>
              </div>
            )) : <p className="studio-empty-selection">Your saved designs will appear here.</p>}
          </section>
          <p className="studio-status" role="status">{status || 'Changes are stored in this browser when you save.'}</p>
        </aside>
      </div>
    </main>
  )
}