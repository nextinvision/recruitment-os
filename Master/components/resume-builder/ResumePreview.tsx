'use client'

import React, { forwardRef } from 'react'
import type { ResumeDocument } from '@/modules/resume-builder/types'
import { RESUME_PREVIEW_PADDING_CSS } from '@/modules/resume-builder/constants'

interface ResumePreviewProps {
  document: ResumeDocument
  className?: string
}

const THEME_BLUE = '#3b5b9e';
const TEXT_BASE_COLOR = '#000000';

const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const PhoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const MailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const LinkedinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

const renderTextWithBold = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ document: doc, className = '' }, ref) => {

    const experience = doc.experience || [];
    const skills = doc.skills || [];
    const awards = doc.awards || [];
    const education = doc.education || [];
    const certifications = doc.certifications || [];
    const contact = (doc.contact || {}) as any;

    const containerStyle: React.CSSProperties = {
      fontFamily: 'Arial, Helvetica, sans-serif',
      backgroundColor: 'white',
      color: TEXT_BASE_COLOR,
      padding: RESUME_PREVIEW_PADDING_CSS,
      width: '210mm',
      minHeight: '297mm',
      boxSizing: 'border-box',
      margin: '0 auto',
      position: 'relative',
      fontSize: '9.5pt',
      lineHeight: '1.4',
    }

    const sectionHeadingStyle: React.CSSProperties = {
      color: THEME_BLUE,
      fontSize: '11pt',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      borderBottom: `1.5px solid ${THEME_BLUE}`,
      paddingBottom: '2pt',
      marginBottom: '6pt',
      marginTop: '12pt',
    }

    const renderHeader = () => {
      const contactItems: React.ReactNode[] = [];
      const { location, phone, email, linkedin } = contact;

      if (location) {
        contactItems.push(
          <span key="loc" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LocationIcon /> {location}
          </span>
        );
      }
      if (phone) {
        contactItems.push(
          <span key="phone" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <PhoneIcon /> {phone}
          </span>
        );
      }
      if (email) {
        contactItems.push(
          <span key="email" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MailIcon /> {email}
          </span>
        );
      }
      if (linkedin) {
        const linkedinLabel = linkedin.toLowerCase().includes('linkedin.com') ? 'LinkedIn' : linkedin;
        contactItems.push(
          <span key="linkedin" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}>
            <LinkedinIcon /> {linkedinLabel}
          </span>
        );
      }

      return (
        <div style={{ marginBottom: '12pt', textAlign: 'center' }}>
          <h1 style={{ fontSize: '22pt', fontWeight: 'bold', margin: '0 0 4pt 0', color: TEXT_BASE_COLOR }}>
            {contact.name || 'Your Name'}
          </h1>
          {contactItems.length > 0 && (
            <div style={{
              backgroundColor: THEME_BLUE,
              color: 'white',
              padding: '6pt 8pt',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8pt',
              fontSize: '9pt',
            }}>
              {contactItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item}
                  {index < contactItems.length - 1 && <span style={{ margin: '0 2px' }}>|</span>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )
    }

    const renderProfile = () => {
      if (!doc.profile && skills.length === 0) return null
      return (
        <section style={{ marginBottom: '12pt' }}>
          <div style={sectionHeadingStyle}>PROFILE</div>
          {doc.profile && (
            <div style={{ marginBottom: skills.length > 0 ? '6pt' : '0', textAlign: 'justify' }}>
              {renderTextWithBold(doc.profile)}
            </div>
          )}
          {skills.length > 0 && (
            <div style={{
              backgroundColor: THEME_BLUE,
              color: 'white',
              padding: '4pt 8pt',
              fontWeight: 'bold',
              lineHeight: '1.4',
              fontSize: '9pt',
            }}>
              {skills.join(' | ')}
            </div>
          )}
        </section>
      )
    }

    const renderAwards = () => {
      if (awards.length === 0) return null
      return (
        <section style={{ marginBottom: '12pt', pageBreakInside: 'avoid' }}>
          <div style={sectionHeadingStyle}>AWARDS & RECOGNITION</div>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24pt', margin: 0 }}>
            {awards.map((award: any, i: number) => (
              <li key={award.id || i} style={{ marginBottom: '2pt', paddingLeft: '4pt' }}>
                <strong>{award.title}</strong>
                {award.organization && ` – ${award.organization}`}
                {award.year && ` (${award.year})`}
              </li>
            ))}
          </ul>
        </section>
      )
    }

    const renderExperience = () => {
      if (experience.length === 0) return null
      return (
        <section style={{ marginBottom: '12pt' }}>
          <div style={sectionHeadingStyle}>PROFESSIONAL EXPERTISE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
            {experience.map((exp: any) => (
              <div key={exp.id} style={{ pageBreakInside: 'avoid' }}>
                <div style={{ marginBottom: '1pt' }}>
                  <span style={{ color: THEME_BLUE, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {exp.company}
                  </span>
                  {exp.location && (
                    <span style={{ fontWeight: 'bold' }}> – {exp.location}</span>
                  )}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '3pt' }}>
                  {exp.role} {exp.startDate && <span style={{ fontWeight: 'normal' }}>| {exp.startDate} – {exp.endDate || 'Present'}</span>}
                </div>
                {exp.bullets && exp.bullets.filter(Boolean).length > 0 && (
                  <ul style={{ listStyleType: 'disc', paddingLeft: '24pt', margin: 0 }}>
                    {exp.bullets.filter(Boolean).map((b: string, i: number) => (
                      <li key={i} style={{ marginBottom: '2pt', paddingLeft: '4pt', textAlign: 'justify' }}>
                        {renderTextWithBold(b)}
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

    const renderEducation = () => {
      if (education.length === 0) return null
      return (
        <section style={{ marginBottom: '12pt', pageBreakInside: 'avoid' }}>
          <div style={sectionHeadingStyle}>EDUCATION</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3pt' }}>
            {education.map((edu: any) => (
              <div key={edu.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1pt' }}>
                  <strong style={{ fontSize: '10.5pt', lineHeight: '1.2' }}>
                    {edu.degree}{edu.specialization ? `, ${edu.specialization}` : ''}
                  </strong>
                  {edu.date && (
                    <span style={{ fontSize: '9pt', whiteSpace: 'nowrap', marginLeft: '8pt' }}>
                      {edu.date}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '9.5pt', lineHeight: '1.2' }}>
                  {edu.institution}
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    const renderCertifications = () => {
      if (certifications.length === 0) return null
      return (
        <section style={{ marginBottom: '12pt', pageBreakInside: 'avoid' }}>
          <div style={sectionHeadingStyle}>CERTIFICATIONS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3pt' }}>
            {certifications.map((c: any, i: number) => (
              <div key={c.id || i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: '9.5pt', lineHeight: '1.2' }}>
                    <strong>{c.title}</strong>{c.issuer ? ` – ${c.issuer}` : ''}
                  </div>
                  {c.date && (
                    <span style={{ fontSize: '9pt', whiteSpace: 'nowrap', marginLeft: '8pt' }}>
                      {c.date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    const sectionOrder = doc.sectionOrder || ['profile', 'experience', 'awards', 'education', 'certifications'];

    const renderCustomSection = (sectionId: string) => {
      const section = doc.customSections?.find(s => s.id === sectionId);
      if (!section || section.items.length === 0) return null;
      return (
        <section key={section.id} style={{ marginBottom: '12pt', pageBreakInside: 'avoid' }}>
          <div style={sectionHeadingStyle}>{section.title}</div>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24pt', margin: 0 }}>
            {section.items.filter(Boolean).map((item, i) => (
              <li key={i} style={{ marginBottom: '2pt', paddingLeft: '4pt', textAlign: 'justify' }}>
                {renderTextWithBold(item)}
              </li>
            ))}
          </ul>
        </section>
      );
    };

    return (
      <div ref={ref} className={`resume-preview ${className}`} style={containerStyle}>
        {renderHeader()}
        {sectionOrder.map((section: string) => {
          if (section.startsWith('custom-')) {
            return renderCustomSection(section);
          }
          switch (section) {
            case 'profile':
              return <React.Fragment key="profile">{renderProfile()}</React.Fragment>
            case 'experience':
              return <React.Fragment key="experience">{renderExperience()}</React.Fragment>
            case 'awards':
              return <React.Fragment key="awards">{renderAwards()}</React.Fragment>
            case 'education':
              return <React.Fragment key="education">{renderEducation()}</React.Fragment>
            case 'certifications':
              return <React.Fragment key="certifications">{renderCertifications()}</React.Fragment>
            default:
              return null
          }
        })}
      </div>
    )
  }
)

ResumePreview.displayName = 'ResumePreview'
