import { useState, useEffect, type ChangeEvent } from 'react'
import {
  ImagePlus,
  Check,
  Download,
  Trash2,
  Upload,
  Settings,
  X,
} from 'lucide-react'
import { PHOTO_FRAMES, type FrameId } from './compose'

interface AdminSectionProps {
  setCustomFrame: React.Dispatch<React.SetStateAction<string>>
  setCustomFrameName: React.Dispatch<React.SetStateAction<string>>
  setCustomFrameAspectRatio: React.Dispatch<React.SetStateAction<number>>
  PHOTO_FRAMES: readonly [{ id: FrameId; title: string; description: string; image: string }]
  setPHOTO_FRAMES: React.Dispatch<React.SetStateAction<readonly [{ id: FrameId; title: string; description: string; image: string }]>>
}

export function AdminSection({
  setCustomFrame,
  setCustomFrameName,
  setCustomFrameAspectRatio,
  PHOTO_FRAMES,
  setPHOTO_FRAMES,
}: AdminSectionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<FrameId | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<FrameId | null>(null)

  // Load saved templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('photoFrames')
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates)
        // Validate structure
        if (Array.isArray(parsed) && parsed.every((frame: any) =>
          frame.id && frame.title && frame.description && frame.image)) {
          setPHOTO_FRAMES(parsed as typeof PHOTO_FRAMES)
        }
      } catch (e) {
        console.error('Failed to parse saved frames:', e)
      }
    }
  }, [setPHOTO_FRAMES])

  // Save templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('photoFrames', JSON.stringify(PHOTO_FRAMES))
  }, [PHOTO_FRAMES, setPHOTO_FRAMES])

  const handleTemplateSelect = (frameId: FrameId) => {
    setSelectedTemplate(frameId)
    const frame = PHOTO_FRAMES.find(f => f.id === frameId)
    if (frame) {
      setTemplateName(frame.title)
      setTemplateDescription(frame.description)
      // For signature frame, we don't have an uploadable image
      if (frameId !== 'signature') {
        setPreviewUrl(frame.image)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTemplateName(e.target.value)
  }

  const handleDescriptionChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTemplateDescription(e.target.value)
  }

  const handleTemplateUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'image/png') {
      alert('Please upload a PNG file')
      return
    }

    setUploading(true)
    try {
      // Convert file to data URL
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result)
          else reject(new Error('Could not read image'))
        }
        reader.onerror = () => reject(new Error('Could not read image'))
        reader.readAsDataURL(file)
      })

      if (selectedTemplate) {
        // Update existing template
        setPHOTO_FRAMES(prev =>
          prev.map(frame =>
            frame.id === selectedTemplate
              ? { ...frame, image: preview, name: file.name }
              : frame
          )
        )
        setPreviewUrl(preview)
      } else {
        // Add new template
        const newId = `custom-${Date.now()}` as FrameId
        setPHOTO_FRAMES(prev => [
          ...prev,
          {
            id: newId,
            title: templateName || 'Custom Frame',
            description: templateDescription || 'Custom uploaded frame',
            image: preview,
          }
        ])
        setSelectedTemplate(newId)
        setTemplateName('')
        setTemplateDescription('')
        setPreviewUrl(preview)
      }
    } catch (err) {
      alert('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSaveChanges = () => {
    if (!selectedTemplate) return
    setPHOTO_FRAMES(prev =>
      prev.map(frame =>
        frame.id === selectedTemplate
          ? { ...frame, title: templateName, description: templateDescription }
          : frame
      )
    )
    alert('Changes saved!')
  }

  const handleDeleteTemplate = () => {
    if (!selectedTemplate || selectedTemplate === 'signature') return
    setPHOTO_FRAMES(prev => prev.filter(frame => frame.id !== selectedTemplate))
    setSelectedTemplate(null)
    setTemplateName('')
    setTemplateDescription('')
    setPreviewUrl(null)
    setShowDeleteConfirm(false)
  }

  const handleSetAsCustom = () => {
    if (!selectedTemplate) return
    const frame = PHOTO_FRAMES.find(f => f.id === selectedTemplate)
    if (frame) {
      setCustomFrame(frame.image)
      setCustomFrameName(frame.title)
      // Calculate aspect ratio from image (simplified - in reality you'd need to load the image)
      setCustomFrameAspectRatio(1.5) // Default ratio
      alert(`Set '${frame.title}' as custom frame for photo booth`)
    }
  }

  if (!selectedTemplate) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1>Frame Management</h1>
          <p>Manage photo booth frames and templates</p>
        </div>

        <div className="templates-grid">
          {PHOTO_FRAMES.map((frame) => (
            <button
              key={frame.id}
              className={`template-option ${selectedTemplate === frame.id ? 'is-selected' : ''}`}
              onClick={() => handleTemplateSelect(frame.id)}
            >
              {frame.id === 'signature' ? (
                <div className="signature-preview">
                  <img src={frame.image} alt="" className="signature-logo" />
                  <strong>JAIN GENIUS</strong>
                  <span className="signature-tagline">THE CHANGE MAKERS</span>
                </div>
              ) : (
                <img src={frame.image} alt={frame.title} className="template-preview" />
              )}
              <div className="template-info">
                <h3>{frame.title}</h3>
                <p>{frame.description}</p>
              </div>
              {selectedTemplate === frame.id && (
                <Check className="template-check" size={16} />
              )}
            </button>
          ))}

          <button
            className="template-option upload-trigger"
            onClick={() => document.getElementById('template-upload')?.click()}
          >
            <Upload size={24} />
            <div className="template-info">
              <h3>Add New Frame</h3>
              <p>Upload a PNG template</p>
            </div>
          </button>
          <input
            id="template-upload"
            type="file"
            accept="image/png"
            hidden
            onChange={handleTemplateUpload}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Frame Management</h1>
        <p>Manage photo booth frames and templates</p>
        <button className="back-button" onClick={() => window.history.back()}>
          <X size={20} /> Back to Photo Booth
        </button>
      </div>

      <div className="admin-content">
        <div className="template-selector">
          <h2>Select Template to Edit</h2>
          <div className="templates-grid">
            {PHOTO_FRAMES.map((frame) => (
              <button
                key={frame.id}
                className={`template-option ${selectedTemplate === frame.id ? 'is-selected' : ''}`}
                onClick={() => handleTemplateSelect(frame.id)}
              >
                {frame.id === 'signature' ? (
                  <div className="signature-preview">
                    <img src={frame.image} alt="" className="signature-logo" />
                    <strong>JAIN GENIUS</strong>
                    <span className="signature-tagline">THE CHANGE MAKERS</span>
                  </div>
                ) : (
                  <img src={frame.image} alt={frame.title} className="template-preview" />
                )}
                <div className="template-info">
                  <h3>{frame.title}</h3>
                  <p>{frame.description}</p>
                </div>
                {selectedTemplate === frame.id && (
                  <Check className="template-check" size={16} />
                )}
                {selectedTemplate === frame.id && frame.id !== 'signature' && (
                  <button
                    className="template-actions"
                    onClick={handleSetAsCustom}
                  >
                    <Settings size={16} /> Use as Custom
                  </button>
                )}
              </button>
            ))}

            <button
              className="template-option upload-trigger"
              onClick={() => document.getElementById('template-upload')?.click()}
            >
              <Upload size={24} />
              <div className="template-info">
                <h3>Add New Frame</h3>
                <p>Upload a PNG template</p>
              </div>
            </button>
            <input
              id="template-upload"
              type="file"
              accept="image/png"
              hidden
              onChange={handleTemplateUpload}
            />
          </div>
        </div>

        {selectedTemplate && (
          <div className="template-editor">
            <h2>
              {selectedTemplate === 'signature' ? 'Signature Frame' : 'Editing Template'}
            </h2>

            <div className="editor-fields">
              <div className="field">
                <label htmlFor="template-name">Template Name:</label>
                <input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={handleNameChange}
                  placeholder="Enter template name"
                  className="text-input"
                />
              </div>

              <div className="field">
                <label htmlFor="template-description">Description:</label>
                <input
                  id="template-description"
                  type="text"
                  value={templateDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Enter template description"
                  className="text-input"
                />
              </div>

              {selectedTemplate !== 'signature' && (
                <>
                  <div className="field">
                    <label>Current Preview:</label>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Template preview" className="template-preview-large" />
                    ) : (
                      <div className="template-preview-placeholder">No preview available</div>
                    )}
                  </div>

                  <div className="field">
                    <label>Upload New Image:</label>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleTemplateUpload}
                      disabled={uploading}
                      className="text-input"
                    />
                    {uploading && <span className="uploading-indicator">Uploading...</span>}
                  </div>
                </>
              )}
            </div>

            <div className="editor-actions">
              <button className="secondary-action" onClick={handleSaveChanges}>
                Save Changes
              </button>
              {selectedTemplate !== 'signature' && !showDeleteConfirm && (
                <button className="secondary-action delete-button" onClick={() => {
                  setTemplateToDelete(selectedTemplate)
                  setShowDeleteConfirm(true)
                }}>
                  Delete Template
                </button>
              )}
              {showDeleteConfirm && (
                <div className="delete-confirm">
                  <p>Are you sure you want to delete this template?</p>
                  <div className="confirm-actions">
                    <button className="secondary-action" onClick={() => {
                      setShowDeleteConfirm(false)
                      setTemplateToDelete(null)
                    }}>
                      Cancel
                    </button>
                    <button className="primary-action danger" onClick={handleDeleteTemplate}>
                      Yes, Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}