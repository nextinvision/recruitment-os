# Communication templates

## Admin UI

**Admin → Communications** lists templates, filters by type/channel, and includes an expandable **“Where templates are used + {{placeholders}} reference”** panel. The same placeholder list appears when creating/editing a template in **TemplateBuilder**.

## Automation vs manual

| Mechanism | How the template is chosen |
|-----------|----------------------------|
| **Automation** (`CommunicationAutomation`, meeting reminders) | `getTemplateByType(type, channel)` — **first enabled** template for that type + channel. Keep only one enabled per pair if you want predictable behavior. |
| **Manual** (resume email, report email, lead onboarding, WhatsApp previews) | User selects a template **by ID** in the UI. Use **CUSTOM** (or any type) for these; naming conventions in seed/ensure script help you find them. |

## Bootstrap missing defaults (production)

Without wiping the database:

```bash
npm run db:ensure-templates
```

Creates named templates (if missing) for: interview email, offer email/WhatsApp, resume share, report notification, lead onboarding, rejection email/WhatsApp.

Existing installs: `npm run db:ensure-meeting-reminder` only adds the TidyCal meeting template.

## Source of truth in code

- `modules/communications/template-placeholders.ts` — flow descriptions and variables.
- `modules/communications/render-message-template.ts` — `{{variable}}` replacement and aliases (`clientName` ↔ `fullName`, `name` ↔ `contactName`).
- `scripts/ensure-default-templates.ts` — idempotent default rows.

## Future improvement

**Application job approval** emails/WhatsApp in `modules/applications/service.ts` are still **hardcoded HTML**. They can be migrated to `CUSTOM` templates + a small variable builder when product prioritizes it.
