import fs from 'fs/promises'
import path from 'path'
import { FileReadResult } from '../../src/types/index'

/**
 * Parse sebuah file TXT menjadi daftar keyword.
 * - Hapus BOM UTF-8
 * - Split per baris
 * - Trim spasi awal dan akhir
 * - Filter baris kosong
 * - Deteksi duplikat
 */
export async function parseKeywordFile(filePath: string): Promise<FileReadResult> {
  const resolvedPath = path.resolve(filePath)

  let content: string
  try {
    content = await fs.readFile(resolvedPath, 'utf-8')
  } catch (err) {
    const error = err as NodeJS.ErrnoException
    if (error.code === 'ENOENT') {
      throw new Error(`File tidak ditemukan: ${resolvedPath}`)
    }
    throw new Error(`Gagal membaca file: ${error.message}`)
  }

  // Hapus BOM UTF-8 jika ada
  const cleaned = content.replace(/^\uFEFF/, '')

  // Split per baris, trim, filter kosong
  const rawKeywords = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rawKeywords.length === 0) {
    throw new Error('File TXT kosong atau tidak memiliki keyword yang valid.')
  }

  // Deteksi duplikat
  const seen = new Set<string>()
  const duplicates: string[] = []
  const unique: string[] = []

  for (const kw of rawKeywords) {
    const lower = kw.toLowerCase()
    if (seen.has(lower)) {
      if (!duplicates.includes(kw)) {
        duplicates.push(kw)
      }
    } else {
      seen.add(lower)
      unique.push(kw)
    }
  }

  return {
    keywords: rawKeywords,   // semua keyword termasuk duplikat untuk dipilih user
    totalCount: rawKeywords.length,
    duplicates,
    filePath: resolvedPath,
    fileName: path.basename(resolvedPath),
  }
}

/**
 * Hapus duplikat dari daftar keyword (case-insensitive, pertahankan kemunculan pertama)
 */
export function removeDuplicates(keywords: string[]): string[] {
  const seen = new Set<string>()
  return keywords.filter((kw) => {
    const lower = kw.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })
}
