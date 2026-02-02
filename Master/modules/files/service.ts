import { db } from '@/lib/db'
import { FileType } from '@prisma/client'
import { storageService } from '@/lib/storage'

export interface FileUploadData {
  fileName: string
  fileUrl: string
  fileType: FileType
  fileSize: number
  mimeType: string
  uploadedBy: string
}

export class FileService {
  /**
   * Upload file and save record
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    fileType: FileType,
    contentType: string,
    uploadedBy: string
  ) {
    // Upload to MinIO
    const uploadResult = await storageService.uploadFile(
      file,
      originalName,
      fileType as 'RESUME' | 'DOCUMENT' | 'IMAGE',
      contentType
    )

    // Save file record in database
    const fileRecord = await db.file.create({
      data: {
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileType,
        fileSize: uploadResult.fileSize,
        mimeType: contentType,
        uploadedBy,
      },
    })

    return fileRecord
  }

  /**
   * Save file record (for existing files)
   */
  async saveFile(data: FileUploadData) {
    return db.file.create({
      data,
    })
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string) {
    return db.file.findUnique({
      where: { id: fileId },
    })
  }

  /**
   * Delete file record and file from storage
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await this.getFile(fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Delete from MinIO
    try {
      await storageService.deleteFile(
        file.fileName,
        file.fileType as 'RESUME' | 'DOCUMENT' | 'IMAGE'
      )
    } catch (error) {
      console.error('Error deleting file from storage:', error)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await db.file.delete({
      where: { id: fileId },
    })
  }

  /**
   * Generate signed URL for file access
   */
  async getSignedUrl(fileId: string, expiresIn = 3600): Promise<string> {
    const file = await this.getFile(fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Generate signed URL from MinIO
    return storageService.getSignedUrl(
      file.fileName,
      file.fileType as 'RESUME' | 'DOCUMENT' | 'IMAGE',
      expiresIn
    )
  }

  /**
   * Download file as buffer
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const file = await this.getFile(fileId)
    if (!file) {
      throw new Error('File not found')
    }

    return storageService.downloadFile(
      file.fileName,
      file.fileType as 'RESUME' | 'DOCUMENT' | 'IMAGE'
    )
  }
}

export const fileService = new FileService()

