// Local-filesystem storage for ARCA PDFs (replaces the Supabase `arca-documents`
// bucket). Files land under STORAGE_DIR/<entityId>/<uuid>.pdf.
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { config } from '../config.js'

const ROOT = path.resolve(config.storageDir)

// Guards against a storagePath escaping STORAGE_DIR (e.g. via `../..`).
function resolveSafe(storagePath) {
  const full = path.resolve(ROOT, storagePath)
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    throw new Error(`Refusing to access path outside storage root: ${storagePath}`)
  }
  return full
}

export async function putPdf(entityId, buffer) {
  const storagePath = `${entityId}/${randomUUID()}.pdf`
  const fullPath = resolveSafe(storagePath)
  await mkdir(path.dirname(fullPath), { recursive: true })
  await writeFile(fullPath, buffer)
  return storagePath
}

export function readPdf(storagePath) {
  return readFile(resolveSafe(storagePath))
}

export async function removePdf(storagePath) {
  try {
    await unlink(resolveSafe(storagePath))
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}
