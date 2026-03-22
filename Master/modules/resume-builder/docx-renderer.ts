import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx'
import type { ResumeDocument } from './types'
import {
  RESUME_PAGE_MARGIN_TOP_BOTTOM_PT,
  RESUME_PAGE_MARGIN_LEFT_RIGHT_CM,
} from './constants'

const THEME_BLUE = '3B5B9E' // docx uses hex without #
const TEXT_BASE_COLOR = '000000'
const FONT_FAMILY = 'Arial'

// Conversion: Points * 20 = Twips
// Line spacing: 1.4 -> 1.4 * 240 = 336 twips
const LINE_SPACING = 336

/**
 * Parses text with **bold** markers into TextRun array
 */
function parseMarkdownRuns(text: string, baseOptions: Record<string, unknown> = {}): TextRun[] {
  if (!text) return []
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({
        ...baseOptions,
        text: part.slice(2, -2),
        bold: true,
      })
    }
    return new TextRun({
      ...baseOptions,
      text: part,
    })
  })
}

/**
 * Renders a ResumeDocument to a docx.Document
 */
export async function renderResumeToDocx(doc: ResumeDocument): Promise<Document> {
  // Helper for section headings
  const createSectionHeading = (text: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 }, // 12pt before, 6pt after
      border: {
        bottom: {
          color: THEME_BLUE,
          space: 2, // 2pt padding equivalent
          style: BorderStyle.SINGLE,
          size: 12, // 1.5pt
        },
      },
      children: [
        new TextRun({
          text: text.toUpperCase(),
          bold: true,
          color: THEME_BLUE,
          size: '11pt',
          font: FONT_FAMILY,
        }),
      ],
    })
  }

  // Header Section
  const headerContent: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: doc.contact.name || 'Your Name',
          bold: true,
          size: '22pt',
          font: FONT_FAMILY,
          color: TEXT_BASE_COLOR,
        }),
      ],
      spacing: { after: 160 },
    }),
  ]

  const contactItems: { text: string; icon: string }[] = []
  if (doc.contact.location) contactItems.push({ text: doc.contact.location, icon: '📍' })
  if (doc.contact.phone) contactItems.push({ text: doc.contact.phone, icon: '📞' })
  if (doc.contact.email) contactItems.push({ text: doc.contact.email, icon: '✉' })
  if (doc.contact.linkedin) {
    const label = doc.contact.linkedin.toLowerCase().includes('linkedin.com') ? 'LinkedIn' : doc.contact.linkedin
    contactItems.push({ text: label, icon: '🔗' })
  }

  if (contactItems.length > 0) {
    const contactRuns: TextRun[] = []
    contactItems.forEach((item, idx) => {
      contactRuns.push(
        new TextRun({
          text: `${item.icon} ${item.text}`,
          color: 'FFFFFF',
          size: '9pt',
          font: FONT_FAMILY,
        })
      )
      if (idx < contactItems.length - 1) {
        contactRuns.push(
          new TextRun({
            text: ' | ',
            color: 'FFFFFF',
            size: '9pt',
            font: FONT_FAMILY,
          })
        )
      }
    })

    headerContent.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: THEME_BLUE },
                margins: { top: 120, bottom: 120, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: contactRuns,
                    spacing: { line: LINE_SPACING },
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    )
  }

  // Profile Section
  const profileContent: (Paragraph | Table)[] = []
  if (doc.profile || doc.skills.length > 0) {
    profileContent.push(createSectionHeading('PROFILE'))
    if (doc.profile) {
      profileContent.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 120, after: 120, line: LINE_SPACING },
          children: parseMarkdownRuns(doc.profile, {
            size: '9.5pt',
            font: FONT_FAMILY,
          }),
        })
      )
    }
    if (doc.skills.length > 0) {
      profileContent.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: THEME_BLUE },
                  margins: { top: 80, bottom: 80, left: 160, right: 160 },
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING },
                      children: [
                        new TextRun({
                          text: doc.skills.join(' | '),
                          color: 'FFFFFF',
                          bold: true,
                          size: '9pt',
                          font: FONT_FAMILY,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      )
    }
  }

  // Experience Section
  const experienceContent: Paragraph[] = []
  if (doc.experience.length > 0) {
    experienceContent.push(createSectionHeading('PROFESSIONAL EXPERTISE'))
    for (const exp of doc.experience) {
      experienceContent.push(
        new Paragraph({
          spacing: { before: 240 },
          children: [
            new TextRun({
              text: exp.company.toUpperCase(),
              bold: true,
              color: THEME_BLUE,
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: exp.location ? ` – ${exp.location}` : '',
              bold: true,
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
          ],
        })
      )
      experienceContent.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: exp.role,
              bold: true,
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: exp.startDate ? ` | ${exp.startDate} – ${exp.endDate || 'Present'}` : '',
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
          ],
        })
      )

      if (exp.bullets && exp.bullets.length > 0) {
        for (const bullet of exp.bullets) {
          if (!bullet) continue
          experienceContent.push(
            new Paragraph({
              bullet: { level: 0 },
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 40, line: LINE_SPACING },
              indent: { left: 450, hanging: 240 }, // Better bullet indent
              children: parseMarkdownRuns(bullet, {
                size: '9.5pt',
                font: FONT_FAMILY,
              }),
            })
          )
        }
      }
    }
  }

  // Awards Section
  const awardsContent: Paragraph[] = []
  if (doc.awards.length > 0) {
    awardsContent.push(createSectionHeading('AWARDS & RECOGNITION'))
    for (const award of doc.awards) {
      awardsContent.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40, line: LINE_SPACING },
          indent: { left: 450, hanging: 240 },
          children: [
            new TextRun({
              text: award.title,
              bold: true,
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: award.organization ? ` – ${award.organization}` : '',
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: award.year ? ` (${award.year})` : '',
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
          ],
        })
      )
    }
  }

  // Education Section
  const educationContent: Paragraph[] = []
  if (doc.education.length > 0) {
    educationContent.push(createSectionHeading('EDUCATION'))
    for (const edu of doc.education) {
      educationContent.push(
        new Paragraph({
          spacing: { after: 60, line: LINE_SPACING },
          children: [
            new TextRun({
              text: edu.degree + (edu.specialization ? ` (${edu.specialization})` : ''),
              bold: true,
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: edu.institution ? ` - ` : '',
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: edu.institution || '',
              color: THEME_BLUE,
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            ...(edu.date ? [
              new TextRun({
                text: ` (${edu.date})`,
                size: '9.5pt',
                font: FONT_FAMILY,
              })
            ] : []),
          ],
        })
      )
    }
  }

  // Certifications Section
  const certificationsContent: Paragraph[] = []
  if (doc.certifications.length > 0) {
    certificationsContent.push(createSectionHeading('CERTIFICATIONS'))
    for (const cert of doc.certifications) {
      certificationsContent.push(
        new Paragraph({
          spacing: { after: 60, line: LINE_SPACING },
          children: [
            new TextRun({
              text: cert.title,
              bold: true,
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: cert.issuer ? ` – ${cert.issuer}` : '',
              size: '9.5pt',
              font: FONT_FAMILY,
            }),
            ...(cert.date ? [
              new TextRun({
                text: ` (${cert.date})`,
                size: '9.5pt',
                font: FONT_FAMILY,
              })
            ] : []),
          ],
        })
      )
    }
  }

  const renderCustomSection = (section: { title: string; items: string[] }) => {
    const content: Paragraph[] = [createSectionHeading(section.title)]
    for (const item of section.items) {
      if (!item) continue
      content.push(
        new Paragraph({
          bullet: { level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 40, line: LINE_SPACING },
          indent: { left: 450, hanging: 240 },
          children: parseMarkdownRuns(item, {
            size: '9.5pt',
            font: FONT_FAMILY,
          }),
        })
      )
    }
    return content
  }

  const sectionOrder = doc.sectionOrder || ['profile', 'experience', 'awards', 'education', 'certifications']
  const children: (Paragraph | Table)[] = [...headerContent]

  for (const sectionId of sectionOrder) {
    if (sectionId === 'profile') {
      children.push(...profileContent)
    } else if (sectionId === 'experience') {
      children.push(...experienceContent)
    } else if (sectionId === 'awards') {
      children.push(...awardsContent)
    } else if (sectionId === 'education') {
      children.push(...educationContent)
    } else if (sectionId === 'certifications') {
      children.push(...certificationsContent)
    } else if (sectionId.startsWith('custom-')) {
      const custom = doc.customSections?.find(s => s.id === sectionId)
      if (custom) {
        children.push(...renderCustomSection(custom))
      }
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: `${RESUME_PAGE_MARGIN_TOP_BOTTOM_PT}pt`,
              bottom: `${RESUME_PAGE_MARGIN_TOP_BOTTOM_PT}pt`,
              left: RESUME_PAGE_MARGIN_LEFT_RIGHT_CM,
              right: RESUME_PAGE_MARGIN_LEFT_RIGHT_CM,
            },
          },
        },
        children,
      },
    ],
  })
}
