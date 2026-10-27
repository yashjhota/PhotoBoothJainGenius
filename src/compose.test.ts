import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  composePhotoStrip,
  DEFAULT_CUSTOM_BRANDING,
  resolvePhotoSlots,
  type PhotoSlot,
} from './compose'
import type { FrameDesign } from './frameDesigns'

type DrawCall = { name: string; args: unknown[] }

class FakeContext {
  calls: DrawCall[] = []

  private record(name: string, ...args: unknown[]) {
    this.calls.push({ name, args })
  }

  save() { this.record('save') }
  restore() { this.record('restore') }
  beginPath() { this.record('beginPath') }
  clip() { this.record('clip') }
  fill() { this.record('fill') }
  stroke() { this.record('stroke') }
  rect(...args: number[]) { this.record('rect', ...args) }
  arc(...args: number[]) { this.record('arc', ...args) }
  roundRect(...args: number[]) { this.record('roundRect', ...args) }
  fillRect(...args: number[]) { this.record('fillRect', ...args) }
  strokeRect(...args: number[]) { this.record('strokeRect', ...args) }
  clearRect(...args: number[]) { this.record('clearRect', ...args) }
  translate(...args: number[]) { this.record('translate', ...args) }
  rotate(...args: number[]) { this.record('rotate', ...args) }
  fillText(...args: unknown[]) { this.record('fillText', ...args) }

  drawImage(image: FakeImage, ...args: number[]) {
    this.record('drawImage', image.src, ...args)
  }
}

class FakeCanvas {
  width = 300
  height = 150
  context = new FakeContext()

  getContext() {
    return this.context
  }

  toDataURL() {
    return 'data:image/png;base64,test-output'
  }
}

class FakeImage {
  naturalWidth = 1000
  naturalHeight = 1500
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private source = ''

  get src() {
    return this.source
  }

  set src(value: string) {
    this.source = value
    const dimensions = {
      'custom-frame': { width: 600, height: 900 },
      'saved-background': { width: 1200, height: 1200 },
      'layer-back': { width: 400, height: 400 },
      'layer-front': { width: 300, height: 500 },
    }[value] ?? (value.startsWith('photo-')
      ? { width: 1200, height: 800 }
      : { width: 1000, height: 1500 })

    this.naturalWidth = dimensions.width
    this.naturalHeight = dimensions.height
    queueMicrotask(() => this.onload?.())
  }
}

const baseSlots: PhotoSlot[] = [
  { x: 10, y: 20, width: 80, height: 100 },
  { x: 10, y: 140, width: 80, height: 100 },
]

let canvases: FakeCanvas[] = []

function latestCanvas() {
  const canvas = canvases.at(-1)
  if (!canvas) throw new Error('The composition did not create a canvas.')
  return canvas
}

function callsNamed(canvas: FakeCanvas, name: string) {
  return canvas.context.calls.filter((call) => call.name === name)
}

beforeEach(() => {
  canvases = []
  vi.stubGlobal('Image', FakeImage)
  vi.stubGlobal('document', {
    createElement: (tagName: string) => {
      if (tagName !== 'canvas') throw new Error(`Unexpected element: ${tagName}`)
      const canvas = new FakeCanvas()
      canvases.push(canvas)
      return canvas
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolvePhotoSlots', () => {
  it('preserves configured slots when the requested count matches', () => {
    expect(resolvePhotoSlots(baseSlots, 2)).toEqual(baseSlots)
  })

  it.each([2, 3, 4, 7, 10])('creates %i non-overlapping slots inside the layout bounds', (count) => {
    const slots = resolvePhotoSlots(baseSlots, count)
    const minX = Math.min(...baseSlots.map((slot) => slot.x))
    const minY = Math.min(...baseSlots.map((slot) => slot.y))
    const maxX = Math.max(...baseSlots.map((slot) => slot.x + slot.width))
    const maxY = Math.max(...baseSlots.map((slot) => slot.y + slot.height))

    expect(slots).toHaveLength(count)
    for (const slot of slots) {
      expect(slot.x).toBeGreaterThanOrEqual(minX)
      expect(slot.y).toBeGreaterThanOrEqual(minY)
      expect(slot.x + slot.width).toBeLessThanOrEqual(maxX)
      expect(slot.y + slot.height).toBeLessThanOrEqual(maxY)
      expect(slot.width).toBeGreaterThan(0)
      expect(slot.height).toBeGreaterThan(0)
    }

    for (let first = 0; first < slots.length; first += 1) {
      for (let second = first + 1; second < slots.length; second += 1) {
        const left = slots[first]
        const right = slots[second]
        const separated = left.x + left.width <= right.x
          || right.x + right.width <= left.x
          || left.y + left.height <= right.y
          || right.y + right.height <= left.y
        expect(separated).toBe(true)
      }
    }
  })
})

describe('composePhotoStrip', () => {
  it.each([
    { count: 2, height: 1580 },
    { count: 3, height: 2030 },
  ])('creates a signature strip for $count photos', async ({ count, height }) => {
    const photos = Array.from({ length: count }, (_, index) => `photo-${index + 1}`)
    const result = await composePhotoStrip(photos, 'signature')
    const canvas = latestCanvas()

    expect(result).toBe('data:image/png;base64,test-output')
    expect(canvas.width).toBe(900)
    expect(canvas.height).toBe(height)
    expect(callsNamed(canvas, 'drawImage')).toHaveLength(count + 1)
  })

  it('places photos beneath a built-in artwork overlay', async () => {
    await composePhotoStrip(['photo-1', 'photo-2', 'photo-3'], 'goldenCollage')
    const canvas = latestCanvas()
    const drawnSources = callsNamed(canvas, 'drawImage').map((call) => call.args[0])

    expect(drawnSources.slice(0, 3)).toEqual(['photo-1', 'photo-2', 'photo-3'])
    expect(drawnSources.at(-1)).toContain('golden-collage.png')
    expect(callsNamed(canvas, 'fillRect').length).toBeGreaterThanOrEqual(3)
  })

  it('adds optional branding to a custom frame', async () => {
    await composePhotoStrip(['photo-1', 'photo-2'], 'custom', 'custom-frame', DEFAULT_CUSTOM_BRANDING, false)
    expect(callsNamed(latestCanvas(), 'roundRect')).toHaveLength(0)

    await composePhotoStrip(['photo-1', 'photo-2'], 'custom', 'custom-frame', DEFAULT_CUSTOM_BRANDING, true)
    expect(callsNamed(latestCanvas(), 'roundRect')).toHaveLength(1)
    expect(latestCanvas().width).toBe(600)
    expect(latestCanvas().height).toBe(900)
  })

  it('renders saved-frame background, photos, and layers in order', async () => {
    const design: FrameDesign = {
      id: 'saved-design',
      name: 'Saved design',
      width: 1000,
      height: 1000,
      background: '#f1eee5',
      backgroundImage: 'saved-background',
      photoSlots: [
        { id: 'photo-1', x: 0.1, y: 0.1, width: 0.8, height: 0.35 },
        { id: 'photo-2', x: 0.1, y: 0.55, width: 0.8, height: 0.35 },
      ],
      layers: [
        { id: 'layer-1', name: 'Back layer', image: 'layer-back', x: 0, y: 0, width: 1, height: 1, rotation: 0 },
        { id: 'layer-2', name: 'Front layer', image: 'layer-front', x: 0.1, y: 0.1, width: 0.8, height: 0.8, rotation: 15 },
      ],
      updatedAt: 1,
    }

    await composePhotoStrip(['photo-1', 'photo-2'], 'saved', undefined, undefined, true, design)
    const canvas = latestCanvas()
    const drawnSources = callsNamed(canvas, 'drawImage').map((call) => call.args[0])

    expect(drawnSources).toEqual(['saved-background', 'photo-1', 'photo-2', 'layer-back', 'layer-front'])
    expect(callsNamed(canvas, 'rotate')).toContainEqual({ name: 'rotate', args: [15 * Math.PI / 180] })
  })

  it('rejects incomplete or invalid frame requests', async () => {
    await expect(composePhotoStrip(['photo-1'], 'signature')).rejects.toThrow('at least two photos')
    await expect(composePhotoStrip(['photo-1', 'photo-2'], 'custom')).rejects.toThrow('custom frame')
    await expect(composePhotoStrip(['photo-1', 'photo-2'], 'saved')).rejects.toThrow('saved frame')
  })
})
