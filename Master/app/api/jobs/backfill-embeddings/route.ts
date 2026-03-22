import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const jobsWithoutEmbeddings = await db.$queryRaw<any[]>`
      SELECT id, title, company, skills, description 
      FROM "jobs" 
      WHERE embedding IS NULL
      LIMIT 100;
    `

    if (!jobsWithoutEmbeddings || jobsWithoutEmbeddings.length === 0) {
      return NextResponse.json({ success: true, message: 'All jobs have an embedding!' })
    }

    const pythonUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:8080'
    let successCount = 0
    let failCount = 0

    for (const job of jobsWithoutEmbeddings) {
      try {
        const textToEmbed = `${job.title} at ${job.company}. Skills: ${(job.skills || []).join(', ')}. ${job.description}`.substring(0, 8000)
        
        const res = await fetch(`${pythonUrl}/api/generate-embedding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToEmbed })
        })

        if (res.ok) {
          const data = await res.json()
          if (data.embedding) {
            const vectorStr = `[${data.embedding.join(',')}]`
            await db.$executeRawUnsafe(`UPDATE "jobs" SET embedding = $1::vector WHERE id = $2`, vectorStr, job.id)
            successCount++
          } else {
            failCount++
          }
        } else {
          failCount++
        }
      } catch (err) {
        failCount++
        console.error('Failed to embed job:', job.id, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully backfilled ${successCount} jobs, ${failCount} failed. Re-run this URL if there were more than 100.`,
      processed: jobsWithoutEmbeddings.length
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
