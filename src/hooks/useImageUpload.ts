import { useState } from "react"
import { adminApi } from "../lib/api"

/** Uploads a picked image to Supabase Storage (via the backend) and reports its URL. */
export function useImageUpload(folder: "staff" | "branches" | "products") {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File | undefined): Promise<string | undefined> => {
    if (!file) return undefined
    setUploading(true)
    setError(null)
    try {
      return await adminApi.uploadImage(file, folder)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
      return undefined
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error }
}
