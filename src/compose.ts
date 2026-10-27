import type { FrameDesign } from './frameDesigns'

export const LOGO_IMAGE_URL = `${import.meta.env.BASE_URL}branding/JainGeniusLogo.jpeg`
const templateImageUrl = (fileName: string) => `${import.meta.env.BASE_URL}templates/${fileName}`

export const PHOTO_FRAMES = [
  { id: 'signature', title: 'JainGenius', description: 'Signature', image: LOGO_IMAGE_URL },
  { id: 'vintage', title: 'Analog days', description: 'Vintage collage', image: templateImageUrl('photoshop.png') },
  { id: 'computer', title: 'Computer lab', description: 'Digital basics', image: templateImageUrl('computer_basics.png') },
  { id: 'law', title: 'Stand for justice', description: 'Law & order', image: templateImageUrl('law.png') },
  { id: 'marketing', title: 'Bright ideas', description: 'Marketing minds', image: templateImageUrl('marketing.jpg') },
  { id: 'cybercrime', title: 'Cyber watch', description: 'Crime board', image: templateImageUrl('cybercrime.jpg') },
  { id: 'goldenPortrait', title: 'Golden portrait', description: 'Golden sparkle portrait', image: templateImageUrl('golden-portrait.png') },
  { id: 'goldenSparkle', title: 'Golden sparkle', description: 'Golden sparkle photo pair', image: templateImageUrl('golden-stars-tall.png') },
  { id: 'goldenStrip', title: 'Golden photo strip', description: 'Three-photo sparkle strip', image: templateImageUrl('golden-three-strip.png') },
  { id: 'goldenNarrow', title: 'Golden narrow', description: 'Narrow sparkle collage', image: templateImageUrl('golden-narrow.png') },
  { id: 'goldenLandscape', title: 'Golden landscape', description: 'Wide sparkle photo pair', image: templateImageUrl('golden-landscape.png') },
  { id: 'goldenCollage', title: 'Golden collage', description: 'Three-photo sparkle collage', image: templateImageUrl('golden-collage.png') },
  { id: 'lotusTriple', title: 'Lotus trio', description: 'Three-photo lotus frame', image: templateImageUrl('lotus-three-photo.png') },
] as const

export type FrameId = (typeof PHOTO_FRAMES)[number]['id']
export type BrandingPlacement = { x: number; y: number; width: number }
export const DEFAULT_CUSTOM_BRANDING: BrandingPlacement = { x: 0.5, y: 0.87, width: 0.64 }

type ArtworkFrameId = Exclude<FrameId, 'signature' | 'vintage'>

type BrandingStyle = {
  background: string
  foreground: string
  accent: string
}

const DEFAULT_BRANDING_STYLE: BrandingStyle = {
  background: '#173d50',
  foreground: '#f4eddd',
  accent: '#dec58f',
}

export type PhotoSlot = {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

type ArtworkLayout = {
  source: string
  slots: PhotoSlot[]
  borderColor: string
  branding?: BrandingPlacement
  brandingStyle: BrandingStyle
  overlay?: boolean
}

const GOLDEN_BRANDING_STYLE: BrandingStyle = {
  background: '#17130b',
  foreground: '#fff8e7',
  accent: '#d5b15b',
}

const ARTWORK_LAYOUTS: Record<ArtworkFrameId, ArtworkLayout> = {
  computer: {
    source: templateImageUrl('computer_basics.png'),
    slots: [
      { x: 100, y: 830, width: 440, height: 600 },
      { x: 592, y: 830, width: 440, height: 600 },
    ],
    borderColor: '#f4efe4',
    branding: { x: 0.5, y: 0.14, width: 0.38 },
    brandingStyle: DEFAULT_BRANDING_STYLE,
  },
  law: {
    source: templateImageUrl('law.png'),
    slots: [
      { x: 180, y: 430, width: 792, height: 420 },
      { x: 180, y: 930, width: 792, height: 420 },
    ],
    borderColor: '#c6a15d',
    branding: { x: 0.5, y: 0.95, width: 0.34 },
    brandingStyle: { background: '#f6efe1', foreground: '#173d50', accent: '#a2372a' },
  },
  marketing: {
    source: templateImageUrl('marketing.jpg'),
    slots: [
      { x: 134, y: 175, width: 240, height: 185 },
      { x: 134, y: 380, width: 240, height: 185 },
    ],
    borderColor: '#f9f5e9',
    branding: { x: 0.69, y: 0.91, width: 0.56 },
    brandingStyle: { background: '#fffaf0', foreground: '#173d50', accent: '#bf6048' },
  },
  cybercrime: {
    source: templateImageUrl('cybercrime.jpg'),
    slots: [
      { x: 119, y: 591, width: 80, height: 82, rotation: -0.16 },
      { x: 515, y: 587, width: 84, height: 84, rotation: -0.17 },
    ],
    borderColor: '#f5efe2',
    branding: { x: 0.5, y: 0.92, width: 0.4 },
    brandingStyle: { background: '#172c2e', foreground: '#edf2e8', accent: '#6ab0a4' },
  },
  goldenPortrait: {
    source: templateImageUrl('golden-portrait.png'),
    slots: [{ x: 23, y: 25, width: 201, height: 271 }],
    borderColor: '#d5b15b',
    branding: { x: 0.5, y: 0.92, width: 0.62 },
    brandingStyle: GOLDEN_BRANDING_STYLE,
    overlay: true,
  },
  goldenSparkle: {
    source: templateImageUrl('golden-stars-tall.png'),
    slots: [
      { x: 20, y: 80, width: 208, height: 100 },
      { x: 20, y: 205, width: 208, height: 100 },
    ],
    borderColor: '#d5b15b',
    branding: { x: 0.5, y: 0.92, width: 0.62 },
    brandingStyle: GOLDEN_BRANDING_STYLE,
  },
  goldenStrip: {
    source: templateImageUrl('golden-three-strip.png'),
    slots: [
      { x: 10, y: 19, width: 106, height: 69 },
      { x: 10, y: 105, width: 106, height: 69 },
      { x: 10, y: 192, width: 106, height: 72 },
    ],
    borderColor: '#d5b15b',
    branding: { x: 0.5, y: 0.88, width: 0.76 },
    brandingStyle: GOLDEN_BRANDING_STYLE,
    overlay: true,
  },
  goldenNarrow: {
    source: templateImageUrl('golden-narrow.png'),
    slots: [
      { x: 14, y: 53, width: 103, height: 104 },
      { x: 14, y: 211, width: 103, height: 104 },
    ],
    borderColor: '#d5b15b',
    branding: { x: 0.5, y: 0.9, width: 0.82 },
    brandingStyle: GOLDEN_BRANDING_STYLE,
  },
  goldenLandscape: {
    source: templateImageUrl('golden-landscape.png'),
    slots: [
      { x: 22, y: 30, width: 135, height: 172 },
      { x: 177, y: 30, width: 135, height: 172 },
    ],
    borderColor: '#d5b15b',
    brandingStyle: GOLDEN_BRANDING_STYLE,
  },
  goldenCollage: {
    source: templateImageUrl('golden-collage.png'),
    slots: [
      { x: 180, y: 23, width: 136, height: 82 },
      { x: 26, y: 119, width: 136, height: 82 },
      { x: 181, y: 119, width: 136, height: 82 },
    ],
    borderColor: '#d5b15b',
    brandingStyle: GOLDEN_BRANDING_STYLE,
    overlay: true,
  },
  lotusTriple: {
    source: templateImageUrl('lotus-three-photo.png'),
    slots: [
      { x: 263, y: 49, width: 214, height: 219 },
      { x: 263, y: 312, width: 214, height: 217 },
      { x: 263, y: 569, width: 214, height: 194 },
    ],
    borderColor: '#e5c99b',
    brandingStyle: DEFAULT_BRANDING_STYLE,
  },
}

export function resolvePhotoSlots(baseSlots: PhotoSlot[], count: number): PhotoSlot[] {
  if (count === baseSlots.length) return baseSlots

  const minX = Math.min(...baseSlots.map((slot) => slot.x))
  const minY = Math.min(...baseSlots.map((slot) => slot.y))
  const maxX = Math.max(...baseSlots.map((slot) => slot.x + slot.width))
  const maxY = Math.max(...baseSlots.map((slot) => slot.y + slot.height))
  const boundsWidth = maxX - minX
  const boundsHeight = maxY - minY
  const targetAspect = baseSlots.reduce((sum, slot) => sum + slot.width / slot.height, 0) / baseSlots.length

  let columns = 1
  let bestDifference = Number.POSITIVE_INFINITY
  for (let candidate = 1; candidate <= count; candidate += 1) {
    const rows = Math.ceil(count / candidate)
    const aspect = (boundsWidth / candidate) / (boundsHeight / rows)
    const difference = Math.abs(Math.log(aspect / targetAspect))
    if (difference < bestDifference) {
      columns = candidate
      bestDifference = difference
    }
  }

  const rows = Math.ceil(count / columns)
  const gap = Math.min(boundsWidth / columns, boundsHeight / rows) * 0.035
  const slotWidth = (boundsWidth - gap * (columns - 1)) / columns
  const slotHeight = (boundsHeight - gap * (rows - 1)) / rows

  return Array.from({ length: count }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    return {
      x: minX + column * (slotWidth + gap),
      y: minY + row * (slotHeight + gap),
      width: slotWidth,
      height: slotHeight,
    }
  })
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load image.'))
    image.src = source
  })
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, slot: PhotoSlot) {
  const scale = Math.max(slot.width / image.naturalWidth, slot.height / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale

  context.save()
  context.beginPath()
  context.rect(slot.x, slot.y, slot.width, slot.height)
  context.clip()
  context.drawImage(image, slot.x + (slot.width - width) / 2, slot.y + (slot.height - height) / 2, width, height)
  context.restore()
}

function drawPhotoCard(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  slot: PhotoSlot,
  borderColor: string,
) {
  const mat = Math.max(4, Math.round(slot.width * 0.035))
  context.save()
  context.translate(slot.x + slot.width / 2, slot.y + slot.height / 2)
  context.rotate(slot.rotation ?? 0)
  context.fillStyle = borderColor
  context.fillRect(-slot.width / 2 - mat, -slot.height / 2 - mat, slot.width + mat * 2, slot.height + mat * 2)
  drawCover(context, image, {
    x: -slot.width / 2,
    y: -slot.height / 2,
    width: slot.width,
    height: slot.height,
  })
  context.restore()
}

function drawBranding(
  context: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  canvas: HTMLCanvasElement,
  placement: BrandingPlacement,
  style: BrandingStyle = DEFAULT_BRANDING_STYLE,
) {
  const width = canvas.width * placement.width
  const height = width * 0.22
  const x = Math.max(width / 2, Math.min(canvas.width - width / 2, canvas.width * placement.x))
  const y = Math.max(height / 2, Math.min(canvas.height - height / 2, canvas.height * placement.y))
  const left = x - width / 2
  const top = y - height / 2
  const radius = height * 0.16
  const logoSize = height * 0.7
  const padding = height * 0.12

  context.save()
  context.shadowColor = 'rgba(20, 30, 30, 0.22)'
  context.shadowBlur = height * 0.12
  context.fillStyle = style.background
  context.beginPath()
  context.roundRect(left, top, width, height, radius)
  context.fill()
  context.shadowBlur = 0
  context.strokeStyle = style.accent
  context.lineWidth = Math.max(1, height * 0.018)
  context.stroke()

  context.save()
  context.beginPath()
  context.arc(left + padding + logoSize / 2, y, logoSize / 2, 0, Math.PI * 2)
  context.clip()
  context.drawImage(logo, left + padding, y - logoSize / 2, logoSize, logoSize)
  context.restore()

  const textX = left + padding * 2 + logoSize
  const titleSize = Math.max(9, height * 0.235)
  const taglineSize = Math.max(7, height * 0.13)
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.fillStyle = style.foreground
  context.font = `700 ${titleSize}px "DM Sans", sans-serif`
  context.fillText('JainGenius', textX, y - height * 0.13, width - (textX - left) - padding)
  context.fillStyle = style.accent
  context.font = `500 ${taglineSize}px "DM Sans", sans-serif`
  context.fillText('THE CHANGE MAKERS', textX, y + height * 0.19, width - (textX - left) - padding)
  context.restore()
}

function createSignatureFrame(photos: HTMLImageElement[], logo: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = Math.max(1580, photos.length * 510 + 500)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable.')

  context.fillStyle = '#f2eddf'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#173d50'
  context.fillRect(26, 26, 848, canvas.height - 52)
  context.strokeStyle = '#c7a45f'
  context.lineWidth = 2
  context.strokeRect(42, 42, 816, canvas.height - 84)

  context.save()
  context.beginPath()
  context.arc(450, 125, 56, 0, Math.PI * 2)
  context.clip()
  context.drawImage(logo, 394, 69, 112, 112)
  context.restore()

  context.textAlign = 'center'
  context.fillStyle = '#f4eddd'
  context.font = '600 42px Fraunces, Georgia, serif'
  context.fillText('JAIN GENIUS', 450, 230)
  context.fillStyle = '#dec58f'
  context.font = '500 16px "DM Sans", sans-serif'
  context.fillText('THE CHANGE MAKERS', 450, 258)

  const slots: PhotoSlot[] = photos.length === 2
    ? [
      { x: 92, y: 300, width: 716, height: 420 },
      { x: 92, y: 766, width: 716, height: 420 },
    ]
    : photos.map((_, index) => ({
      x: 92,
      y: 300 + index * ((canvas.height - 660) / photos.length),
      width: 716,
      height: ((canvas.height - 660) - 24 * (photos.length - 1)) / photos.length,
    }))

  slots.forEach((slot, index) => {
    context.fillStyle = '#e8ddc5'
    context.fillRect(slot.x - 7, slot.y - 7, slot.width + 14, slot.height + 14)
    drawCover(context, photos[index], slot)
    context.strokeStyle = '#c7a45f'
    context.lineWidth = 2
    context.strokeRect(slot.x - 7, slot.y - 7, slot.width + 14, slot.height + 14)
  })

  context.fillStyle = '#dec58f'
  context.font = '500 17px "DM Mono", Consolas, monospace'
  const footerY = canvas.height - 300
  context.fillText('A MOMENT TO KEEP', 450, footerY)
  context.fillStyle = '#f4eddd'
  context.font = '600 20px "DM Sans", sans-serif'
  context.fillText('JAIN GENIUS', 450, footerY + 60)
  context.fillStyle = '#dec58f'
  context.font = '500 13px "DM Sans", sans-serif'
  context.fillText('THE CHANGE MAKERS', 450, footerY + 90)

  return canvas.toDataURL('image/png')
}

function createVintageFrame(photos: HTMLImageElement[], frame: HTMLImageElement, logo: HTMLImageElement) {
  const canvas = document.createElement('canvas')
  canvas.width = frame.naturalWidth
  canvas.height = frame.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable.')

  context.drawImage(frame, 0, 0)
  const slots: PhotoSlot[] = [
    { x: 371, y: 297, width: 540, height: 430 },
    { x: 367, y: 864, width: 540, height: 429 },
  ]

  slots.forEach((slot) => {
    context.clearRect(slot.x, slot.y, slot.width, slot.height)
  })
  resolvePhotoSlots(slots, photos.length).forEach((slot, index) => drawCover(context, photos[index], slot))

  drawBranding(context, logo, canvas, { x: 0.5, y: 0.09, width: 0.38 }, {
    background: '#fff7e4',
    foreground: '#263a36',
    accent: '#c28f44',
  })

  return canvas.toDataURL('image/png')
}

function createArtworkFrame(
  photos: HTMLImageElement[],
  frame: HTMLImageElement,
  layout: ArtworkLayout,
  logo: HTMLImageElement,
) {
  const canvas = document.createElement('canvas')
  canvas.width = frame.naturalWidth
  canvas.height = frame.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable.')

  if (!layout.overlay) context.drawImage(frame, 0, 0)
  resolvePhotoSlots(layout.slots, photos.length).forEach((slot, index) => {
    drawPhotoCard(context, photos[index], slot, layout.borderColor)
  })
  if (layout.overlay) context.drawImage(frame, 0, 0)
  if (layout.branding) drawBranding(context, logo, canvas, layout.branding, layout.brandingStyle)
  return canvas.toDataURL('image/png')
}

function createCustomFrame(
  photos: HTMLImageElement[],
  frame: HTMLImageElement,
  logo: HTMLImageElement,
  branding: BrandingPlacement,
  includeBranding: boolean,
) {
  const canvas = document.createElement('canvas')
  canvas.width = frame.naturalWidth
  canvas.height = frame.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas is unavailable.')

  const slots = resolvePhotoSlots([
    { x: 0, y: 0, width: canvas.width, height: canvas.height / 2 },
    { x: 0, y: canvas.height / 2, width: canvas.width, height: canvas.height / 2 },
  ], photos.length)
  slots.forEach((slot, index) => drawCover(context, photos[index], slot))
  context.drawImage(frame, 0, 0)
  if (includeBranding) drawBranding(context, logo, canvas, branding)
  return canvas.toDataURL('image/png')
}

export async function composePhotoStrip(
  photos: string[],
  frame: FrameId | 'custom' | 'saved',
  customFrame?: string,
  customBranding: BrandingPlacement = DEFAULT_CUSTOM_BRANDING,
  includeBranding = true,
  savedDesign?: FrameDesign,
) {
  const [loadedPhotos, logo] = await Promise.all([
    Promise.all(photos.map(loadImage)),
    loadImage(LOGO_IMAGE_URL),
  ])
  if (loadedPhotos.length < 2) throw new Error('A photo strip needs at least two photos.')

  if (frame === 'saved') {
    if (!savedDesign || savedDesign.photoSlots.length === 0) throw new Error('Choose a saved frame with photo windows.')
    const canvas = document.createElement('canvas')
    canvas.width = savedDesign.width
    canvas.height = savedDesign.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable.')

    context.fillStyle = savedDesign.background
    context.fillRect(0, 0, canvas.width, canvas.height)
    if (savedDesign.backgroundImage) {
      const background = await loadImage(savedDesign.backgroundImage)
      context.drawImage(background, 0, 0, canvas.width, canvas.height)
    }
    resolvePhotoSlots(savedDesign.photoSlots.map((slot) => ({
      x: slot.x * canvas.width,
      y: slot.y * canvas.height,
      width: slot.width * canvas.width,
      height: slot.height * canvas.height,
    })), photos.length).forEach((slot, index) => {
      drawCover(context, loadedPhotos[index], {
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
      })
    })
    const layers = await Promise.all(savedDesign.layers.map((layer) => loadImage(layer.image)))
    savedDesign.layers.forEach((layer, index) => {
      const width = layer.width * canvas.width
      const height = layer.height * canvas.height
      context.save()
      context.translate((layer.x + layer.width / 2) * canvas.width, (layer.y + layer.height / 2) * canvas.height)
      context.rotate(layer.rotation * Math.PI / 180)
      context.drawImage(layers[index], -width / 2, -height / 2, width, height)
      context.restore()
    })
    return canvas.toDataURL('image/png')
  }

  if (frame === 'custom') {
    if (!customFrame) throw new Error('Choose a custom frame.')
    const customArtwork = await loadImage(customFrame)
    return createCustomFrame(
      loadedPhotos,
      customArtwork,
      logo,
      customBranding,
      includeBranding,
    )
  }

  if (frame === 'vintage') {
    const poster = await loadImage(templateImageUrl('photoshop.png'))
    return createVintageFrame(loadedPhotos, poster, logo)
  }

  if (frame !== 'signature') {
    const layout = ARTWORK_LAYOUTS[frame]
    const artwork = await loadImage(layout.source)
    return createArtworkFrame(loadedPhotos, artwork, layout, logo)
  }

  return createSignatureFrame(loadedPhotos, logo)
}
