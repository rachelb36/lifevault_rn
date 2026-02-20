# Interaction Doctrine

## Core Rules
1. Do not create new form modals.
2. Use inline accordion sections for short object-style forms (single profile-bound data).
3. Use route-based screens for complex records and multi-step flows (OCR/upload/attachments-heavy).
4. Keep modals only for:
   - destructive confirmations
   - system pickers/sheets (date/file/camera/library)

## Row With Summary Pattern
- Use a stable row layout for record launchers:
  - left: title
  - second line: subtle summary text
  - right: chevron
- Empty summary phrase must be: `Not added`
- Avoid loud badges and add-pill launchers for travel rows.

## Travel UX
- Travel section uses row launchers with summaries:
  - Passport
  - Passport Card
  - Loyalty Accounts
  - Travel IDs (if enabled)
- Tap behavior:
  - if existing record: open detail
  - if missing: open add route preselected for that type

## Singleton UX
- For short singleton sections (for example `Preferences`, `Sizes`):
  - no intermediate launcher pills
  - section tap opens existing detail or direct add/edit flow
