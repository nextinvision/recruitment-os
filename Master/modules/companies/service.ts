import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import {
    createCompanySchema,
    updateCompanySchema,
    createContactSchema,
    updateContactSchema,
    createNoteSchema,
    CompanyFilters,
    CompanyPagination,
    CreateCompanyInput,
    UpdateCompanyInput,
    CreateContactInput,
    UpdateContactInput,
    CreateNoteInput,
} from './schemas'

// ─── Company CRUD ─────────────────────────────────────────────────────────────

export async function createCompany(input: CreateCompanyInput, userId: string) {
    const validated = createCompanySchema.parse(input)

    return db.company.create({
        data: {
            name: validated.name,
            industry: validated.industry || null,
            website: validated.website || null,
            location: validated.location || null,
            size: validated.size || null,
            description: validated.description || null,
            linkedinUrl: validated.linkedinUrl || null,
            createdById: userId,
        },
        include: {
            _count: { select: { contacts: true, notes: true, jobs: true } },
        },
    })
}

export async function getCompanies(
    _userId: string,
    _userRole: UserRole,
    filters?: CompanyFilters,
    pagination?: CompanyPagination
) {
    const where: any = {}

    if (filters?.industry) {
        where.industry = { contains: filters.industry, mode: 'insensitive' }
    }
    if (filters?.size) {
        where.size = filters.size
    }
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { industry: { contains: filters.search, mode: 'insensitive' } },
            { location: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
        ]
    }

    const total = await db.company.count({ where })

    const page = pagination?.page || 1
    const pageSize = pagination?.pageSize || 25
    const skip = (page - 1) * pageSize

    const companies = await db.company.findMany({
        where,
        include: {
            _count: { select: { contacts: true, notes: true, jobs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
    })

    return {
        companies,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    }
}

export async function getCompanyById(id: string) {
    return db.company.findUnique({
        where: { id },
        include: {
            contacts: {
                orderBy: { createdAt: 'asc' },
            },
            notes: {
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
            },
            jobs: {
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    company: true,
                    location: true,
                    status: true,
                    jobType: true,
                    source: true,
                    createdAt: true,
                },
                take: 50,
            },
            createdBy: {
                select: { id: true, firstName: true, lastName: true },
            },
            _count: { select: { contacts: true, notes: true, jobs: true } },
        },
    })
}

export async function updateCompany(input: UpdateCompanyInput) {
    const { id, ...data } = updateCompanySchema.parse(input)
    const updateData: any = { ...data }

    // Normalize optional fields
    if (updateData.website === '') updateData.website = null
    if (updateData.linkedinUrl === '') updateData.linkedinUrl = null

    return db.company.update({
        where: { id },
        data: updateData,
        include: {
            _count: { select: { contacts: true, notes: true, jobs: true } },
        },
    })
}

export async function deleteCompany(id: string) {
    return db.company.delete({ where: { id } })
}

// ─── Company Stats ────────────────────────────────────────────────────────────

export async function getCompanyStats() {
    const total = await db.company.count()
    const totalContacts = await db.companyContact.count()
    const withJobs = await db.company.count({ where: { jobs: { some: {} } } })

    return { total, totalContacts, withJobs }
}

// ─── Contact CRUD ─────────────────────────────────────────────────────────────

export async function addContact(input: CreateContactInput) {
    const validated = createContactSchema.parse(input)

    return db.companyContact.create({
        data: {
            companyId: validated.companyId,
            firstName: validated.firstName,
            lastName: validated.lastName,
            role: validated.role ?? 'OTHER',
            email: validated.email || null,
            phone: validated.phone || null,
            linkedinUrl: validated.linkedinUrl || null,
            notes: validated.notes || null,
        },
    })
}

export async function updateContact(input: UpdateContactInput) {
    const { id, ...data } = updateContactSchema.parse(input)
    const updateData: any = { ...data }
    if (updateData.email === '') updateData.email = null
    if (updateData.linkedinUrl === '') updateData.linkedinUrl = null

    return db.companyContact.update({
        where: { id },
        data: updateData,
    })
}

export async function deleteContact(id: string) {
    return db.companyContact.delete({ where: { id } })
}

// ─── Note CRUD ────────────────────────────────────────────────────────────────

export async function addNote(input: CreateNoteInput, userId: string) {
    const validated = createNoteSchema.parse(input)

    return db.companyNote.create({
        data: {
            companyId: validated.companyId,
            content: validated.content,
            createdById: userId,
        },
        include: {
            createdBy: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    })
}

export async function deleteNote(id: string) {
    return db.companyNote.delete({ where: { id } })
}
