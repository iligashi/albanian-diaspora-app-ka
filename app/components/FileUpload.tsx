"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, File, ImageIcon, Music } from "lucide-react"
import toast from "react-hot-toast"

interface FileUploadProps {
  onUpload: (url: string, filename: string) => void
  accept?: string
  maxSize?: number
  type?: "image" | "audio" | "document" | "general"
  className?: string
}

export default function FileUpload({
  onUpload,
  accept = "*/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  type = "general",
  className = "",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", type)

      const token = localStorage.getItem("token")
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onUpload(data.url, data.filename)
        toast.success("File uploaded successfully!")
      } else {
        const error = await response.json()
        toast.error(error.message || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const getIcon = () => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-8 w-8" />
      case "audio":
        return <Music className="h-8 w-8" />
      case "document":
        return <File className="h-8 w-8" />
      default:
        return <Upload className="h-8 w-8" />
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileInput} className="hidden" />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="text-gray-400 mb-2">{getIcon()}</div>
            <p className="text-sm text-gray-600">
              Drop files here or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Max size: {Math.round(maxSize / 1024 / 1024)}MB</p>
          </div>
        )}
      </div>
    </div>
  )
}
