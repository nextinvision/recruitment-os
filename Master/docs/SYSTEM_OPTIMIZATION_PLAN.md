# System Optimization Plan: Lead → Client → Application Flow

## Current State Analysis

### Current Flow Issues:
1. **Applications are linked to Candidates, NOT Clients**
   - Application model has `candidateId` field
   - Should be linked to `clientId` instead
   - Clients come from Leads, so flow should be: Lead → Client → Application

2. **No Attachment System for Applications**
   - ApplicationAction has description field but no structured attachments
   - Need to support: Files, Links, Text attachments

3. **Missing Client-Application Relationship**
   - Cannot see applications from client detail page
   - Cannot create applications from client context

## Required Changes

### 1. Database Schema Changes

#### Application Model:
- **REMOVE**: `candidateId` field
- **ADD**: `clientId` field (required)
- **UPDATE**: Unique constraint from `[jobId, candidateId]` to `[jobId, clientId]`
- **ADD**: Relation to Client model

#### New ApplicationAttachment Model:
```prisma
model ApplicationAttachment {
  id            String   @id @default(cuid())
  applicationId String
  type          AttachmentType  // FILE, LINK, TEXT
  fileUrl       String?  // For FILE type
  fileName      String?  // For FILE type
  fileSize      Int?     // For FILE type
  linkUrl       String?  // For LINK type
  linkTitle     String?  // For LINK type
  textContent   String?  @db.Text // For TEXT type
  uploadedBy    String
  uploadedAt    DateTime @default(now())
  description   String?  @db.Text
  
  application Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  uploader    User         @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  @@index([applicationId])
  @@index([type])
  @@map("application_attachments")
}

enum AttachmentType {
  FILE
  LINK
  TEXT
}
```

### 2. Service Layer Changes

#### Application Service:
- Replace all `candidateId` references with `clientId`
- Update `createApplication` to require `clientId` instead of `candidateId`
- Update `getApplications` to filter by `clientId`
- Update all queries to include Client relation instead of Candidate

#### New ApplicationAttachment Service:
- `createAttachment(input)` - Create file/link/text attachment
- `getAttachmentsByApplication(applicationId)` - Get all attachments
- `deleteAttachment(id)` - Delete attachment
- `updateAttachment(id, input)` - Update attachment

### 3. API Changes

#### Application Endpoints:
- `POST /api/applications` - Accept `clientId` instead of `candidateId`
- `GET /api/applications` - Filter by `clientId` instead of `candidateId`
- `GET /api/clients/[id]/applications` - NEW: Get applications for a client

#### New Attachment Endpoints:
- `POST /api/applications/[id]/attachments` - Upload/create attachment
- `GET /api/applications/[id]/attachments` - List attachments
- `DELETE /api/applications/[id]/attachments/[attachmentId]` - Delete attachment
- `PATCH /api/applications/[id]/attachments/[attachmentId]` - Update attachment

### 4. UI Changes

#### Application List Page:
- Replace "Candidate" column with "Client" column
- Show client name instead of candidate name
- Update filters to use clientId

#### Application Detail Page:
- Show client information instead of candidate
- Add attachments section
- Allow adding files/links/text

#### Client Detail Page:
- Add "Applications" tab
- Show all applications for the client
- Allow creating new application from client page

### 5. Migration Strategy

1. **Data Migration** (if existing data exists):
   - Map existing Candidates to Clients (if possible)
   - Or mark old applications as legacy
   - Create new applications linked to clients

2. **Backward Compatibility**:
   - Keep Candidate model for now (may be used elsewhere)
   - Add migration script to convert candidate-based applications

## Implementation Order

1. ✅ Update Prisma schema
2. ✅ Create ApplicationAttachment model
3. ✅ Run database migration
4. ✅ Update Application service layer
5. ✅ Create ApplicationAttachment service
6. ✅ Update Application schemas
7. ✅ Update Application API endpoints
8. ✅ Create ApplicationAttachment API endpoints
9. ✅ Update Application UI components
10. ✅ Add attachment UI components
11. ✅ Update Client detail page
12. ✅ Test complete flow

## Benefits

1. **Proper Flow**: Lead → Client → Application (logical progression)
2. **Better Tracking**: Can see all applications for a client in one place
3. **Rich Attachments**: Support files, links, and text notes per application
4. **Better UX**: Create applications directly from client context
5. **Data Integrity**: Single source of truth (Client) for applications


