export type FrameLayer = {
  id: string
  name: string
  image: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export type FramePhotoSlot = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type FrameDesign = {
  id: string
  name: string
  width: number
  height: number
  background: string
  backgroundImage: string
  layers: FrameLayer[]
  photoSlots: FramePhotoSlot[]
  updatedAt: number
}

const DATABASE_NAME = 'jaingenius-frame-studio'
const STORE_NAME = 'frames'
const DATABASE_VERSION = 1

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open frame storage.'))
  })
}

export async function loadFrameDesigns() {
  const database = await openDatabase()
  return new Promise<FrameDesign[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result as FrameDesign[]).sort((a, b) => b.updatedAt - a.updatedAt))
    request.onerror = () => reject(request.error ?? new Error('Could not load saved frames.'))
  })
}

export async function saveFrameDesign(design: FrameDesign) {
  const database = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ ...design, updatedAt: Date.now() })
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save this frame.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Frame storage is full.'))
  })
}

export async function deleteFrameDesign(id: string) {
  const database = await openDatabase()
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not delete this frame.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Could not delete this frame.'))
  })
}