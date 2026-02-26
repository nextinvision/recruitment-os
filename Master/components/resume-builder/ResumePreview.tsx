'use client'

import React, { forwardRef } from 'react'
import type { ResumeDocument } from '@/modules/resume-builder/types'
import { ATS_SINGLE_COLUMN_EXECUTIVE as config } from '@/modules/resume-builder/renderer-config'

interface ResumePreviewProps {
  document: ResumeDocument
  className?: string
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ document: doc, className = '' }, ref) => {
    const { layout, typography, design_rules, structure } = config

    // Helper to get styles for a typography element
    const getTypographyStyle = (element: any) => ({
      fontSize: `${element.font_size}pt`,
      fontWeight: element.font_weight === 'bold' ? 'bold' : 'normal',
      letterSpacing: element.letter_spacing ? `${element.letter_spacing}px` : 'normal',
      textAlign: (element.alignment || 'left') as any,
      textTransform: (element.uppercase ? 'uppercase' : 'none') as any,
      marginBottom: element.margin_bottom ? `${element.margin_bottom}pt` : '0',
      lineHeight: layout.line_height,
      color: design_rules.monochrome ? 'black' : 'inherit',
    })

    const containerStyle: React.CSSProperties = {
      fontFamily: typography.font_family,
      backgroundColor: 'white',
      color: 'black',
      paddingTop: `${layout.margin.top}pt`,
      paddingBottom: `${layout.margin.bottom}pt`,
      paddingLeft: `${layout.margin.left}pt`,
      paddingRight: `${layout.margin.right}pt`,
      width: '210mm',
      minHeight: '297mm',
      boxSizing: 'border-box',
      margin: '0 auto',
      position: 'relative',
    }

    const renderHeader = () => {
      const headerConfig = structure.header
      return (
        <div style={{ marginBottom: `${layout.section_spacing}pt` }}>
          {headerConfig.elements.map((el, i) => {
            const style = getTypographyStyle((typography as any)[el.style])
            if (el.type === 'text' && el.field === 'full_name') {
              return (
                <h1 key={i} style={{ ...style, margin: 0 }}>
                  {doc.contact.name || 'Your Name'}
                </h1>
              )
            }
            if (el.type === 'inline_row' && el.fields) {
              const items = el.fields
                .map((f) => (doc.contact as any)[f])
                .filter(Boolean)
              return (
                <div key={i} style={{ ...style, marginTop: '2pt' }}>
                  {items.join((typography as any)[el.style].separator || ' | ')}
                </div>
              )
            }
            return null
          })}
        </div>
      )
    }

    const renderProfile = () => {
      const profileConfig = structure.profile
      if (!doc.profile && doc.skills.length === 0) return null
      return (
        <section style={{ marginBottom: `${layout.section_spacing}pt`, pageBreakInside: 'avoid' }}>
          <h2 style={{ ...getTypographyStyle(typography.section_heading), borderBottom: design_rules.no_borders ? 'none' : '1px solid #eee' }}>
            {profileConfig.title}
          </h2>
          {doc.profile && (
            <p style={{ ...getTypographyStyle(typography.body_text), marginBottom: doc.skills.length > 0 ? '6pt' : '0', textAlign: 'justify' }}>
              {doc.profile}
            </p>
          )}
          {doc.skills.length > 0 && (
            <div style={{ ...getTypographyStyle(typography.body_text), fontWeight: 'bold' }}>
              {doc.skills.join(profileConfig.skills_format.separator)}
            </div>
          )}
        </section>
      )
    }

    const renderExperience = () => {
      const expConfig = structure.experience
      if (doc.experience.length === 0) return null
      return (
        <section style={{ marginBottom: `${layout.section_spacing}pt` }}>
          <h2 style={{ ...getTypographyStyle(typography.section_heading), borderBottom: design_rules.no_borders ? 'none' : '1px solid #eee' }}>
            {expConfig.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${layout.company_spacing}pt` }}>
            {doc.experience.map((exp) => (
              <div key={exp.id} style={{ pageBreakInside: 'avoid' }}>
                {/* Company Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1pt' }}>
                  <div style={getTypographyStyle(typography.company_name)}>
                    {exp.company}{exp.location && ` – ${exp.location}`}
                  </div>
                  <div style={getTypographyStyle(typography.date_range)}>
                    {exp.startDate} – {exp.endDate}
                  </div>
                </div>
                {/* Role */}
                <div style={{ ...getTypographyStyle(typography.role_title), marginBottom: `${layout.role_spacing}pt`, fontStyle: 'italic' }}>
                  {exp.role}
                </div>
                {/* Bullets */}
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                    {exp.bullets.filter(Boolean).map((b, i) => (
                      <li
                        key={i}
                        style={{
                          ...getTypographyStyle(typography.bullet_text),
                          display: 'flex',
                          marginBottom: `${layout.bullet_spacing}pt`,
                          textAlign: 'justify',
                        }}
                      >
                        <span style={{ marginRight: `${design_rules.bullet_indent}pt`, flexShrink: 0 }}>
                          {design_rules.bullet_symbol}
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )
    }

    const renderAwards = () => {
      if (doc.awards.length === 0) return null
      return (
        <section style={{ marginBottom: `${layout.section_spacing}pt`, pageBreakInside: 'avoid' }}>
          <h2 style={{ ...getTypographyStyle(typography.section_heading), borderBottom: design_rules.no_borders ? 'none' : '1px solid #eee' }}>
            {structure.awards.title}
          </h2>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
            {doc.awards.map((award, i) => (
              <li
                key={award.id || i}
                style={{
                  ...getTypographyStyle(typography.bullet_text),
                  display: 'flex',
                  marginBottom: '3pt',
                }}
              >
                <span style={{ marginRight: `${design_rules.bullet_indent}pt`, flexShrink: 0 }}>
                  {design_rules.bullet_symbol}
                </span>
                <span>
                  <strong>{award.title}</strong> – {award.organization} ({award.year})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )
    }

    const renderEducation = () => {
      if (doc.education.length === 0) return null
      return (
        <section style={{ marginBottom: `${layout.section_spacing}pt`, pageBreakInside: 'avoid' }}>
          <h2 style={{ ...getTypographyStyle(typography.section_heading), borderBottom: design_rules.no_borders ? 'none' : '1px solid #eee' }}>
            {structure.education.title}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt' }}>
            {doc.education.map((edu) => (
              <div key={edu.id} style={getTypographyStyle(typography.body_text)}>
                <strong>{edu.degree}</strong>{edu.specialization && `, ${edu.specialization}`} – {edu.institution}
              </div>
            ))}
          </div>
        </section>
      )
    }

    const renderCertifications = () => {
      if (doc.certifications.length === 0) return null
      return (
        <section style={{ marginBottom: `${layout.section_spacing}pt`, pageBreakInside: 'avoid' }}>
          <h2 style={{ ...getTypographyStyle(typography.section_heading), borderBottom: design_rules.no_borders ? 'none' : '1px solid #eee' }}>
            {structure.certifications.title}
          </h2>
          <div style={getTypographyStyle(typography.body_text)}>
            {doc.certifications.map((c, i) => (
              <span key={c.id || i}>
                {c.title} ({c.issuer}){i < doc.certifications.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </section>
      )
    }

    return (
      <div ref={ref} className={`resume-preview ${className}`} style={containerStyle}>
        {structure.order.map((section) => {
          switch (section) {
            case 'header':
              return renderHeader()
            case 'profile':
              return renderProfile()
            case 'experience':
              return renderExperience()
            case 'awards':
              return renderAwards()
            case 'education':
              return renderEducation()
            case 'certifications':
              return renderCertifications()
            default:
              return null
          }
        })}
      </div>
    )
  }
)

ResumePreview.displayName = 'ResumePreview'
