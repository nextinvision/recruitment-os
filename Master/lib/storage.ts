import { Client } from 'minio'
import { randomBytes } from 'crypto'

const getMinioClient = () => {
  const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9010'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'recruitment_minio_admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'recruitment_minio_password',
  })

  return minioClient
}

export const minioClient = getMinioClient()

/**
 * Storage buckets
 */
export const BUCKETS = {
  RESUMES: 'resumes',
  DOCUMENTS: 'documents',
  IMAGES: 'images',
} as const

/**
 * Initialize MinIO buckets
 */
export async function initializeBuckets(): Promise<void> {
  try {
    for (const bucketName of Object.values(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucketName)
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1')
        console.log(`Created bucket: ${bucketName}`)
      }
    }
  } catch (error) {
    console.error('Error initializing MinIO buckets:', error)
    throw error
  }
}

/**
 * Storage service for file operations
 */
export class StorageService {
  private client: Client

  constructor() {
    this.client = minioClient
  }

  /**
   * Generate unique file name
   */
  private generateFileName(originalName: string): string {
    const ext = originalName.split('.').pop()
    const timestamp = Date.now()
    const random = randomBytes(8).toString('hex')
    return `${timestamp}-${random}.${ext}`
  }

  /**
   * Get bucket name based on file type
   */
  private getBucket(fileType: 'RESUME' | 'DOCUMENT' | 'IMAGE'): string {
    switch (fileType) {
      case 'RESUME':
        return BUCKETS.RESUMES
      case 'DOCUMENT':
        return BUCKETS.DOCUMENTS
      case 'IMAGE':
        return BUCKETS.IMAGES
      default:
        return BUCKETS.DOCUMENTS
    }
  }

  /**
   * Upload file to MinIO
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    fileType: 'RESUME' | 'DOCUMENT' | 'IMAGE',
    contentType: string
  ): Promise<{ fileName: string; fileUrl: string; fileSize: number }> {
    try {
      const bucket = this.getBucket(fileType)
      const fileName = this.generateFileName(originalName)
      const fileSize = file.length

      await this.client.putObject(bucket, fileName, file, fileSize, {
        'Content-Type': contentType,
        'X-Original-Name': originalName,
      })

      // Generate file URL (in production, this would be a public URL or signed URL)
      const fileUrl = `${process.env.MINIO_PUBLIC_URL || `http://localhost:9000`}/${bucket}/${fileName}`

      return {
        fileName,
        fileUrl,
        fileSize,
      }
    } catch (error) {
      console.error('Error uploading file to MinIO:', error)
      throw new Error('Failed to upload file')
    }
  }

  /**
   * Get signed URL for file access (expires in 1 hour by default)
   */
  async getSignedUrl(
    fileName: string,
    fileType: 'RESUME' | 'DOCUMENT' | 'IMAGE',
    expiresIn = 3600
  ): Promise<string> {
    try {
      const bucket = this.getBucket(fileType)
      return await this.client.presignedGetObject(bucket, fileName, expiresIn)
    } catch (error) {
      console.error('Error generating signed URL:', error)
      throw new Error('Failed to generate signed URL')
    }
  }

  /**
   * Delete file from MinIO
   */
  async deleteFile(fileName: string, fileType: 'RESUME' | 'DOCUMENT' | 'IMAGE'): Promise<void> {
    try {
      const bucket = this.getBucket(fileType)
      await this.client.removeObject(bucket, fileName)
    } catch (error) {
      console.error('Error deleting file from MinIO:', error)
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileName: string, fileType: 'RESUME' | 'DOCUMENT' | 'IMAGE') {
    try {
      const bucket = this.getBucket(fileType)
      const stat = await this.client.statObject(bucket, fileName)
      return {
        size: stat.size,
        contentType: stat.metaData['content-type'] || 'application/octet-stream',
        lastModified: stat.lastModified,
        etag: stat.etag,
        originalName: stat.metaData['x-original-name'] || fileName,
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  /**
   * Download file as buffer
   */
  async downloadFile(fileName: string, fileType: 'RESUME' | 'DOCUMENT' | 'IMAGE'): Promise<Buffer> {
    try {
      const bucket = this.getBucket(fileType)
      const chunks: Buffer[] = []
      const stream = await this.client.getObject(bucket, fileName)

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('Error downloading file from MinIO:', error)
      throw new Error('Failed to download file')
    }
  }
}

export const storageService = new StorageService()

