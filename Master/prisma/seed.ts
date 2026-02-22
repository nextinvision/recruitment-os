import { PrismaClient, UserRole, JobSource, JobStatus, ApplicationStage, LeadStatus, ClientStatus, RevenueStatus, ActivityType, NotificationType, NotificationChannel, MessageChannel, MessageStatus, MessageTemplateType, RuleEntity } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with comprehensive sample data...')

  // Clear existing data (optional - comment out if you want to preserve existing data)
  console.log('🧹 Clearing existing data...')
  await prisma.message.deleteMany()
  await prisma.messageTemplate.deleteMany()
  await prisma.automationRule.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.revenue.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.followUp.deleteMany()
  await prisma.resume.deleteMany()
  await prisma.application.deleteMany()
  await prisma.candidate.deleteMany()
  await prisma.job.deleteMany()
  await prisma.client.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.file.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Existing data cleared')

  // Create Users
  console.log('👥 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@careerist.com',
      password: hashedPassword,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: UserRole.ADMIN,
    },
  })

  const manager1 = await prisma.user.create({
    data: {
      email: 'manager1@careerist.com',
      password: hashedPassword,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: UserRole.MANAGER,
    },
  })

  const manager2 = await prisma.user.create({
    data: {
      email: 'manager2@careerist.com',
      password: hashedPassword,
      firstName: 'Amit',
      lastName: 'Patel',
      role: UserRole.MANAGER,
    },
  })

  const recruiter1 = await prisma.user.create({
    data: {
      email: 'recruiter1@careerist.com',
      password: hashedPassword,
      firstName: 'Sneha',
      lastName: 'Reddy',
      role: UserRole.RECRUITER,
      managerId: manager1.id,
    },
  })

  const recruiter2 = await prisma.user.create({
    data: {
      email: 'recruiter2@careerist.com',
      password: hashedPassword,
      firstName: 'Vikram',
      lastName: 'Singh',
      role: UserRole.RECRUITER,
      managerId: manager1.id,
    },
  })

  const recruiter3 = await prisma.user.create({
    data: {
      email: 'recruiter3@careerist.com',
      password: hashedPassword,
      firstName: 'Anjali',
      lastName: 'Mehta',
      role: UserRole.RECRUITER,
      managerId: manager2.id,
    },
  })

  console.log('✅ Created users')

  // Create Jobs
  console.log('💼 Creating jobs...')
  const jobs = [
    {
      title: 'Senior Full Stack Developer',
      company: 'TechCorp India',
      location: 'Bangalore, Karnataka',
      description: 'We are looking for an experienced Full Stack Developer with 5+ years of experience in React, Node.js, and PostgreSQL. The ideal candidate should have strong problem-solving skills and experience with microservices architecture.',
      source: JobSource.LINKEDIN,
      sourceUrl: 'https://linkedin.com/jobs/view/123456',
      skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'AWS'],
      experienceRequired: '5-8 years',
      salaryRange: '₹15,00,000 - ₹25,00,000',
      status: JobStatus.ACTIVE,
      recruiterId: recruiter1.id,
      notes: 'High priority position. Client is looking to fill quickly.',
    },
    {
      title: 'DevOps Engineer',
      company: 'CloudTech Solutions',
      location: 'Mumbai, Maharashtra',
      description: 'Seeking a DevOps Engineer to manage our cloud infrastructure. Experience with Kubernetes, Docker, CI/CD pipelines required.',
      source: JobSource.NAUKRI,
      sourceUrl: 'https://naukri.com/job/789012',
      skills: ['Kubernetes', 'Docker', 'AWS', 'Jenkins', 'Terraform'],
      experienceRequired: '3-6 years',
      salaryRange: '₹12,00,000 - ₹18,00,000',
      status: JobStatus.ACTIVE,
      recruiterId: recruiter1.id,
    },
    {
      title: 'Data Scientist',
      company: 'Analytics Pro',
      location: 'Hyderabad, Telangana',
      description: 'Looking for a Data Scientist with expertise in machine learning and statistical analysis. Python and SQL skills essential.',
      source: JobSource.INDEED,
      sourceUrl: 'https://indeed.com/job/345678',
      skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Pandas'],
      experienceRequired: '4-7 years',
      salaryRange: '₹18,00,000 - ₹30,00,000',
      status: JobStatus.ACTIVE,
      recruiterId: recruiter2.id,
    },
    {
      title: 'Product Manager',
      company: 'StartupHub',
      location: 'Pune, Maharashtra',
      description: 'Product Manager role for a fast-growing SaaS startup. Experience with agile methodologies and product roadmaps required.',
      source: JobSource.LINKEDIN,
      skills: ['Product Management', 'Agile', 'Roadmaps', 'Analytics'],
      experienceRequired: '6-10 years',
      salaryRange: '₹20,00,000 - ₹35,00,000',
      status: JobStatus.ACTIVE,
      recruiterId: recruiter2.id,
    },
    {
      title: 'UI/UX Designer',
      company: 'Design Studio',
      location: 'Delhi NCR',
      description: 'Creative UI/UX Designer needed for mobile and web applications. Portfolio required.',
      source: JobSource.LINKEDIN,
      skills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
      experienceRequired: '3-5 years',
      salaryRange: '₹8,00,000 - ₹15,00,000',
      status: JobStatus.ACTIVE,
      recruiterId: recruiter3.id,
    },
    {
      title: 'Backend Developer',
      company: 'FinTech Innovations',
      location: 'Chennai, Tamil Nadu',
      description: 'Backend Developer position for financial technology platform. Strong Java and Spring Boot experience required.',
      source: JobSource.NAUKRI,
      skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL'],
      experienceRequired: '4-7 years',
      salaryRange: '₹14,00,000 - ₹22,00,000',
      status: JobStatus.FILLED,
      recruiterId: recruiter1.id,
    },
  ]

  const createdJobs = []
  for (const jobData of jobs) {
    const job = await prisma.job.create({ data: jobData })
    createdJobs.push(job)
  }
  console.log('✅ Created jobs')

  // Create Candidates
  console.log('👤 Creating candidates...')
  const candidates = [
    {
      firstName: 'Rahul',
      lastName: 'Verma',
      email: 'rahul.verma@email.com',
      phone: '+91 98765 43210',
      linkedinUrl: 'https://linkedin.com/in/rahul-verma',
      tags: ['Full Stack', 'React', 'Node.js'],
      notes: 'Strong technical skills, good communication. Available immediately.',
      assignedRecruiterId: recruiter1.id,
    },
    {
      firstName: 'Kavita',
      lastName: 'Nair',
      email: 'kavita.nair@email.com',
      phone: '+91 98765 43211',
      linkedinUrl: 'https://linkedin.com/in/kavita-nair',
      tags: ['DevOps', 'Cloud', 'Kubernetes'],
      notes: 'Excellent DevOps engineer with AWS certification.',
      assignedRecruiterId: recruiter1.id,
    },
    {
      firstName: 'Arjun',
      lastName: 'Desai',
      email: 'arjun.desai@email.com',
      phone: '+91 98765 43212',
      linkedinUrl: 'https://linkedin.com/in/arjun-desai',
      tags: ['Data Science', 'Machine Learning', 'Python'],
      notes: 'PhD in Data Science, 5 years industry experience.',
      assignedRecruiterId: recruiter2.id,
    },
    {
      firstName: 'Meera',
      lastName: 'Iyer',
      email: 'meera.iyer@email.com',
      phone: '+91 98765 43213',
      linkedinUrl: 'https://linkedin.com/in/meera-iyer',
      tags: ['Product Management', 'SaaS', 'Agile'],
      notes: 'Previous experience at top tech companies.',
      assignedRecruiterId: recruiter2.id,
    },
    {
      firstName: 'Rohan',
      lastName: 'Malhotra',
      email: 'rohan.malhotra@email.com',
      phone: '+91 98765 43214',
      linkedinUrl: 'https://linkedin.com/in/rohan-malhotra',
      tags: ['UI/UX', 'Design', 'Figma'],
      notes: 'Creative designer with award-winning portfolio.',
      assignedRecruiterId: recruiter3.id,
    },
    {
      firstName: 'Sakshi',
      lastName: 'Joshi',
      email: 'sakshi.joshi@email.com',
      phone: '+91 98765 43215',
      linkedinUrl: 'https://linkedin.com/in/sakshi-joshi',
      tags: ['Backend', 'Java', 'Spring Boot'],
      notes: 'Strong backend developer, currently employed.',
      assignedRecruiterId: recruiter1.id,
    },
  ]

  const createdCandidates = []
  for (const candidateData of candidates) {
    const candidate = await prisma.candidate.create({ data: candidateData })
    createdCandidates.push(candidate)
  }
  console.log('✅ Created candidates')

  // Create Applications
  console.log('📋 Creating applications...')
  const applications = [
    {
      jobId: createdJobs[0].id,
      candidateId: createdCandidates[0].id,
      stage: ApplicationStage.APPLIED,
      recruiterId: recruiter1.id,
      notes: 'Candidate has applied, waiting for client response.',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      jobId: createdJobs[1].id,
      candidateId: createdCandidates[1].id,
      stage: ApplicationStage.INTERVIEW_SCHEDULED,
      recruiterId: recruiter1.id,
      notes: 'Interview scheduled for next week.',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      jobId: createdJobs[2].id,
      candidateId: createdCandidates[2].id,
      stage: ApplicationStage.OFFER,
      recruiterId: recruiter2.id,
      notes: 'Offer extended, candidate considering.',
    },
    {
      jobId: createdJobs[3].id,
      candidateId: createdCandidates[3].id,
      stage: ApplicationStage.CONNECTION_ACCEPTED,
      recruiterId: recruiter2.id,
      notes: 'LinkedIn connection accepted, preparing application.',
    },
    {
      jobId: createdJobs[4].id,
      candidateId: createdCandidates[4].id,
      stage: ApplicationStage.RESUME_UPDATED,
      recruiterId: recruiter3.id,
      notes: 'Resume updated, ready to send.',
    },
    {
      jobId: createdJobs[0].id,
      candidateId: createdCandidates[5].id,
      stage: ApplicationStage.REJECTED,
      recruiterId: recruiter1.id,
      notes: 'Candidate rejected after technical round.',
    },
    {
      jobId: createdJobs[1].id,
      candidateId: createdCandidates[0].id,
      stage: ApplicationStage.IDENTIFIED,
      recruiterId: recruiter1.id,
      notes: 'Potential candidate identified for this role.',
    },
  ]

  for (const appData of applications) {
    await prisma.application.create({ data: appData })
  }
  console.log('✅ Created applications')

  // Create Leads (person = job seeker / future client)
  console.log('🎯 Creating leads...')
  const leads = [
    {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      currentCompany: 'Global Tech Services',
      email: 'rajesh@globaltech.com',
      phone: '+91 98765 11111',
      status: LeadStatus.NEW,
      assignedUserId: recruiter1.id,
      source: 'LinkedIn',
      industry: 'IT Services',
      estimatedValue: 500000,
      notes: 'Large enterprise client, potential for multiple positions.',
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      currentCompany: 'Digital Solutions Pvt Ltd',
      email: 'priya@digitalsolutions.com',
      phone: '+91 98765 22222',
      status: LeadStatus.CONTACTED,
      assignedUserId: recruiter1.id,
      source: 'Website',
      industry: 'Software Development',
      estimatedValue: 300000,
      notes: 'Initial contact made, waiting for response.',
    },
    {
      firstName: 'Amit',
      lastName: 'Patel',
      currentCompany: 'Innovation Labs',
      email: 'amit@innovationlabs.com',
      phone: '+91 98765 33333',
      status: LeadStatus.QUALIFIED,
      assignedUserId: recruiter2.id,
      source: 'Referral',
      industry: 'Technology',
      estimatedValue: 750000,
      notes: 'Qualified lead, ready to convert to client.',
    },
    {
      firstName: 'Sneha',
      lastName: 'Reddy',
      currentCompany: 'Startup Ventures',
      email: 'sneha@startupventures.com',
      phone: '+91 98765 44444',
      status: LeadStatus.LOST,
      assignedUserId: recruiter2.id,
      source: 'Cold Call',
      industry: 'Startups',
      estimatedValue: 200000,
      notes: 'Client chose another vendor.',
    },
  ]

  const createdLeads = []
  for (const leadData of leads) {
    const lead = await prisma.lead.create({ data: leadData })
    createdLeads.push(lead)
  }
  console.log('✅ Created leads')

  // Create Clients (Job Seekers)
  console.log('👤 Creating clients (job seekers)...')
  const clients = [
    {
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'vikram.singh@email.com',
      phone: '+91 98765 55555',
      address: '123 Tech Park, Bangalore, Karnataka 560001',
      status: ClientStatus.ACTIVE,
      assignedUserId: recruiter1.id,
      leadId: null,
      industry: 'Information Technology',
      currentJobTitle: 'Senior Software Engineer',
      experience: '8 years in Full Stack Development',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
      notes: 'Looking for senior developer roles. Prefers remote work.',
    },
    {
      firstName: 'Anjali',
      lastName: 'Mehta',
      email: 'anjali.mehta@email.com',
      phone: '+91 98765 66666',
      address: '456 Business Tower, Mumbai, Maharashtra 400001',
      status: ClientStatus.ACTIVE,
      assignedUserId: recruiter1.id,
      leadId: createdLeads[2].id,
      industry: 'Cloud Services',
      currentJobTitle: 'DevOps Engineer',
      experience: '5 years in Cloud Infrastructure',
      skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
      notes: 'Converted from lead. Looking for DevOps lead positions.',
    },
    {
      firstName: 'Rohit',
      lastName: 'Agarwal',
      email: 'rohit.agarwal@email.com',
      phone: '+91 98765 77777',
      address: '789 Data Center, Hyderabad, Telangana 500001',
      status: ClientStatus.ACTIVE,
      assignedUserId: recruiter2.id,
      leadId: null,
      industry: 'Data Analytics',
      currentJobTitle: 'Data Scientist',
      experience: '6 years in Machine Learning',
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Pandas'],
      notes: 'New client, seeking data science roles in product companies.',
    },
    {
      firstName: 'Deepak',
      lastName: 'Gupta',
      email: 'deepak.gupta@email.com',
      phone: '+91 98765 88888',
      status: ClientStatus.INACTIVE,
      assignedUserId: recruiter2.id,
      leadId: null,
      industry: 'Enterprise Software',
      currentJobTitle: 'Product Manager',
      experience: '10 years in Product Management',
      skills: ['Product Strategy', 'Agile', 'Roadmaps', 'Analytics'],
      notes: 'Inactive client, found a position through another channel.',
    },
  ]

  const createdClients = []
  for (const clientData of clients) {
    const client = await prisma.client.create({ data: clientData })
    createdClients.push(client)
  }
  console.log('✅ Created clients')

  // Create Follow-ups
  console.log('📅 Creating follow-ups...')
  const followUps = [
    {
      leadId: createdLeads[0].id,
      clientId: null,
      assignedUserId: recruiter1.id,
      title: 'Follow up on initial proposal',
      description: 'Send detailed proposal and pricing information.',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      completed: false,
      notes: 'High priority follow-up.',
    },
    {
      leadId: createdLeads[1].id,
      clientId: null,
      assignedUserId: recruiter1.id,
      title: 'Schedule discovery call',
      description: 'Discuss requirements and timeline.',
      scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      completed: true,
      completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      notes: 'Call completed successfully.',
    },
    {
      leadId: null,
      clientId: createdClients[0].id,
      assignedUserId: recruiter1.id,
      title: 'Monthly check-in',
      description: 'Regular monthly check-in with client.',
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      completed: false,
    },
    {
      leadId: null,
      clientId: createdClients[1].id,
      assignedUserId: recruiter1.id,
      title: 'Project status update',
      description: 'Update client on current project status.',
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      completed: false,
    },
    {
      leadId: null,
      clientId: createdClients[2].id,
      assignedUserId: recruiter2.id,
      title: 'Kickoff meeting',
      description: 'Project kickoff meeting with new client.',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      completed: false,
    },
  ]

  for (const followUpData of followUps) {
    await prisma.followUp.create({ data: followUpData })
  }
  console.log('✅ Created follow-ups')

  // Create Activities
  console.log('📝 Creating activities...')
  const activities = [
    {
      leadId: createdLeads[0].id,
      clientId: null,
      assignedUserId: recruiter1.id,
      type: ActivityType.CALL,
      title: 'Initial discovery call',
      description: 'Discussed requirements and timeline with client.',
      occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      leadId: createdLeads[1].id,
      clientId: null,
      assignedUserId: recruiter1.id,
      type: ActivityType.EMAIL,
      title: 'Sent proposal email',
      description: 'Sent detailed proposal with pricing.',
      occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      leadId: null,
      clientId: createdClients[0].id,
      assignedUserId: recruiter1.id,
      type: ActivityType.MEETING,
      title: 'Client meeting',
      description: 'Quarterly business review meeting.',
      occurredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      leadId: null,
      clientId: createdClients[1].id,
      assignedUserId: recruiter1.id,
      type: ActivityType.NOTE,
      title: 'Client feedback',
      description: 'Client satisfied with recent placements.',
      occurredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      leadId: createdLeads[2].id,
      clientId: null,
      assignedUserId: recruiter2.id,
      type: ActivityType.TASK,
      title: 'Prepare contract',
      description: 'Draft service agreement for new client.',
      occurredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      leadId: null,
      clientId: createdClients[2].id,
      assignedUserId: recruiter2.id,
      type: ActivityType.CALL,
      title: 'Onboarding call',
      description: 'Initial onboarding call with new client.',
      occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]

  for (const activityData of activities) {
    await prisma.activity.create({ data: activityData })
  }
  console.log('✅ Created activities')

  // Create Revenues
  console.log('💰 Creating revenues...')
  const revenues = [
    {
      leadId: null,
      clientId: createdClients[0].id,
      assignedUserId: recruiter1.id,
      amount: 500000,
      status: RevenueStatus.PAID,
      invoiceNumber: 'INV-2024-001',
      dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      paidDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      description: 'Q1 2024 recruitment services',
    },
    {
      leadId: null,
      clientId: createdClients[1].id,
      assignedUserId: recruiter1.id,
      amount: 750000,
      status: RevenueStatus.PARTIAL,
      invoiceNumber: 'INV-2024-002',
      dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      description: 'Multiple position placements',
    },
    {
      leadId: createdLeads[2].id,
      clientId: null,
      assignedUserId: recruiter2.id,
      amount: 300000,
      status: RevenueStatus.PENDING,
      invoiceNumber: 'INV-2024-003',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      description: 'New client onboarding fee',
    },
    {
      leadId: null,
      clientId: createdClients[2].id,
      assignedUserId: recruiter2.id,
      amount: 400000,
      status: RevenueStatus.PENDING,
      invoiceNumber: 'INV-2024-004',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: 'Project-based recruitment',
    },
    {
      leadId: null,
      clientId: createdClients[0].id,
      assignedUserId: recruiter1.id,
      amount: 600000,
      status: RevenueStatus.PAID,
      invoiceNumber: 'INV-2024-005',
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paidDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      description: 'Q2 2024 recruitment services',
    },
  ]

  const createdRevenues = []
  for (const revenueData of revenues) {
    const revenue = await prisma.revenue.create({ data: revenueData })
    createdRevenues.push(revenue)
  }
  console.log('✅ Created revenues')

  // Create Payments
  console.log('💳 Creating payments...')
  const payments = [
    {
      revenueId: createdRevenues[0].id,
      clientId: createdClients[0].id,
      assignedUserId: recruiter1.id,
      amount: 500000,
      paymentDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-2024-001',
      notes: 'Full payment received',
    },
    {
      revenueId: createdRevenues[1].id,
      clientId: createdClients[1].id,
      assignedUserId: recruiter1.id,
      amount: 375000,
      paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-2024-002',
      notes: 'Partial payment - 50%',
    },
    {
      revenueId: createdRevenues[4].id,
      clientId: createdClients[0].id,
      assignedUserId: recruiter1.id,
      amount: 600000,
      paymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      paymentMethod: 'Bank Transfer',
      reference: 'TXN-2024-003',
      notes: 'Full payment received',
    },
  ]

  for (const paymentData of payments) {
    await prisma.payment.create({ data: paymentData })
  }
  console.log('✅ Created payments')

  // Create Message Templates
  console.log('📧 Creating message templates...')
  const templates = [
    {
      name: 'Follow-up Reminder',
      type: MessageTemplateType.FOLLOW_UP,
      channel: MessageChannel.EMAIL,
      subject: 'Follow-up: {{companyName}}',
      content: 'Hi {{contactName}},\n\nThis is a follow-up regarding our previous conversation about recruitment services for {{companyName}}.\n\nBest regards,\n{{senderName}}',
      variables: JSON.stringify(['companyName', 'contactName', 'senderName']),
      enabled: true,
      createdBy: admin.id,
    },
    {
      name: 'Interview Reminder',
      type: MessageTemplateType.INTERVIEW_REMINDER,
      channel: MessageChannel.WHATSAPP,
      subject: null,
      content: 'Hi {{candidateName}},\n\nThis is a reminder that your interview with {{companyName}} is scheduled for {{interviewDate}} at {{interviewTime}}.\n\nGood luck!\n{{senderName}}',
      variables: JSON.stringify(['candidateName', 'companyName', 'interviewDate', 'interviewTime', 'senderName']),
      enabled: true,
      createdBy: manager1.id,
    },
    {
      name: 'Welcome Email',
      type: MessageTemplateType.WELCOME,
      channel: MessageChannel.EMAIL,
      subject: 'Welcome to Careerist Recruitment Services',
      content: 'Dear {{clientName}},\n\nWelcome to Careerist! We are excited to partner with {{companyName}} for your recruitment needs.\n\nOur team will be in touch soon.\n\nBest regards,\nCareerist Team',
      variables: JSON.stringify(['clientName', 'companyName']),
      enabled: true,
      createdBy: admin.id,
    },
  ]

  const createdTemplates = []
  for (const templateData of templates) {
    const template = await prisma.messageTemplate.create({ data: templateData })
    createdTemplates.push(template)
  }
  console.log('✅ Created message templates')

  // Create Messages
  console.log('💬 Creating messages...')
  const messages = [
    {
      templateId: createdTemplates[0].id,
      channel: MessageChannel.EMAIL,
      recipientType: 'lead',
      recipientId: createdLeads[0].id,
      recipientEmail: createdLeads[0].email,
      subject: 'Follow-up: Global Tech Services',
      content: 'Hi Rajesh Kumar,\n\nThis is a follow-up regarding our previous conversation about recruitment services for Global Tech Services.\n\nBest regards,\nRajesh Kumar',
      status: MessageStatus.SENT,
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      sentBy: recruiter1.id,
    },
    {
      templateId: createdTemplates[1].id,
      channel: MessageChannel.WHATSAPP,
      recipientType: 'candidate',
      recipientId: createdCandidates[1].id,
      recipientPhone: createdCandidates[1].phone,
      subject: null,
      content: 'Hi Kavita Nair,\n\nThis is a reminder that your interview with CloudTech Solutions is scheduled for next week.\n\nGood luck!\nSneha Reddy',
      status: MessageStatus.DELIVERED,
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000),
      sentBy: recruiter1.id,
    },
    {
      templateId: null,
      channel: MessageChannel.EMAIL,
      recipientType: 'client',
      recipientId: createdClients[2].id,
      recipientEmail: createdClients[2].email,
      subject: 'Project Update',
      content: 'Dear Rohit Agarwal,\n\nThis is an update on your current recruitment project.\n\nBest regards,\nVikram Singh',
      status: MessageStatus.PENDING,
      sentBy: recruiter2.id,
    },
  ]

  for (const messageData of messages) {
    await prisma.message.create({ data: messageData })
  }
  console.log('✅ Created messages')

  // Create Automation Rules
  console.log('⚙️ Creating automation rules...')
  const rules = [
    {
      name: 'Auto-follow-up for new leads',
      description: 'Automatically create follow-up task for new leads after 2 days',
      entity: RuleEntity.LEAD,
      enabled: true,
      priority: 1,
      conditions: JSON.stringify([
        { field: 'status', operator: 'EQUALS', value: 'NEW' },
      ]),
      actions: JSON.stringify([
        { type: 'CREATE_FOLLOW_UP', params: { days: 2 } },
      ]),
      createdBy: admin.id,
    },
    {
      name: 'Notify on overdue payments',
      description: 'Send notification when payment is overdue',
      entity: RuleEntity.REVENUE,
      enabled: true,
      priority: 2,
      conditions: JSON.stringify([
        { field: 'status', operator: 'EQUALS', value: 'PENDING' },
        { field: 'dueDate', operator: 'DAYS_SINCE', value: 0 },
      ]),
      actions: JSON.stringify([
        { type: 'NOTIFY_MANAGER' },
      ]),
      createdBy: manager1.id,
    },
  ]

  for (const ruleData of rules) {
    await prisma.automationRule.create({ data: ruleData })
  }
  console.log('✅ Created automation rules')

  // Create Notifications
  console.log('🔔 Creating notifications...')
  const notifications = [
    {
      userId: recruiter1.id,
      type: NotificationType.FOLLOW_UP_REMINDER,
      channel: NotificationChannel.IN_APP,
      title: 'Follow-up Due',
      message: 'You have a follow-up scheduled for Global Tech Services tomorrow.',
      read: false,
      sent: true,
      sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      userId: recruiter2.id,
      type: NotificationType.INTERVIEW_ALERT,
      channel: NotificationChannel.IN_APP,
      title: 'Interview Scheduled',
      message: 'Interview scheduled for Kavita Nair with CloudTech Solutions.',
      read: false,
      sent: true,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      userId: manager1.id,
      type: NotificationType.OVERDUE_TASK,
      channel: NotificationChannel.EMAIL,
      title: 'Overdue Follow-up',
      message: 'Follow-up for Digital Solutions Pvt Ltd is overdue.',
      read: true,
      sent: true,
      sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
  ]

  for (const notificationData of notifications) {
    await prisma.notification.create({ data: notificationData })
  }
  console.log('✅ Created notifications')

  // Create Audit Logs
  console.log('📊 Creating audit logs...')
  const auditLogs = [
    {
      userId: admin.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: recruiter1.id,
      details: 'Created new recruiter user: Sneha Reddy',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
    },
    {
      userId: recruiter1.id,
      action: 'CREATE_JOB',
      entity: 'Job',
      entityId: createdJobs[0].id,
      details: 'Created new job: Senior Full Stack Developer at TechCorp India',
    },
    {
      userId: recruiter1.id,
      action: 'CREATE_CANDIDATE',
      entity: 'Candidate',
      entityId: createdCandidates[0].id,
      details: 'Created new candidate: Rahul Verma',
    },
    {
      userId: recruiter1.id,
      action: 'UPDATE_APPLICATION',
      entity: 'Application',
      entityId: applications[0].jobId,
      details: 'Updated application stage to APPLIED',
    },
    {
      userId: manager1.id,
      action: 'CREATE_CLIENT',
      entity: 'Client',
      entityId: createdClients[0].id,
      details: 'Created new client: TechCorp India',
    },
  ]

  for (const logData of auditLogs) {
    await prisma.auditLog.create({ data: logData })
  }
  console.log('✅ Created audit logs')

  // Create Files (Resumes)
  console.log('📄 Creating files/resumes...')
  const files = [
    {
      fileName: 'Rahul_Verma_Resume.pdf',
      fileUrl: '/files/resumes/rahul-verma-resume.pdf',
      fileType: 'RESUME' as const,
      fileSize: 245760,
      mimeType: 'application/pdf',
      uploadedBy: recruiter1.id,
    },
    {
      fileName: 'Kavita_Nair_Resume.pdf',
      fileUrl: '/files/resumes/kavita-nair-resume.pdf',
      fileType: 'RESUME' as const,
      fileSize: 312000,
      mimeType: 'application/pdf',
      uploadedBy: recruiter1.id,
    },
  ]

  const createdFiles = []
  for (const fileData of files) {
    const file = await prisma.file.create({ data: fileData })
    createdFiles.push(file)
  }

  // Create Resumes linked to candidates
  const resumes = [
    {
      candidateId: createdCandidates[0].id,
      fileUrl: createdFiles[0].fileUrl,
      fileName: createdFiles[0].fileName,
      fileSize: createdFiles[0].fileSize,
      version: 1,
      uploadedBy: recruiter1.id,
    },
    {
      candidateId: createdCandidates[1].id,
      fileUrl: createdFiles[1].fileUrl,
      fileName: createdFiles[1].fileName,
      fileSize: createdFiles[1].fileSize,
      version: 1,
      uploadedBy: recruiter1.id,
    },
  ]

  for (const resumeData of resumes) {
    await prisma.resume.create({ data: resumeData })
  }
  console.log('✅ Created files and resumes')

  console.log('\n✨ Comprehensive seeding completed!')
  console.log('\n📊 Summary:')
  console.log(`   - Users: ${await prisma.user.count()}`)
  console.log(`   - Jobs: ${await prisma.job.count()}`)
  console.log(`   - Candidates: ${await prisma.candidate.count()}`)
  console.log(`   - Applications: ${await prisma.application.count()}`)
  console.log(`   - Leads: ${await prisma.lead.count()}`)
  console.log(`   - Clients: ${await prisma.client.count()}`)
  console.log(`   - Follow-ups: ${await prisma.followUp.count()}`)
  console.log(`   - Activities: ${await prisma.activity.count()}`)
  console.log(`   - Revenues: ${await prisma.revenue.count()}`)
  console.log(`   - Payments: ${await prisma.payment.count()}`)
  console.log(`   - Message Templates: ${await prisma.messageTemplate.count()}`)
  console.log(`   - Messages: ${await prisma.message.count()}`)
  console.log(`   - Automation Rules: ${await prisma.automationRule.count()}`)
  console.log(`   - Notifications: ${await prisma.notification.count()}`)
  console.log(`   - Audit Logs: ${await prisma.auditLog.count()}`)
  console.log(`   - Files: ${await prisma.file.count()}`)
  console.log(`   - Resumes: ${await prisma.resume.count()}`)
  console.log('\n🔑 Login Credentials:')
  console.log('   Admin: admin@careerist.com / password123')
  console.log('   Manager: manager1@careerist.com / password123')
  console.log('   Recruiter: recruiter1@careerist.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
