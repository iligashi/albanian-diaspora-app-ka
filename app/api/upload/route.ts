import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request)
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File
    const type = (data.get("type") as string) || "general"

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "File too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = {
      image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
      document: ["application/pdf", "text/plain", "application/msword"],
    }

    const isValidType = Object.values(allowedTypes).flat().includes(file.type)
    if (!isValidType) {
      return NextResponse.json({ message: "Invalid file type" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create upload directory
    const uploadDir = join(process.cwd(), "public", "uploads", type)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filepath = join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const fileUrl = `/uploads/${type}/${filename}`

    return NextResponse.json({
      message: "File uploaded successfully",
      url: fileUrl,
      filename,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Upload failed" }, { status: 500 })
  }
}
