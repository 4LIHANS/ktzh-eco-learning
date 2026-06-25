import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function uploadFileFromDisk(localPath: string, destName?: string, contentType?: string) {
  const bucket = process.env.SUPABASE_BUCKET ?? 'uploads'
  const buffer = await fs.readFile(localPath)
  const filePath = destName ?? path.basename(localPath)
  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType,
  })
  if (error) throw error
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl
  return publicUrl
}
