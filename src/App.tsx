import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Camera,
  Check,
  Download,
  ImagePlus,
  Layers,
  RotateCcw,
  Share2,
  Sparkles,
  Video,
} from 'lucide-react'
import {
  composePhotoStrip,
  DEFAULT_CUSTOM_BRANDING,
  LOGO_IMAGE_URL,
  PHOTO_FRAMES,
  type BrandingPlacement,
  type FrameId,
} from './compose'
import FrameStudio from './FrameStudio'
import { deleteFrameDesign, loadFrameDesigns, saveFrameDesign, type FrameDesign } from './frameDesigns'
import './App.css'

const PHOTO_COUNT = 2

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read this image.'))
    }
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.readAsDataURL(file)
  })
}

function getImageAspectRatio(source: string) {
  return new Promise<number>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image.naturalWidth / image.naturalHeight)
    image.onerror = () => reject(new Error('Could not load image.'))
    image.src = source
  })
}

function cameraErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Camera access was blocked. Upload photos to continue.'
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'No camera was found. Upload photos to continue.'
    }
  }
  return 'Camera unavailable. Upload photos to continue.'
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const frameInputRef = useRef<HTMLInputElement>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [frame, setFrame] = useState<FrameId | 'custom' | 'saved'>('signature')
  const [savedFrames, setSavedFrames] = useState<FrameDesign[]>([])
  const [selectedSavedFrameId, setSelectedSavedFrameId] = useState('')
  const [isStudioOpen, setIsStudioOpen] = useState(false)
  const [customFrame, setCustomFrame] = useState('')
  const [customFrameName, setCustomFrameName] = useState('')
  const [customFrameAspectRatio, setCustomFrameAspectRatio] = useState(1)
  const [customBranding, setCustomBranding] = useState(DEFAULT_CUSTOM_BRANDING)
  const [draftCustomBranding, setDraftCustomBranding] = useState(DEFAULT_CUSTOM_BRANDING)
  const [isEditingCustomBranding, setIsEditingCustomBranding] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState('')
  const [stripImage, setStripImage] = useState('')
  const [composeError, setComposeError] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const brandingDragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number } | null>(null)
  const customPreviewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isCurrent = true
    loadFrameDesigns()
      .then((designs) => { if (isCurrent) setSavedFrames(designs) })
      .catch(() => { if (isCurrent) setComposeError('Saved frames could not be loaded from this browser.') })
    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!stream || !video) return

    video.srcObject = stream
    return () => {
      stream.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }
  }, [stream])

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearTimeout(countdownTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (photos.length !== PHOTO_COUNT) return

    let isCurrent = true
    const selectedSavedFrame = savedFrames.find((design) => design.id === selectedSavedFrameId)
    composePhotoStrip(
      photos,
      frame,
      customFrame,
      customBranding,
      !isEditingCustomBranding,
      selectedSavedFrame,
    )
      .then((image) => {
        if (isCurrent) setStripImage(image)
      })
      .catch(() => {
        if (isCurrent) setComposeError('The photo strip could not be created. Please try again.')
      })

    return () => {
      isCurrent = false
    }
  }, [photos, frame, customFrame, customBranding, isEditingCustomBranding, savedFrames, selectedSavedFrameId])

  async function enableCamera() {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable here. Upload photos to continue.')
      return
    }

    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user' },
      })
      setStream(cameraStream)
    } catch (error) {
      setCameraError(cameraErrorMessage(error))
    }
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || countdown !== null) return

    let remaining = 3
    setCountdown(remaining)

    const tick = () => {
      remaining -= 1
      if (remaining === 0) {
        setCountdown(null)
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext('2d')
        if (!context) return
        context.translate(canvas.width, 0)
        context.scale(-1, 1)
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        setPhotos((current) => [...current, canvas.toDataURL('image/jpeg', 0.94)].slice(0, PHOTO_COUNT))
        setStripImage('')
        setComposeError('')
        setShareMessage('')
        if (photos.length + 1 >= PHOTO_COUNT) setStream(null)
        return
      }

      setCountdown(remaining)
      countdownTimerRef.current = window.setTimeout(tick, 850)
    }

    countdownTimerRef.current = window.setTimeout(tick, 850)
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, PHOTO_COUNT - photos.length)
    event.target.value = ''
    if (files.length === 0) return

    try {
      const uploadedPhotos = await Promise.all(files.map(fileToDataUrl))
      setPhotos((current) => [...current, ...uploadedPhotos].slice(0, PHOTO_COUNT))
      setStripImage('')
      setComposeError('')
      setCameraError('')
      setShareMessage('')
      if (photos.length + uploadedPhotos.length >= PHOTO_COUNT) setStream(null)
    } catch {
      setCameraError('One of those images could not be opened. Please try another file.')
    }
  }

  async function handleFrameUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.type !== 'image/png') {
      setComposeError('Choose a transparent PNG frame.')
      return
    }

    try {
      const uploadedFrame = await fileToDataUrl(file)
      const aspectRatio = await getImageAspectRatio(uploadedFrame)
      setCustomFrame(uploadedFrame)
      setCustomFrameName(file.name)
      setCustomFrameAspectRatio(aspectRatio)
      setCustomBranding(DEFAULT_CUSTOM_BRANDING)
      setDraftCustomBranding(DEFAULT_CUSTOM_BRANDING)
      setIsEditingCustomBranding(false)
      setFrame('custom')
      setStripImage('')
      setComposeError('')
      setShareMessage('')
    } catch {
      setComposeError('That frame could not be opened. Please choose another PNG.')
    }
  }

  function resetPhotos() {
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdown(null)
    setPhotos([])
    setStripImage('')
    setShareMessage('')
    setComposeError('')
  }

  function selectFrame(nextFrame: FrameId | 'custom' | 'saved') {
    if (nextFrame === frame) return
    setFrame(nextFrame)
    setStripImage('')
    setComposeError('')
    setShareMessage('')
  }

  function selectSavedFrame(id: string) {
    setSelectedSavedFrameId(id)
    if (frame !== 'saved') {
      selectFrame('saved')
      return
    }
    setStripImage('')
    setComposeError('')
    setShareMessage('')
  }

  async function persistFrameDesign(design: FrameDesign) {
    await saveFrameDesign(design)
    setSavedFrames(await loadFrameDesigns())
  }

  async function removeFrameDesign(id: string) {
    await deleteFrameDesign(id)
    setSavedFrames(await loadFrameDesigns())
    if (selectedSavedFrameId === id) {
      setSelectedSavedFrameId('')
      setFrame('signature')
    }
  }

  function startCustomBrandingEdit() {
    setDraftCustomBranding(customBranding)
    setIsEditingCustomBranding(true)
    setStripImage('')
    setComposeError('')
  }

  function updateDraftBranding(next: BrandingPlacement) {
    const halfWidth = next.width / 2
    const halfHeight = next.width * 0.22 * customFrameAspectRatio / 2
    setDraftCustomBranding({
      ...next,
      x: Math.max(halfWidth, Math.min(1 - halfWidth, next.x)),
      y: Math.max(halfHeight, Math.min(1 - halfHeight, next.y)),
    })
  }

  function startBrandingDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!isEditingCustomBranding || !customPreviewRef.current) return
    event.preventDefault()
    const bounds = customPreviewRef.current.getBoundingClientRect()
    brandingDragRef.current = {
      pointerId: event.pointerId,
      offsetX: (event.clientX - bounds.left) / bounds.width - draftCustomBranding.x,
      offsetY: (event.clientY - bounds.top) / bounds.height - draftCustomBranding.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveBranding(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = brandingDragRef.current
    const bounds = customPreviewRef.current?.getBoundingClientRect()
    if (!drag || drag.pointerId !== event.pointerId || !bounds) return
    updateDraftBranding({
      ...draftCustomBranding,
      x: (event.clientX - bounds.left) / bounds.width - drag.offsetX,
      y: (event.clientY - bounds.top) / bounds.height - drag.offsetY,
    })
  }

  function stopBrandingDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (brandingDragRef.current?.pointerId === event.pointerId) brandingDragRef.current = null
  }

  function applyCustomBranding() {
    setCustomBranding(draftCustomBranding)
    setIsEditingCustomBranding(false)
    setStripImage('')
    setComposeError('')
    setShareMessage('')
  }

  function downloadStrip() {
    if (!stripImage) return
    const link = document.createElement('a')
    link.href = stripImage
    link.download = 'jain-genius-photo-strip.png'
    link.click()
  }

  async function shareStrip() {
    if (!stripImage) return

    try {
      const imageBlob = await (await fetch(stripImage)).blob()
      const imageFile = new File([imageBlob], 'jain-genius-photo-strip.png', {
        type: 'image/png',
      })
      if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [imageFile] }))) {
        downloadStrip()
        setShareMessage('Sharing is unavailable here. Your image was downloaded instead.')
        return
      }
      await navigator.share({ files: [imageFile], title: 'JainGenius Photo Booth' })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      downloadStrip()
      setShareMessage('Sharing is unavailable here. Your image was downloaded instead.')
    }
  }

  const photoProgress = `${String(photos.length).padStart(2, '0')} / 02`
  const hasTwoPhotos = photos.length === PHOTO_COUNT
  const isComposing = hasTwoPhotos && !stripImage && !composeError
  const selectedFrame = PHOTO_FRAMES.find((option) => option.id === frame)
  const selectedSavedFrame = savedFrames.find((design) => design.id === selectedSavedFrameId)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="JainGenius Photo Booth home">
          <img src={LOGO_IMAGE_URL} alt="" />
          <span className="brand-wordmark">
            <strong>JainGenius</strong>
            <small>The Change Makers</small>
          </span>
        </a>
        <div className="topbar-tools">
          <button className="studio-nav-action" type="button" onClick={() => {
            if (!isStudioOpen) setStream(null)
            setIsStudioOpen(!isStudioOpen)
          }}>
            <Layers size={15} /> {isStudioOpen ? 'Photo booth' : 'Frame studio'}
          </button>
          <div className="event-mark"><span /> PHOTO BOOTH</div>
        </div>
      </header>

      {isStudioOpen ? (
        <FrameStudio
          designs={savedFrames}
          starters={PHOTO_FRAMES.filter((option) => option.id !== 'signature')}
          onSave={persistFrameDesign}
          onDelete={removeFrameDesign}
          onClose={() => setIsStudioOpen(false)}
        />
      ) : <main id="top" className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">JAIN GENIUS <span>/</span> THE CHANGE MAKERS</p>
            <h1>Photo booth<span>.</span></h1>
          </div>
          <div className="shot-counter" aria-live="polite">
            <span className="counter-label">YOUR SESSION</span>
            <strong>{photoProgress}</strong>
          </div>
        </div>

        <div className="booth-grid">
          <section className="capture-column" aria-label="Photo capture">
            <div className="section-heading">
              <div className="section-title"><span className="step-number">01</span><h2>Capture</h2></div>
              <span className={`camera-status ${stream ? 'is-live' : ''}`}>
                <span className="status-dot" /> {stream ? 'CAMERA LIVE' : 'CAMERA OFF'}
              </span>
            </div>

            <div className="camera-stage">
              {stream ? (
                <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera preview" />
              ) : hasTwoPhotos ? (
                <img className="last-capture" src={photos[1]} alt="Second captured photo" />
              ) : (
                <div className="camera-idle">
                  <div className="idle-orbit orbit-one" />
                  <div className="idle-orbit orbit-two" />
                  <img src={LOGO_IMAGE_URL} alt="JainGenius" />
                  <span>READY WHEN YOU ARE</span>
                </div>
              )}
              {stream && <span className="live-view-label"><span /> LIVE VIEW</span>}
              {countdown !== null && <div className="countdown" aria-live="assertive">{countdown}</div>}
              <div className="stage-corner stage-corner-tl" />
              <div className="stage-corner stage-corner-br" />
            </div>

            <div className="capture-meta">
              <div className="shot-slots" aria-label={`${photos.length} of ${PHOTO_COUNT} photos captured`}>
                {Array.from({ length: PHOTO_COUNT }, (_, index) => (
                  <span className={`shot-slot ${photos[index] ? 'is-filled' : ''}`} key={index}>
                    {photos[index] ? <img src={photos[index]} alt={`Captured photo ${index + 1}`} /> : `0${index + 1}`}
                  </span>
                ))}
              </div>
              <span className="capture-sequence">{hasTwoPhotos ? 'STRIP READY' : `SHOT ${String(photos.length + 1).padStart(2, '0')} OF 02`}</span>
            </div>

            {cameraError && <p className="inline-message" role="status">{cameraError}</p>}

            <div className="capture-actions">
              {hasTwoPhotos ? (
                <button className="primary-action" type="button" onClick={() => { resetPhotos(); void enableCamera() }}>
                  <RotateCcw size={18} /> New strip
                </button>
              ) : stream ? (
                <button className="primary-action" type="button" onClick={capturePhoto} disabled={countdown !== null}>
                  <Camera size={19} /> {countdown !== null ? 'Hold that pose' : `Capture photo ${photos.length + 1}`}
                </button>
              ) : (
                <button className="primary-action" type="button" onClick={() => void enableCamera()}>
                  <Video size={18} /> Enable camera
                </button>
              )}
              <button className="secondary-action" type="button" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={18} /> Upload photos
              </button>
              {photos.length > 0 && !hasTwoPhotos && (
                <button className="icon-action" type="button" onClick={() => setPhotos((current) => current.slice(0, -1))} aria-label="Remove last photo" title="Remove last photo">
                  <RotateCcw size={17} />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(event) => void handleUpload(event)} />
            </div>
            <p className="camera-note">Your photos stay on this device.</p>
          </section>

          <section className="strip-column" aria-label="Photo strip preview">
            <div className="section-heading strip-heading">
              <div className="section-title"><span className="step-number">02</span><h2>Your strip</h2></div>
              {hasTwoPhotos && stripImage && <span className="ready-label"><Check size={14} /> READY</span>}
            </div>

            <div className="frame-options" role="radiogroup" aria-label="Choose a photo frame">
              {PHOTO_FRAMES.map((option) => (
                <button
                  className={`frame-option ${frame === option.id ? 'is-selected' : ''}`}
                  type="button"
                  role="radio"
                  aria-checked={frame === option.id}
                  onClick={() => selectFrame(option.id)}
                  key={option.id}
                >
                  <span className={`frame-swatch ${option.id === 'signature' ? 'signature-swatch' : ''}`}>
                    <img src={option.image} alt="" />
                  </span>
                  <span className="frame-option-copy">
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                  {frame === option.id && <Check className="frame-check" size={16} />}
                </button>
              ))}
              {customFrame && (
                <button
                  className={`frame-option ${frame === 'custom' ? 'is-selected' : ''}`}
                  type="button"
                  role="radio"
                  aria-checked={frame === 'custom'}
                  onClick={() => selectFrame('custom')}
                >
                  <span className="frame-swatch"><img src={customFrame} alt="" /></span>
                  <span className="frame-option-copy">
                    <strong>{customFrameName}</strong>
                    <small>Custom PNG frame</small>
                  </span>
                  {frame === 'custom' && <Check className="frame-check" size={16} />}
                </button>
              )}
              {savedFrames.map((design) => {
                const thumbnail = design.layers.at(-1)?.image || design.backgroundImage || LOGO_IMAGE_URL
                return (
                  <button
                    className={`frame-option ${frame === 'saved' && selectedSavedFrameId === design.id ? 'is-selected' : ''}`}
                    type="button"
                    role="radio"
                    aria-checked={frame === 'saved' && selectedSavedFrameId === design.id}
                    onClick={() => selectSavedFrame(design.id)}
                    key={design.id}
                  >
                    <span className="frame-swatch"><img src={thumbnail} alt="" /></span>
                    <span className="frame-option-copy"><strong>{design.name}</strong><small>Saved frame</small></span>
                    {frame === 'saved' && selectedSavedFrameId === design.id && <Check className="frame-check" size={16} />}
                  </button>
                )
              })}
            </div>
            <button className="frame-upload-action" type="button" onClick={() => frameInputRef.current?.click()}>
              <ImagePlus size={16} /> {customFrame ? 'Replace custom frame' : 'Upload a PNG frame'}
            </button>
            <input
              ref={frameInputRef}
              type="file"
              accept="image/png"
              hidden
              onChange={(event) => void handleFrameUpload(event)}
            />

            <div className="strip-preview-wrap" aria-live="polite">
              <span className="preview-ruler ruler-top">JG — 01</span>
              {stripImage ? (
                frame === 'custom' ? (
                  <div
                    className="custom-preview-canvas"
                    ref={customPreviewRef}
                    style={{ '--custom-image-ratio': customFrameAspectRatio } as CSSProperties}
                  >
                    <img
                      className="strip-preview custom-preview-image"
                      src={stripImage}
                      alt={isEditingCustomBranding ? 'Photo strip with editable branding placement' : 'Finished JainGenius photo strip'}
                    />
                    {isEditingCustomBranding && (
                      <button
                        className="custom-branding-lockup"
                        type="button"
                        aria-label="Drag to reposition JainGenius branding"
                        style={{
                          left: `${draftCustomBranding.x * 100}%`,
                          top: `${draftCustomBranding.y * 100}%`,
                          width: `${draftCustomBranding.width * 100}%`,
                        }}
                        onPointerDown={startBrandingDrag}
                        onPointerMove={moveBranding}
                        onPointerUp={stopBrandingDrag}
                        onPointerCancel={stopBrandingDrag}
                      >
                        <img src={LOGO_IMAGE_URL} alt="" />
                        <span><strong>JainGenius</strong><small>THE CHANGE MAKERS</small></span>
                      </button>
                    )}
                  </div>
                ) : (
                  <img className="strip-preview" src={stripImage} alt="Finished JainGenius photo strip" />
                )
              ) : frame === 'custom' && customFrame ? (
                <img className="strip-preview frame-placeholder" src={customFrame} alt={`${customFrameName} frame preview`} />
              ) : frame === 'saved' && selectedSavedFrame ? (
                <img className="strip-preview frame-placeholder" src={selectedSavedFrame.layers.at(-1)?.image || selectedSavedFrame.backgroundImage || LOGO_IMAGE_URL} alt={`${selectedSavedFrame.name} frame preview`} />
              ) : frame !== 'signature' ? (
                <img className="strip-preview frame-placeholder" src={selectedFrame?.image ?? LOGO_IMAGE_URL} alt={`${selectedFrame?.title ?? 'JainGenius'} frame preview`} />
              ) : (
                <div className="signature-preview" aria-label="JainGenius signature photo frame preview">
                  <img className="signature-logo" src={LOGO_IMAGE_URL} alt="" />
                  <strong>JAIN GENIUS</strong>
                  <span className="signature-tagline">THE CHANGE MAKERS</span>
                  <div className="signature-window" />
                  <div className="signature-window" />
                  <span className="signature-footer">A MOMENT TO KEEP</span>
                </div>
              )}
              {isComposing && <div className="preview-loading"><Sparkles size={16} /> PREPARING YOUR STRIP</div>}
              {composeError && <p className="compose-error" role="alert">{composeError}</p>}
              <span className="preview-ruler ruler-bottom">THE CHANGE MAKERS</span>
            </div>

            {frame === 'custom' && hasTwoPhotos && stripImage && !isEditingCustomBranding && (
              <button className="frame-upload-action branding-edit-action" type="button" onClick={startCustomBrandingEdit}>
                Adjust logo placement
              </button>
            )}
            {frame === 'custom' && isEditingCustomBranding && (
              <div className="branding-controls">
                <label>
                  <span>Horizontal</span>
                  <input
                    type="range"
                    min={Math.ceil(draftCustomBranding.width * 50)}
                    max={Math.floor(100 - draftCustomBranding.width * 50)}
                    value={Math.round(draftCustomBranding.x * 100)}
                    onChange={(event) => updateDraftBranding({ ...draftCustomBranding, x: Number(event.target.value) / 100 })}
                  />
                </label>
                <label>
                  <span>Vertical</span>
                  <input
                    type="range"
                    min={Math.ceil(draftCustomBranding.width * 0.22 * customFrameAspectRatio * 50)}
                    max={Math.floor(100 - draftCustomBranding.width * 0.22 * customFrameAspectRatio * 50)}
                    value={Math.round(draftCustomBranding.y * 100)}
                    onChange={(event) => updateDraftBranding({ ...draftCustomBranding, y: Number(event.target.value) / 100 })}
                  />
                </label>
                <label>
                  <span>Size</span>
                  <input
                    type="range"
                    min="24"
                    max="76"
                    value={Math.round(draftCustomBranding.width * 100)}
                    onChange={(event) => updateDraftBranding({ ...draftCustomBranding, width: Number(event.target.value) / 100 })}
                  />
                </label>
                <button className="primary-action" type="button" onClick={applyCustomBranding}>Apply placement</button>
              </div>
            )}

            {stripImage && (
              <div className="result-actions">
                <button className="download-action" type="button" onClick={downloadStrip}><Download size={17} /> Download</button>
                <button className="share-action" type="button" onClick={() => void shareStrip()}><Share2 size={17} /> Share</button>
              </div>
            )}
            {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
          </section>
        </div>

        <footer className="page-footer"><span>JAIN GENIUS</span><span className="footer-line" /><span>THE CHANGE MAKERS</span></footer>
      </main>}
    </div>
  )
}

export default App