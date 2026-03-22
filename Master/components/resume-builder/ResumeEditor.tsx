'use client'

import React from 'react'
import { Button, Input, Textarea, Spinner } from '@/ui'
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import type {
  ResumeDocument,
  ResumeExperience,
  ResumeEducation,
  ResumeAward,
  ResumeCertification
} from '@/modules/resume-builder/types'

interface ResumeEditorProps {
  document: ResumeDocument
  onChange: (doc: ResumeDocument) => void
  onAddExperience?: () => void
  onAddEducation?: () => void
  onRemoveExperience?: (id: string) => void
  onRemoveEducation?: (id: string) => void
}

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface SectionProps {
  id: string
  title: string
  children: React.ReactNode
  onMoveUp?: () => void
  onMoveDown?: () => void
  onRemove?: () => void
  isCustom?: boolean
}

const Section = ({ title, children, onMoveUp, onMoveDown, onRemove, isCustom }: SectionProps) => (
  <section className="rounded-lg border border-gray-200 bg-white p-4 group relative">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
        {title}
      </h3>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onMoveUp}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
          title="Move Up"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
          title="Move Down"
        >
          <ArrowDown size={14} />
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 hover:bg-red-50 rounded text-red-500 ml-1"
            title="Remove Section"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
    {children}
  </section>
)

export function ResumeEditor({
  document: doc,
  onChange,
  onAddExperience,
  onRemoveExperience,
  onAddEducation,
  onRemoveEducation,
}: ResumeEditorProps) {
  const update = (patch: Partial<ResumeDocument>) => {
    const nextDoc = { ...doc, ...patch }
    // Ensure sectionOrder exists and reflects all current sections
    const baseSections = ['profile', 'experience', 'awards', 'education', 'certifications']
    const customIds = nextDoc.customSections?.map(s => s.id) || []
    const allExpectedIds = [...baseSections, ...customIds]

    if (!nextDoc.sectionOrder) {
      nextDoc.sectionOrder = allExpectedIds
    } else {
      // Clean up orphaned IDs and add missing ones
      nextDoc.sectionOrder = nextDoc.sectionOrder.filter(id => allExpectedIds.includes(id))
      allExpectedIds.forEach(id => {
        if (!nextDoc.sectionOrder.includes(id)) {
          nextDoc.sectionOrder.push(id)
        }
      })
    }
    onChange(nextDoc)
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const order = [...(doc.sectionOrder || ['profile', 'experience', 'awards', 'education', 'certifications'])]
    const idx = order.indexOf(id)
    if (idx === -1) return
    if (direction === 'up' && idx > 0) {
      [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]]
    } else if (direction === 'down' && idx < order.length - 1) {
      [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]]
    }
    update({ sectionOrder: order })
  }

  const handleAddCustomSection = () => {
    const id = `custom-${Date.now()}`
    const newSection = { id, title: 'New Section', items: [''] }
    update({
      customSections: [...(doc.customSections || []), newSection],
      sectionOrder: [...(doc.sectionOrder || ['profile', 'experience', 'awards', 'education', 'certifications']), id]
    })
  }

  const updateCustomSection = (id: string, patch: Partial<{ title: string; items: string[] }>) => {
    const next = (doc.customSections || []).map(s => s.id === id ? { ...s, ...patch } : s)
    update({ customSections: next })
  }

  const removeCustomSection = (id: string) => {
    update({
      customSections: (doc.customSections || []).filter(s => s.id !== id),
      sectionOrder: (doc.sectionOrder || []).filter(sid => sid !== id)
    })
  }

  const addCustomItem = (sectionId: string) => {
    const section = doc.customSections?.find(s => s.id === sectionId)
    if (!section) return
    updateCustomSection(sectionId, { items: [...section.items, ''] })
  }

  const updateCustomItem = (sectionId: string, idx: number, value: string) => {
    const section = doc.customSections?.find(s => s.id === sectionId)
    if (!section) return
    const nextItems = [...section.items]
    nextItems[idx] = value
    updateCustomSection(sectionId, { items: nextItems })
  }

  const removeCustomItem = (sectionId: string, idx: number) => {
    const section = doc.customSections?.find(s => s.id === sectionId)
    if (!section) return
    updateCustomSection(sectionId, { items: section.items.filter((_, i) => i !== idx) })
  }

  const updateContact = (key: keyof typeof doc.contact, value: string) => {
    update({ contact: { ...doc.contact, [key]: value } })
  }

  const updateExperience = (id: string, patch: Partial<ResumeExperience>) => {
    const idx = doc.experience.findIndex((e) => e.id === id)
    if (idx === -1) return
    const next = [...doc.experience]
    next[idx] = { ...next[idx], ...patch }
    update({ experience: next })
  }

  const updateExperienceBullet = (expId: string, bulletIdx: number, value: string) => {
    const exp = doc.experience.find((e) => e.id === expId)
    if (!exp) return
    const bullets = [...exp.bullets]
    bullets[bulletIdx] = value
    updateExperience(expId, { bullets })
  }

  const addBullet = (expId: string) => {
    const exp = doc.experience.find((e) => e.id === expId)
    if (!exp) return
    updateExperience(expId, { bullets: [...exp.bullets, ''] })
  }

  const removeBullet = (expId: string, bulletIdx: number) => {
    const exp = doc.experience.find((e) => e.id === expId)
    if (!exp) return
    const bullets = exp.bullets.filter((_, i) => i !== bulletIdx)
    updateExperience(expId, { bullets })
  }

  const updateEducation = (id: string, patch: Partial<ResumeEducation>) => {
    const idx = doc.education.findIndex((e) => e.id === id)
    if (idx === -1) return
    const next = [...doc.education]
    next[idx] = { ...next[idx], ...patch }
    update({ education: next })
  }

  const updateAward = (id: string, patch: Partial<ResumeAward>) => {
    const idx = doc.awards.findIndex((a) => a.id === id)
    if (idx === -1) return
    const next = [...doc.awards]
    next[idx] = { ...next[idx], ...patch }
    update({ awards: next })
  }

  const updateCertification = (id: string, patch: Partial<ResumeCertification>) => {
    const idx = doc.certifications.findIndex((c) => c.id === id)
    if (idx === -1) return
    const next = [...doc.certifications]
    next[idx] = { ...next[idx], ...patch }
    update({ certifications: next })
  }

  const handleAddExperience = () => {
    const newExp: ResumeExperience = {
      id: generateId(),
      company: '',
      location: '',
      role: '',
      startDate: '',
      endDate: '',
      bullets: [''],
    }
    update({ experience: [...doc.experience, newExp] })
    onAddExperience?.()
  }

  const handleAddEducation = () => {
    const newEdu: ResumeEducation = {
      id: generateId(),
      degree: '',
      specialization: '',
      institution: '',
      date: '',
    }
    update({ education: [...doc.education, newEdu] })
    onAddEducation?.()
  }

  const handleAddAward = () => {
    const newAward: ResumeAward = {
      id: generateId(),
      title: '',
      organization: '',
      year: '',
    }
    update({ awards: [...doc.awards, newAward] })
  }

  const handleAddCertification = () => {
    const newCert: ResumeCertification = {
      id: generateId(),
      title: '',
      issuer: '',
      date: '',
    }
    update({ certifications: [...doc.certifications, newCert] })
  }

  const handleSkillsChange = (value: string) => {
    const skills = value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
    update({ skills })
  }

  const order = doc.sectionOrder || ['profile', 'experience', 'awards', 'education', 'certifications']

  return (
    <div className="space-y-6 pb-20">
      {/* Contact - Always at top */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Contact
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            label="Full Name"
            value={doc.contact.name}
            onChange={(e) => updateContact('name', e.target.value)}
          />
          <Input
            label="Location"
            value={doc.contact.location}
            onChange={(e) => updateContact('location', e.target.value)}
          />
          <Input
            label="Phone"
            value={doc.contact.phone}
            onChange={(e) => updateContact('phone', e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={doc.contact.email}
            onChange={(e) => updateContact('email', e.target.value)}
          />
          <Input
            label="LinkedIn"
            value={doc.contact.linkedin || ''}
            onChange={(e) => updateContact('linkedin', e.target.value)}
            placeholder="linkedin.com/in/username"
          />
        </div>
      </section>

      {/* Skills - Always below contact/above dynamic sections */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Skills
        </h3>
        <Input
          value={doc.skills.join(' | ')}
          onChange={(e) => handleSkillsChange(e.target.value)}
          placeholder="Separate with | or comma (e.g. Python | React | AWS)"
        />
      </section>

      {/* Dynamic Sections */}
      {order.map((sectionId) => {
        if (sectionId === 'profile') {
          return (
            <Section key="profile" id="profile" title="Profile / Summary" onMoveUp={() => moveSection('profile', 'up')} onMoveDown={() => moveSection('profile', 'down')}>
              <Textarea
                rows={5}
                value={doc.profile}
                onChange={(e) => update({ profile: e.target.value })}
                placeholder="Professional summary (2-4 sentences)"
              />
            </Section>
          )
        }

        if (sectionId === 'awards') {
          return (
            <Section key="awards" id="awards" title="Awards & Recognition" onMoveUp={() => moveSection('awards', 'up')} onMoveDown={() => moveSection('awards', 'down')}>
              <div className="mb-3 flex justify-end">
                <Button type="button" size="sm" variant="secondary" onClick={handleAddAward}>
                  + Add Award
                </Button>
              </div>
              <div className="space-y-4">
                {doc.awards.map((award) => (
                  <div key={award.id} className="grid gap-2 rounded border border-gray-50 p-3 md:grid-cols-3">
                    <Input
                      label="Title"
                      value={award.title}
                      onChange={(e) => updateAward(award.id, { title: e.target.value })}
                    />
                    <Input
                      label="Organization"
                      value={award.organization}
                      onChange={(e) => updateAward(award.id, { organization: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Input
                        label="Year"
                        value={award.year}
                        onChange={(e) => updateAward(award.id, { year: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => update({ awards: doc.awards.filter((a) => a.id !== award.id) })}
                        className="self-end"
                      >
                        −
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )
        }

        if (sectionId === 'experience') {
          return (
            <Section key="experience" id="experience" title="Professional Experience" onMoveUp={() => moveSection('experience', 'up')} onMoveDown={() => moveSection('experience', 'down')}>
              <div className="mb-3 flex justify-end">
                <Button type="button" size="sm" variant="secondary" onClick={handleAddExperience}>
                  + Add Experience
                </Button>
              </div>
              <div className="space-y-6">
                {doc.experience.map((exp) => (
                  <div key={exp.id} className="rounded border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Experience</span>
                      {onRemoveExperience && (
                        <button
                          type="button"
                          onClick={() => onRemoveExperience(exp.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        label="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                      />
                      <Input
                        label="Location"
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                      />
                      <Input
                        label="Role"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, { role: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="Start Date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                          placeholder="MMM YYYY"
                        />
                        <Input
                          label="End Date"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                          placeholder="MMM YYYY | Present"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-medium text-gray-600">Bullet Points</label>
                      {exp.bullets.map((bullet, i) => (
                        <div key={i} className="mb-2 flex gap-2">
                          <Textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(exp.id, i, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => removeBullet(exp.id, i)}
                            className="shrink-0"
                          >
                            −
                          </Button>
                        </div>
                      ))}
                      <Button type="button" size="sm" variant="secondary" onClick={() => addBullet(exp.id)}>
                        + Add Bullet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )
        }

        if (sectionId === 'education') {
          return (
            <Section key="education" id="education" title="Education" onMoveUp={() => moveSection('education', 'up')} onMoveDown={() => moveSection('education', 'down')}>
              <div className="mb-3 flex justify-end">
                <Button type="button" size="sm" variant="secondary" onClick={handleAddEducation}>
                  + Add Education
                </Button>
              </div>
              <div className="space-y-4">
                {doc.education.map((edu) => (
                  <div key={edu.id} className="flex flex-col gap-2 rounded border border-gray-100 bg-gray-50 p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        label="Degree"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                      />
                      <Input
                        label="Specialization"
                        value={edu.specialization || ''}
                        onChange={(e) => updateEducation(edu.id, { specialization: e.target.value })}
                      />
                      <Input
                        label="Institution"
                        value={edu.institution}
                        onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
                      />
                      <Input
                        label="Completion Date (Optional)"
                        value={edu.date || ''}
                        onChange={(e) => updateEducation(edu.id, { date: e.target.value })}
                        placeholder="MMM YYYY"
                      />
                    </div>
                    {onRemoveEducation && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => onRemoveEducation(edu.id)}
                        className="self-end text-red-600"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )
        }

        if (sectionId === 'certifications') {
          return (
            <Section key="certifications" id="certifications" title="Certifications" onMoveUp={() => moveSection('certifications', 'up')} onMoveDown={() => moveSection('certifications', 'down')}>
              <div className="mb-3 flex justify-end">
                <Button type="button" size="sm" variant="secondary" onClick={handleAddCertification}>
                  + Add Certification
                </Button>
              </div>
              <div className="space-y-3">
                {doc.certifications.map((cert) => (
                  <div key={cert.id} className="flex flex-col gap-3 rounded border border-gray-50 p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input
                        label="Title"
                        value={cert.title}
                        onChange={(e) => updateCertification(cert.id, { title: e.target.value })}
                      />
                      <Input
                        label="Issuer"
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                      />
                      <Input
                        label="Date (Optional)"
                        value={cert.date || ''}
                        onChange={(e) => updateCertification(cert.id, { date: e.target.value })}
                        placeholder="MMM YYYY"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => update({ certifications: doc.certifications.filter((c) => c.id !== cert.id) })}
                      className="self-end"
                    >
                      − Remove
                    </Button>
                  </div>
                ))}
              </div>
            </Section>
          )
        }

        if (sectionId.startsWith('custom-')) {
          const section = doc.customSections?.find(s => s.id === sectionId)
          if (!section) return null
          return (
            <Section 
              key={section.id} 
              id={section.id} 
              title={section.title} 
              isCustom 
              onMoveUp={() => moveSection(section.id, 'up')} 
              onMoveDown={() => moveSection(section.id, 'down')}
              onRemove={() => removeCustomSection(section.id)}
            >
              <div className="mb-4">
                <Input 
                  label="Section Title" 
                  value={section.title} 
                  onChange={(e) => updateCustomSection(section.id, { title: e.target.value })} 
                />
              </div>
              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Textarea 
                      rows={2} 
                      value={item} 
                      onChange={(e) => updateCustomItem(section.id, idx, e.target.value)} 
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => removeCustomItem(section.id, idx)}
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="secondary" onClick={() => addCustomItem(section.id)}>
                  + Add Item
                </Button>
              </div>
            </Section>
          )
        }

        return null
      })}

      <div className="flex justify-center pt-4">
        <Button variant="secondary" onClick={handleAddCustomSection}>
          + Add Custom Section
        </Button>
      </div>
    </div>
  )
}
