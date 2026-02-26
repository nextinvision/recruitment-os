'use client'

import React from 'react'
import { Button, Input, Textarea } from '@/ui'
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

export function ResumeEditor({
  document: doc,
  onChange,
  onAddExperience,
  onAddEducation,
  onRemoveExperience,
  onRemoveEducation,
}: ResumeEditorProps) {
  const update = (patch: Partial<ResumeDocument>) => {
    onChange({ ...doc, ...patch })
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
    }
    update({ certifications: [...doc.certifications, newCert] })
  }

  const handleSkillsChange = (value: string) => {
    const skills = value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
    update({ skills })
  }

  return (
    <div className="space-y-6">
      {/* Contact */}
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

      {/* Profile */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Profile / Summary
        </h3>
        <Textarea
          rows={5}
          value={doc.profile}
          onChange={(e) => update({ profile: e.target.value })}
          placeholder="Professional summary (2-4 sentences)"
        />
      </section>

      {/* Skills */}
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

      {/* Awards */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Awards & Recognition
          </h3>
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
      </section>

      {/* Experience */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Professional Experience
          </h3>
          <Button type="button" size="sm" variant="secondary" onClick={handleAddExperience}>
            + Add Experience
          </Button>
        </div>
        <div className="space-y-6">
          {doc.experience.map((exp) => (
            <div
              key={exp.id}
              className="rounded border border-gray-100 bg-gray-50 p-4"
            >
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
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => addBullet(exp.id)}
                >
                  + Add Bullet
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Education
          </h3>
          <Button type="button" size="sm" variant="secondary" onClick={handleAddEducation}>
            + Add Education
          </Button>
        </div>
        <div className="space-y-3">
          {doc.education.map((edu) => (
            <div
              key={edu.id}
              className="flex flex-col gap-2 rounded border border-gray-100 bg-gray-50 p-3"
            >
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
      </section>

      {/* Certifications */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Certifications
          </h3>
          <Button type="button" size="sm" variant="secondary" onClick={handleAddCertification}>
            + Add Certification
          </Button>
        </div>
        <div className="space-y-3">
          {doc.certifications.map((cert) => (
            <div key={cert.id} className="flex gap-2 rounded border border-gray-50 p-3">
              <Input
                label="Title"
                value={cert.title}
                onChange={(e) => updateCertification(cert.id, { title: e.target.value })}
                className="flex-1"
              />
              <Input
                label="Issuer"
                value={cert.issuer}
                onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => update({ certifications: doc.certifications.filter((c) => c.id !== cert.id) })}
                className="self-end"
              >
                −
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
