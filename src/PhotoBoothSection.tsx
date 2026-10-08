import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import {
  Camera,
  Check,
  Download,
  ImagePlus,
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

interface PhotoBoothSectionProps {
  videoRef: React.RefObject<HTMLVideoElement>
  fileInputRef: React.RefObject<HTMLInputElement>
  frameInputRef: React.RefObject<HTMLInputElement>
  countdownTimerRef: React.RefObject<number | null>
  stream: MediaStream | null
  setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>
  photos: string[]
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>
  frame: FrameId | 'custom'
  setFrame: React.Dispatch<React.SetStateAction<FrameId | 'custom'>>
  customFrame: string
  setCustomFrame: React.Dispatch<React.SetStateAction<string>>
  customFrameName: string
  setCustomFrameName: React.Dispatch<React.SetStateAction<string>>
  customFrameAspectRatio: number
  setCustomFrameAspectRatio: React.Dispatch<React.SetStateAction<number>>
  customBranding: BrandingPlacement
  setCustomBranding: React.Dispatch<React.SetStateAction<BrandingPlacement>>
  draftCustomBranding: BrandingPlacement
  setDraftCustomBranding: React.Dispatch<React.SetStateAction<BrandingPlacement>>
  isEditingCustomBranding: boolean
  setIsEditingCustomBranding: React.Dispatch<React.SetStateAction<boolean>>
  countdown: number | null
  setCountdown: React.Dispatch<React.SetStateAction<number | null>>
  cameraError: string
  setCameraError: React.Dispatch<React.SetStateAction<string>>
  stripImage: string
  setStripImage: React.Dispatch<React.SetStateAction<string>>
  composeError: string
  setComposeError: React.Dispatch<React.SetStateAction<string>>
  shareMessage: string
  setShareMessage: React.Dispatch<React.SetStateAction<string>>
  eventSelector: string
  setEventSelector: React.Dispatch<React.SetStateAction<string>>
  employeeName: string
  setEmployeeName: React.Dispatch<React.SetStateAction<string>>
  eventBranding: string
  setEventBranding: React.Dispatch<React.SetStateAction<string>>
  showQRCode: boolean
  setShowQRCode: React.Dispatch<React.SetStateAction<boolean>>
  enableCamera: () => Promise<void>
  resetPhotos: () => void
  handleUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  handleFrameUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  selectFrame: (nextFrame: FrameId | 'custom') => void
  startCustomBrandingEdit: () => void
  updateDraftBranding: (next: BrandingPlacement) => void
  startBrandingDrag: (event: ReactPointerEvent<HTMLButtonElement>) => void
  moveBranding: (event: ReactPointerEvent<HTMLButtonElement>) => void
  stopBrandingDrag: (event: ReactPointerEvent<HTMLButtonElement>) => void
  applyCustomBranding: () => void
  downloadStrip: () => void
  showQrCode: () => void
  hideQrCode: () => void
  shareStrip: () => Promise<void>
  shareToTeams: () => Promise<void>
  photoProgress: string
  hasFourPhotos: boolean
  isComposing: boolean
  selectedFrame: Extract<typeof PHOTO_FRAMES[number], {id: FrameId}> | undefined
  LOGO_IMAGE_URL: string
  PHOTO_COUNT: number
  PHOTO_FRAMES: readonly [{ id: FrameId; title: string; description: string; image: string }]
  composePhotoStrip: (
    photos: string[],
    frame: FrameId | 'custom',
    customFrame?: string,
    customBranding: BrandingPlacement,
    includeBranding: boolean,
    employeeName?: string,
    eventBranding?: string,
  ) => Promise<string>
  DEFAULT_CUSTOM_BRANDING: BrandingPlacement
}

export function PhotoBoothSection({
  videoRef,
  fileInputRef,
  frameInputRef,
  countdownTimerRef,
  stream,
  setStream,
  photos,
  setPhotos,
  frame,
  setFrame,
  customFrame,
  setCustomFrame,
  customFrameName,
  setCustomFrameName,
  customFrameAspectRatio,
  setCustomFrameAspectRatio,
  customBranding,
  setCustomBranding,
  draftCustomBranding,
  setDraftCustomBranding,
  isEditingCustomBranding,
  setIsEditingCustomBranding,
  countdown,
  setCountdown,
  cameraError,
  setCameraError,
  stripImage,
  setStripImage,
  composeError,
  setComposeError,
  shareMessage,
  setShareMessage,
  eventSelector,
  setEventSelector,
  employeeName,
  setEmployeeName,
  eventBranding,
  setEventBranding,
  showQRCode,
  setShowQRCode,
  enableCamera,
  resetPhotos,
  handleUpload,
  handleFrameUpload,
  selectFrame,
  startCustomBrandingEdit,
  updateDraftBranding,
  startBrandingDrag,
  moveBranding,
  stopBrandingDrag,
  applyCustomBranding,
  downloadStrip,
  showQrCode,
  hideQrCode,
  shareStrip,
  shareToTeams,
  photoProgress,
  hasFourPhotos,
  isComposing,
  selectedFrame,
  LOGO_IMAGE_URL,
  PHOTO_COUNT,
  PHOTO_FRAMES,
  composePhotoStrip,
  DEFAULT_CUSTOM_BRANDING,
}: PhotoBoothSectionProps) {
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
    composePhotoStrip(
      photos,
      frame,
      customFrame,
      customBranding,
      !isEditingCustomBranding,
      employeeName,
      eventBranding,
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
  }, [photos, frame, customFrame, customBranding, isEditingCustomBranding, employeeName, eventBranding])

  async function capturePhoto() {
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

  const photoProgress = `${String(photos.length).padStart(2, '0')} / ${String(PHOTO_COUNT).padStart(2, '0')}`
  const hasFourPhotos = photos.length === PHOTO_COUNT
  const isComposing = hasFourPhotos && !stripImage && !composeError
  const selectedFrame = PHOTO_FRAMES.find((option) => option.id === frame)

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
        <div className="event-mark"><span /> PHOTO BOOTH</div>
      </header>

      <main id="top" className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">JAIN GENIUS <span>/</span> THE CHANGE MAKERS</p>
            <h1>Photo booth<span>.</span></h1>
          </div>
          <div className="shot-counter" aria-live="polite">
            <span className="counter-label">YOUR SESSION</span>
            <strong>{photoProgress}</strong>
          </div>
          <div className="event-settings">
            <div className="field">
              <label>Event:</label>
              <select
                value={eventSelector}
                onChange={(e) => setEventSelector(e.target.value)}
                className="select-input"
              >
                <option value="">Select Event</option>
                <option value="Innovation Day 2026">Innovation Day 2026</option>
                <option value="Data Engineering Summit">Data Engineering Summit</option>
                <option value="Hackathon 2026">Hackathon 2026</option>
                <option value="Team Outing">Team Outing</option>
                <option value="Townhall">Townhall</option>
              </select>
            </div>
            <div className="field">
              <label>Employee Name:</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Enter your name"
                className="text-input"
              />
            </div>
            <div className="field">
              <label>Event Branding:</label>
              <input
                type="text"
                value={eventBranding}
                onChange={(e) => setEventBranding(e.target.value)}
                placeholder="Add event branding"
                className="text-input"
              />
            </div>
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
              ) : hasFourPhotos ? (
                <img className="last-capture" src={photos[3]} alt="Fourth captured photo" />
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
                    {photos[index] ? <img src={photos[index]} alt={`Captured photo ${index + 1}`} /> : `${index + 1}`}
                  </span>
                ))}
              </div>
              <span className="capture-sequence">{photos.length === PHOTO_COUNT ? 'STRIP READY' : `SHOT ${String(photos.length + 1).padStart(2, '0')} OF ${String(PHOTO_COUNT).padStart(2, '0')}`}</span>
            </div>

            {cameraError && <p className="inline-message" role="status">{cameraError}</p>}

            <div className="capture-actions">
              {hasFourPhotos ? (
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
              {photos.length > 0 && !hasFourPhotos && (
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
              {hasFourPhotos && stripImage && <span className="ready-label"><Check size={14} /> READY</span>}
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
              ) : frame !== 'signature' ? (
                <img className="strip-preview frame-placeholder" src={selectedFrame!.image} alt={`${selectedFrame!.title} frame preview`} />
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

            {frame === 'custom' && hasFourPhotos && stripImage && !isEditingCustomBranding && (
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
                <button className="teams-action" type="button" onClick={shareToTeams}>Teams</button>
                <button className="qr-action" type="button" onClick={showQrCode}>QR Code</button>
              </div>
            )}
            {shareMessage && <p className="share-message" role="status">{shareMessage}</p>}
          </section>
        </div>

        <footer className="page-footer"><span>JAIN GENIUS</span><span className="footer-line" /><span>THE CHANGE MAKERS</span></footer>
      </main>

      {/* QR Code Modal */}
      {showQRCode && stripImage && (
        <div className="qr-modal-backdrop" onClick={hideQrCode}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>Scan to Download</h>
              <button className="qr-modal-close" onClick={hideQrCode}>
                ×
              </button>
            </div>
            <div className="qr-modal-body">
              {/* Using QuickChart.io QR code generator */}
              <img
                src={`https://quickchart.io/qr?text=${encodeURIComponent(stripImage)}&size=200`}
                alt="QR Code for photo strip"
                className="qr-code-image"
              />
              <p className="qr-instructions">Point your camera at the QR code to download your photo strip</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}