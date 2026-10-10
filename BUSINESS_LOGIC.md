# ATS-CRM — Business Logic Reference

Describes what the backend (`ats-crm-backend`) actually does. When this file and the code disagree, the code wins — please fix the file.

---

## 1. ARCHITECTURE

```
ats-ui (React)  ──► HTTP + Socket.IO ──► ats-crm-backend (Node/Express/Mongoose)
crm-ui (React)  ──► HTTP + Socket.IO ──►   ├─ /api/v1/auth
                                            ├─ /api/v1/shared      (users, settings, activity-logs)
                                            ├─ /api/v1/ats
                                            ├─ /api/v1/crm
                                            ├─ /api/v1/reports     (ATS disposition export)
                                            └─ /api/webhooks       (Resend)
```

- **One backend, one MongoDB database** (23 collections), shared by ATS and CRM.
- **ATS** = recruitment: candidates, jobs, applications, interviews, clients, emails.
- **CRM** = post-hire: assignments, EODs, work entries, scorecards, performance reviews, survey reminders.
- Each app has its own login (`app: 'ats' | 'crm'`), its own refresh cookie and its own socket namespace (`/ats`, `/crm`).
- The ATS UI loads all data once after login (`limit` 9999 per resource) and filters client-side; Socket.IO events patch its stores.

### Public (no login) endpoints

- `GET /ats/jobs`, `GET /ats/jobs/:id` — anonymous callers get only **open** jobs (a draft returns 404 by id), trimmed to public fields (no client, owner, pipeline, tags, priority). A valid token returns the full job.
- `POST /ats/jobs/:id/apply` — the apply form.
- `POST /ats/candidates/public/parse` and `/public/upload-and-parse` — stateless resume parsing (no DB write, no upload).
- `/auth/*` login, refresh, forgot/reset password, verify-email, set-password.
- `/webhooks/resend`.

---

## 2. ENUMS

```typescript
CandidateStatus   = 'pending' | 'approved' | 'hired';
EligibilityStatus = 'eligible' | 'permanently_ineligible';
ApplicationPhase  = 'pending' | 'approved' | 'hired' | 'rejected';
JobStatus         = 'draft' | 'open' | 'on_hold' | 'closed';
InterviewStatus   = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
InterviewType     = 'zoom' | 'google_meet' | 'phone_call' | 'in_person';
ClientStatus      = 'active' | 'inactive' | 'suspended';
CrmHealth         = 'green' | 'yellow' | 'red';
JobPriority       = 'low' | 'medium' | 'high' | 'urgent';
JobType           = 'full_time' | 'part_time' | 'contract' | 'temporary';
LocationType      = 'remote' | 'hybrid' | 'onsite';
ExperienceLevel   = 'entry' | 'mid' | 'senior' | 'lead';
AiFitRecommendation = 'poor_fit' | 'moderate_fit' | 'good_fit' | 'strong_fit';
InterviewRecommendation = 'strong_yes' | 'yes' | 'neutral' | 'no' | 'strong_no';
CandidateSource   = 'applied' | 'internal_upload';
ApplicationSource = 'direct_apply' | 'internal_upload' | 'assigned';
SalaryPeriod      = 'hourly' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'yearly';
CompanySize       = '1-10' | '11-50' | '51-200' | '201-500' | '500+';
EmailDirection    = 'outbound' | 'inbound';
EmailStatus       = 'pending' | 'sent' | 'delivered' | 'delayed' | 'failed' | 'bounced' | 'complained' | 'received';
EmailTemplateType = 'interview' | 'offer' | 'rejection' | 'follow_up' | 'eod_reminder'
                  | 'survey_reminder' | 'application_confirmation' | 'general';
ClientNoteMethod  = 'call' | 'email' | 'meeting' | 'message' | 'other';
UserRole          = 'admin' | 'hiring_manager' | 'recruiter' | 'coordinator' | 'interviewer'
                  | 'account_manager' | 'client' | 'va';
AppAccess         = 'ats' | 'crm';
ReviewType        = '30_day' | '60_day' | '90_day' | 'annual' | 'client_satisfaction' | 'corrective_coaching';
ReviewStatus      = 'draft' | 'ai_generated' | 'in_review' | 'sent_to_client' | 'archived' | 'completed';
EnglishProficiency = 'basic' | 'conversational' | 'professional' | 'fluent' | 'native';
VideoIntroSource  = 'cloudinary' | 'external';
AssignmentStatus  = 'active' | 'on_hold' | 'ended';
WorkEntryStatus   = 'completed' | 'in_progress' | 'pending';
DispositionCategory = 'experience_and_qualifications' | 'interview_performance'
                  | 'availability_and_employment' | 'recruiter_or_client_selection'
                  | 'candidate_actions' | 'permanently_ineligible_reasons' | 'other';
DispositionDestination = 'candidate_pool' | 'permanently_ineligible';
```

---

## 3. COLLECTIONS (23)

All documents have `createdAt`/`updatedAt`. `toSafeObject()` stringifies ids. Only fields that matter for behaviour are listed.

### 3.1 User → `users`

| Field | Notes |
| ----- | ----- |
| `firstName`, `lastName`, `email` (unique, lowercase), `phone`, `avatar` | |
| `roles` `[UserRole]` | |
| `appAccess` `[AppAccess]` | derived from roles (admin → both) |
| `permissions` | resource → actions map (see §4); rebuilt whenever roles change |
| `isActive` (default true) | |
| `emailVerified`, `isInviteAccepted` | |
| `passwordHash` | bcrypt, 12 rounds |
| `refreshTokenAts`, `refreshTokenCrm` | one slot per app |
| `passwordResetToken/Expires` | 32-byte hex, 1 hour |
| `inviteToken/Expires` | 32-byte hex, 24 hours |
| `lastLoginAts`, `lastLoginCrm` | |
| `clientRef` | Client id, set for `client` users |
| `candidateRef` | Candidate id, set for `va` users |
| `createdBy` | |

`toSafeObject()` removes `passwordHash`, both refresh tokens, `passwordResetToken` and `inviteToken`.

### 3.2 Candidate → `candidates`

| Field | Notes |
| ----- | ----- |
| `firstName`, `lastName`, `email` (unique), `phone`, `phoneNormalized` | last 10 digits, used for duplicate matching |
| `avatar`, `resumeUrl`, `resumeOriginalName`, `resumeRawText` | resume on Cloudinary (`raw`) |
| `videoIntroUrl`, `videoIntroSource` | |
| `portfolioUrl`, `portfolioFileUrl`, `portfolioFileName` | optional work samples, apply form only |
| `parsedData` | `{ summary, skills[], languages[], certifications[], experience[], education[] }` (AI) |
| `aiValidation` | `{ isValid, score, reason, completedAt }` — real/fake check (TYPE 1) |
| `aiScore` | convenience copy of the latest application score |
| `appliedJobId` | job they applied to / were last moved to |
| `yearsOfExperience`, `englishProficiency`, `currentSalaryPHP/USD`, `reasonForLeaving`, `cityOfResidence` | |
| `source` | `applied` \| `internal_upload` |
| `tags` | Tag ids |
| `inTalentPool`, `talentPoolAddedAt`, `talentPoolNotes` | |
| `status` | `pending` (default) \| `approved` \| `hired` |
| `eligibilityStatus` | `eligible` (default) \| `permanently_ineligible` |
| `permanentlyIneligibleAt/By/Reason` | Reason is a DispositionReason id |
| `legalHold` | blocks permanent deletion |
| `crmProfile` | `{ workloadLevel: low/medium/high, satisfactionScore, burnoutRiskFlag, replacementRiskFlag, lastVaCheckin, notes }` (legacy; the live VA data is in `vaprofiles`) |
| `createdBy`, `updatedBy` | |

### 3.3 Job → `jobs`

`title`, `description` (HTML, sanitised on save), `clientId`, `status` (default `draft`), `jobType`, `locationType`, `location`, `experienceLevel`, `priority`, `openings` (≥1), `requirements[]`, `responsibilities[]`, `skills[]`, `benefits[]`, `tags[]`, `salaryRange { min, max, currency, period }`, `applicationDeadline`, `startDate`, `createdBy`, `updatedBy`.

`pipeline = { templateId, stages[{ _id, name, color, order, isActive, icon }] }` — a **copy** of a pipeline template made at creation (fresh stage ids).

### 3.4 Application → `applications`

| Field | Notes |
| ----- | ----- |
| `candidateId`, `jobId`, `clientId` | unique index on `(candidateId, jobId)` regardless of phase |
| `phase` | `pending` \| `approved` \| `hired` \| `rejected` |
| `currentStage` | `{ stageId, stageName, assignedAt, assignedBy }`, null unless approved |
| `lastStage` | stage held when it was closed (history) |
| `source` | `direct_apply` \| `internal_upload` \| `assigned` |
| `aiValidation`, `aiScore` | `aiScore` is the source of truth for scoring |
| `approvedAt/By`, `hiredAt/By` | |
| `rejectedAt/By`, `rejectionReason` | text label of the reason |
| `closedAt/By`, `dispositionDate`, `dispositionReasonId`, `dispositionDestination`, `internalNotes` | set **only** for a final rejection (§5.3) |
| `isBlocked` | created for a permanently ineligible candidate |
| `interviewIds[]`, `notes`, `appliedAt` | |

### 3.5 Interview → `interviews`

`applicationId`, `candidateId`, `jobId`, `clientId`, `title`, `type`, `status`, `scheduledAt`, `duration` (always 60 min, server-set), `timezone` (always the company timezone, server-set), `meetingDetails { link, meetingId, password, phoneNumber, address }`, `interviewerIds[]`, `feedbacks[{ interviewerId, rating 1-5, notes, recommendation, submittedAt }]`, `organizerId`, `reminderSent`. `round` and `interviewType` are legacy and unused.

### 3.6 InterviewScorecard → `interviewscorecards`

Structured screening form per candidate/job/interviewer. Raw inputs: communication (diction, comprehension), experience selections + rating, professionalism, technology setup and availability (yes/no checks plus a 1–5 rating each), notes, and a required `finalRecommendation` (`strongly_recommend`, `recommend`, `recommend_with_concerns`, `hold_for_another_position`, `do_not_recommend`). The server **recomputes** all scores and ignores client values: communication = rounded average of the two sub-ratings; each category weighted out of its weight (communication 30, experience 25, technology 20, professionalism 15, availability 10); `overallScore` = sum (0–100).

### 3.7 Client → `clients`

`companyName`, `email`, `phone`, `website` (http(s) only), `logo`, `industry`, `companySize`, `status`, `description`, `address`, `contacts[{ name, email, phone, position, isPrimary }]` (setting one primary clears the others), `notes[{ method, content, author }]` (admin-only thread), `tags[]`, `crmProfile { healthStatus, baaSign, baaSignedDate, emrSystem, onboardingComplete, sopReceived, satisfactionScore, openIssuesCount, lastClientCheckin, notes, accountOwnerId, serviceStartDate, primaryContact, secondaryContact }`. `companySize` typos are normalised by model hooks. Email uniqueness is checked in the service.

### 3.8 Email → `emails`

`direction`, `from`, `to/cc/bcc`, `subject`, `bodyHtml/bodyText`, `status`, `threadId`, `inReplyTo`, `messageId`, `resendId`, `templateId`, `context { type, candidateId, applicationId, jobId, interviewId }`, `sentAt/deliveredAt/failedAt/receivedAt/openedAt/clickedAt/bouncedAt`, `openCount/clickCount`, `failureReason`, `attachments[]`, `sentBy`, `isRead`.

### 3.9 EmailTemplate → `emailtemplates`

`name` (unique), `subject`, `bodyHtml`, `bodyText`, `type`, `variables[]`, `isDefault` (only one default per type; setting one un-sets the others), `isActive`. Allowed variables: `candidateName`, `candidateEmail`, `jobTitle`, `clientName`, `interviewDate`, `interviewTime`, `interviewType`, `meetingLink`, `interviewerName`, `companyName`, `senderName`.

### 3.10 PipelineTemplate → `pipelinetemplates`

`name` (unique), `description`, `isDefault` (a partial unique index allows only one), `isActive`, `stages[{ name, color, order, isActive, icon }]` (stage orders must be unique; icons come from a fixed list).

### 3.11 Tag → `tags`

`name` (unique, case-insensitive check), `color` (`#rrggbb`). Shared by candidates, jobs and clients. Deleting a tag does not remove it from records that use it.

### 3.12 DispositionReason → `dispositionreasons`

`label`, `category`, `isActive`, `order`, `applicableStages[]` (empty = all), `defaultEligibility`, `requireInternalNotes`. A reason in `permanently_ineligible_reasons` always has `defaultEligibility = permanently_ineligible`. A reason that has been used cannot be deleted (409) — deactivate it.

### 3.13 ActivityLog → `activitylogs`

`action`, `resourceType`, `resourceId`, `relatedType`, `relatedId`, `description`, `metadata`, `performedBy` (null for AI/cron). Writes are fire-and-forget (errors are logged, never thrown). List endpoints add `performerName`/`performerAvatar`. Default page size 50.

### 3.14 Settings → `settings` (singleton, upserted on first read)

| Field | Notes |
| ----- | ----- |
| `email.fromName` | editable display name |
| `email.fromEmail` | fixed to `COMPANY_EMAIL` (Resend only sends from the verified domain; inbound replies arrive there) |
| `ai.provider` | `claude` \| `openai`; changing it clears the provider cache |
| `ai.resumeValidation` | switches **both** candidacy validation and resume validation |
| `ai.candidateScoring`, `ai.resumeParsing` | |
| `applicationConfirmation` | `{ enabled, templateId }` — confirmation email after a public apply |
| `companyTimezone` | IANA zone, default `America/Chicago`; the env var `COMPANY_TIMEZONE` is the fallback |

### 3.15 Assignment → `assignments` (CRM)

`candidateId` (the VA), `clientId`, `status`, `serviceType`, `startDate`, `endDate`, `accountManagerId`, `notes`, `createdBy`, `updatedBy`. An ended assignment cannot be edited.

### 3.16 WorkEntry → `workentries` (CRM)

`assignmentId`, `candidateId`, `clientId` (both copied from the assignment), `entryDate`, `entryTime` (HH:MM), `taskCategory`, `taskDescription`, `timeSpent` (1–480 min), `status`, `notes`. **Soft delete**: `isDeleted`, `deletedAt`. Deleted entries are excluded from lists, reports, the dashboard and scorecards.

### 3.17 EodSubmission → `eodsubmissions` (CRM)

`assignmentId`, `candidateId`, `clientId`, `date` (instant the company day started), `dateKey` (`YYYY-MM-DD`, the company business day — the field all comparisons use), `dateTimezone`, `shiftStart`, `shiftEnd` (HH:MM, company clock), `hoursWorked` (computed by the server from the shift; wraps past midnight), `workEntries[{ task, description, quantity, status, timeSpent }]`, legacy `summaryOfWork`, `pendingTasks`, `blockers`, `notes`, `communicatedWithClient` (`yes|no|other`, required on create), `clientNote`. **Unique index `(assignmentId, dateKey)`**: one EOD per assignment per business day. API responses expose `date` as the `dateKey`.

### 3.18 EodReminder → `eodreminders` (CRM)

`assignmentId`, `candidateId`, `reminderDate`, `reminderType` (`missing_eod`), `status` (`sent` \| `failed`). Written only by the EOD cron; read-only through the API.

### 3.19 SurveyReminder → `surveyreminders` (CRM)

`relatedType` (`client|va|assignment`), `relatedId`, `surveyType` (`3_day|1_week|30_day|60_day|90_day|monthly`), `dueDate`, `completedDate`, `status` (`pending|sent|completed|skipped`), `assignedTo` (account manager).

### 3.20 PerformanceReview → `performancereviews` (CRM)

`candidateId`, `clientId`, `jobId`, `reviewType`, `reviewPeriodStart/End`, `status`, `aiGenerated { roleSummary, coreResponsibilities[], strengths, areasForImprovement, goals[], finalRecommendation, generatedAt }`, `categories[{ categoryName, categoryDescription, reviewQuestions[], suggestedKpis[], managerCommentPrompt, rating 1-5, managerComments, sortOrder }]`, `overallRating`, `clientSatisfactionScore`, `managerRatingInputs`, `finalRecommendation`, `finalManagerSummary`, `generatedByUserId`, `reviewedByUserId`. A completed review is read-only; completing goes through `PATCH /:id/complete`.

### 3.21 Scorecard → `scorecards` (CRM, weekly)

One per `(vaId, assignmentId, weekStart)`: `totalHours`, `totalTasksCompleted`, `avgTasksPerDay`, `eodComplianceRate`, `onTimeSubmissionRate`, `productivityScore`, `categoryDistribution`. Score = EOD compliance 40 + work volume (hours/40) 30 + tasks completed 20 + on-time submission 10. Generated on request (`POST /crm/scorecards/generate`), upserting the current week.

### 3.22 VaProfile → `vaprofiles` (CRM)

One per VA (`vaId` = Candidate id, auto-created on first read or provisioning): `workloadLevel` (`low|normal|high|overloaded`), `satisfactionScore`, `burnoutRiskFlag`, `replacementRiskFlag`, `lastVaCheckin`, `notes`, and an admin-only `noteThread[]`.

### 3.23 CronLock → `cronlocks`

Distributed lock for cron jobs; documents expire after 5 minutes.

---

## 4. RBAC

### Role → app access

| Roles | App access |
| ----- | ---------- |
| `admin` | `ats`, `crm` |
| `hiring_manager`, `recruiter`, `coordinator`, `interviewer` | `ats` |
| `account_manager`, `client`, `va` | `crm` |

### How checks work

- `authenticate` verifies the access token only (no DB read per request). Roles, `appAccess` and `permissions` are baked into the token, so a change shows up after the next token refresh.
- `requireAppAccess('ats'|'crm')`, then either `requirePermission(resource, action)` (ATS routes) or `requireRoles(...)` (CRM routes). **Admin bypasses every check.**
- Hierarchy: `manage > write > read`; `schedule > write > read`.
- A user can switch off by `isActive = false` (login and refresh are refused, refresh tokens cleared).

### Default permissions (granted when roles are set)

| Resource | hiring_manager | recruiter | coordinator | interviewer | account_manager | client | va |
| -------- | -------------- | --------- | ----------- | ----------- | --------------- | ------ | -- |
| candidates | manage | manage | write | read | — | — | — |
| jobs | manage | read | read | — | — | — | — |
| interviews | write | write | write + schedule | write | — | — | — |
| interviewScorecards | write | write | write | write | — | — | — |
| clients | read | read | read | — | write | read | — |
| emails | write | write | write | — | — | — | — |
| tags | write | read | read | read | — | — | — |
| settings | read | read | read | — | — | — | — |
| dashboard | read | read | read | — | read | — | — |
| team | read | read | read | read | — | — | — |
| pipelineTemplates / emailTemplates | read | read | read | — | — | — | — |
| activityLogs | — | — | — | — | read | — | — |
| assignments | — | — | — | — | manage | read | read |
| reports | — | — | — | — | manage | read | — |
| eod | — | — | — | — | approve | read | write |
| performanceReview | — | — | — | — | approve | — | — |

Admin gets everything. Permissions can be edited per user (`PATCH /shared/users/:id/permissions`, needs `team.manage`); changing a user's roles rebuilds their permissions and discards manual edits.

### Admin-only rules

- Only an admin may assign the `admin` role, or edit, remove or revoke an admin account.
- Admin-only routes: candidate eligibility, restore and legal hold; permanently-ineligible list and delete; client notes; VA notes. (The disposition-reasons settings page is also admin-only in the UI; the API needs `settings.write`.)
- A user cannot remove or revoke themselves.

### CRM scoping (backend)

- **VA**: only records whose `candidateId` equals their `candidateRef`. A VA without a ref gets 403.
- **Client**: only records whose `clientId` equals their `clientRef` (including `hired-vas`).
- **Account manager**: only assignments where they are `accountManagerId`, and the work entries, EODs, reminders, scorecards and reviews tied to those assignments. They can create or reassign assignments only to themselves. (The CRM UI lets only admins create assignments.)
- **Admin**: everything.
- VAs write EODs and work entries; admin/AM/client are read-only for them (an admin passes the role check and can also write).

---

## 5. LIFECYCLES & FLOWS

### 5.1 Candidate lifecycle

```
PUBLIC APPLY  (POST /ats/jobs/:id/apply)
 ├─ job must be open; resume (PDF/DOCX ≤5 MB, text-based) required
 ├─ existing candidate matched by email, then phone
 │    ├─ still pending, not in pipeline, not banned → profile/resume refreshed
 │    └─ otherwise → record left exactly as it is
 ├─ new candidate → status: pending, source: applied, appliedJobId set
 ├─ permanently ineligible → logged, response `{ blocked: true }`, nothing else
 ├─ AI: resume parsing (if not already parsed) + candidacy validation
 └─ optional confirmation email (Settings → applicationConfirmation)
 NO application is created here.

INTERNAL IMPORT  (POST /ats/candidates, needs candidates.write)
 └─ status: approved, source: internal_upload, no application yet
    (a job is attached afterwards with assign-job)

IN REVIEW  (status pending, not in talent pool, not banned)
 ├─ Approve (jobId from body or appliedJobId)
 │    → application created (direct_apply) FIRST; if refused (e.g. job closed) nothing changes
 │    → candidate status approved → application approved into the job's first stage
 │    → AI scoring runs; AI resume validation runs for direct_apply
 ├─ Reject (candidate level) → needs a disposition reason, see 5.3
 └─ Add to Talent Pool

IN PIPELINE  (a candidate holding an `approved` application)
 ├─ Move stage · Notes · Schedule interview
 ├─ Hire → application hired, candidate status hired, VA user provisioned + invite email
 ├─ Reject (application level) → see 5.3
 ├─ Change job → new application on the target job, old one closed as a move
 └─ Remove from job → Talent Pool (closed as a move, no reason)

HIRED  (status hired; stays hired when assigned to further jobs)
TALENT POOL  (inTalentPool flag — independent of status)
PERMANENTLY INELIGIBLE  (eligibilityStatus flag)
```

### 5.2 Application lifecycle

- `direct_apply` (from approve): created `pending`, then approved straight away when the job has a pipeline.
- `assigned` / `internal_upload` (assign-job, change-job): created `approved` at the first stage (or a chosen `startStageId`); candidate status becomes `approved` unless already `hired`.
- A job without a pipeline (no stages) cannot approve or assign anyone (`APPLICATION_NO_PIPELINE`).
- `(candidateId, jobId)` is unique forever. The one exception: an application closed as a plain **move** (no disposition) is reopened if the candidate is assigned back to that job. Real rejections stay closed.
- Phases: `pending → approved → hired`; `pending | approved → rejected`. Stage moves only for `approved`; hire only from `approved`.

### 5.3 Rejection & disposition

Rejection never deletes anything.

**Application-level reject** (`PATCH /applications/:id/reject`)
- `rejectionReasonId` (an active DispositionReason) is the structured path; plain `reason` text is still accepted. Reasons with `requireInternalNotes` need `internalNotes`.
- The application becomes `rejected`, its stage is kept as `lastStage`, and the reason is always recorded.
- **Final reject** = the candidate has no other pending/approved application. Only then is a destination applied and the disposition payload (`closedAt`, `dispositionReasonId`, `dispositionDestination`, `internalNotes`) saved:
  - `candidate_pool` (default) → added to the Talent Pool.
  - `permanently_ineligible` → banned. A reason in the ineligible category forces this.
- **Non-final reject**: only removes them from that job. Other pipelines are untouched, no destination applied.

**Candidate-level reject** (`PATCH /candidates/:id/reject`) — for In Review candidates only (`status pending`): same reason/notes rules and the same destinations. Refused with 409 if the candidate holds a live application (use the application reject instead). The candidate's `status` stays `pending`; the flags remove them from In Review.

**Moves are not rejections** (`change-job`, `move-to-talent-pool`): the application is closed with `isJobMove`, no disposition, logged as `job_changed`. A Talent Pool move also adds the pool flag (skipped if banned).

**Talent Pool**: `inTalentPool` is independent of status. Assigning or changing a candidate's job takes them out of the pool. A banned candidate is never in the pool.

**Permanently ineligible**
- Cannot be approved, assigned, or moved to another job (403). A re-apply is logged and answered with `blocked: true`.
- Only admins can read them (list filter and `GET /:id`).
- **Restore** (admin, needs a `jobId`): clears the ban, sets `appliedJobId`, status `pending` (back to In Review), removes pool flags. Refused if the candidate already has an application for that job.
- **Eligibility** can also be set directly by an admin.

**Permanent delete** — only from the Ineligible list, only by an admin, blocked by `legalHold`. It deletes the candidate's files in Cloudinary and every related record: applications, interviews, interview scorecards, assignments, work entries, EODs, EOD reminders, performance reviews, emails and activity logs (a final `deleted` log entry is kept).

### 5.4 Job lifecycle

| From | Allowed to |
| ---- | ---------- |
| `draft` | `open` |
| `open` | `on_hold`, `closed` |
| `on_hold` | `open`, `closed` |
| `closed` | — (terminal) |

- New jobs are always created as `draft`.
- Public apply and `change-job` targets require an `open` job (`assign-job` does not check the status).
- Delete is blocked while pending/approved applications exist.
- Description HTML is sanitised on create and update.
- AI helpers (no DB write): `POST /jobs/generate-draft` (brief → draft fields) and `POST /jobs/standardize` (tidy requirement/skill lists).

### 5.5 Interview flow

- **Schedule**: `POST /applications/:id/interviews` (or `POST /interviews`). Duration is fixed at 60 minutes and the timezone is always the company timezone. If no interviewer is given, the organiser is the interviewer.
- **Types**: `zoom` creates a meeting through the Zoom API; `google_meet` uses a manually pasted link; `phone_call` stores a number; `in_person` stores an address.
- **Conflicts**: a slot overlapping a `scheduled` interview of any chosen interviewer is refused (409 `INTERVIEW_CONFLICT`).
- **Update**: reschedule, change interviewers or details; status may go `scheduled → completed | no_show`. Completed or cancelled interviews are read-only. Rescheduling updates the Zoom meeting.
- **Cancel**: separate endpoint (`DELETE`), status `cancelled`, Zoom meeting deleted.
- **Emails**: candidate and interviewers are emailed on schedule, update and cancel (fire-and-forget).
- **Feedback**: only an assigned interviewer, once per interviewer (409 on a second try); rating 1–5, notes, recommendation.
- Interview scorecards (3.6) are a separate, richer form.

### 5.6 Email flow

```
OUTBOUND  compose → store (pending) → Resend → sent | failed (+ failureReason)
          failed emails can be resent. From address is always COMPANY_EMAIL,
          display name comes from Settings; Reply-To is the same mailbox.
          {{variables}} are substituted into subject and body.

STATUS    Resend webhooks update sent / delivered / delayed / bounced / complained,
          and opened / clicked counters.

INBOUND   POST /webhooks/resend  (email.received)
          → signature checked with Svix when RESEND_WEBHOOK_SECRET is set
            (timestamp older than 5 minutes is rejected)
          → ignored if already stored (Resend retries), or not addressed to COMPANY_EMAIL
          → full content + attachments fetched from the Resend API
          → matched to a candidate by sender email, else via the replied-to thread
          → thread = original email's thread, else the message id
          → unmatched senders are stored without a candidate for manual review
```

`POST /webhooks/resend/test` exists only outside production.

### 5.7 Assignment flow (CRM)

```
Create (admin or account manager)
 ├─ candidate and client must exist
 ├─ account manager can only create for themselves
 ├─ the client's CRM user is provisioned if needed (invite to the primary contact)
 ├─ survey reminders created for the account manager:
 │    3_day (+3 d), 1_week (+7 d), 30_day (+30 d), monthly (+60 d) after startDate
 └─ activity log + realtime event

Lifecycle: active ⇄ on_hold → ended      (ended: read-only; DELETE ends it and sets endDate)
```

The VA's own login is created at hire time (§5.1), not here. An admin can also provision a VA or client manually (`/shared/users/provision-va`, `/provision-client`); provisioning an existing inactive or non-CRM user re-activates them and issues a new invite.

### 5.8 CRM: who does what

| Actor | Actions |
| ----- | ------- |
| **VA** | Submit/edit/delete own EODs and work entries; read own assignments, reviews and VA profile |
| **Client** | Read their own assignments, VAs, EODs and work activity |
| **Account manager** | Own assignments; read work entries/EODs; reminders; scorecards; performance reviews; reports; VA profile; client CRM profile |
| **Admin** | All of the above for everyone, plus internal client/VA note threads |
| **Cron** | EOD reminders, survey reminders |

EOD rules: the business day is the **company** day (Settings timezone), not the device clock; `date` may be omitted; creation is refused on an ended assignment; hours come from the shift times.

### 5.9 Pipeline rules

- A job needs a pipeline. At creation the chosen template (or the default one) is copied into the job. No template and no default → `PIPELINE_REQUIRED`.
- Candidates enter the **first stage** (lowest `order`) on approval or assignment, unless a start stage is given.
- **Changing a job's pipeline** (`PATCH /jobs/:id/pipeline`) remaps only applications in phase **`approved`**: each keeps its stage by name (case-insensitive), or follows an optional `stageMapping`, or goes to the first stage if there is no match. `pending`, `rejected` and `hired` applications are not touched. (Showing a confirmation summary is the UI's job.)
- Template rules: unique stage orders; only one default template; the default must be active; a template used by a job cannot be deleted.

---

## 6. AI

| Task | Trigger | Stored on | Skips if |
| ---- | ------- | --------- | -------- |
| **Resume parsing** | candidate created with resume text, apply, or application created and parsedData missing/empty | `Candidate.parsedData`, `yearsOfExperience` | already has meaningful data; `ai.resumeParsing` off |
| **Candidacy validation** (TYPE 1: real or fake) | public apply | `Candidate.aiValidation` | already validated; `ai.resumeValidation` off |
| **Resume validation** (resume vs job) | application created with `direct_apply` | `Application.aiValidation` | already validated; `ai.resumeValidation` off |
| **Candidate scoring** (TYPE 2: fit for this job) | approve, assign-job, change-job | `Application.aiScore` + copy on `Candidate.aiScore` | already scored; `ai.candidateScoring` off; no parsedData |
| Job draft / standardize | user action | not stored | — |
| Performance review generate / regenerate | user action | `PerformanceReview` | — |

- Providers: Claude (`claude-sonnet-4-20250514`) or OpenAI (`gpt-4o`), chosen in Settings. 30 s timeout; background jobs retry up to 3 times with backoff. JSON is extracted from the reply.
- Background jobs run fire-and-forget and are **coalesced per entity** in the process, so one action cannot start the same job twice. Failures are logged only.
- Resume text is untrusted input to the prompts.

---

## 7. CRON JOBS

Both run on a one-minute tick and compare the **company-timezone** wall clock, so a timezone change in Settings applies without a restart. They run once per local day, are **not replayed** after downtime, and take a database lock (`cronlocks`) so only one instance runs.

| Job | Time (company) | Action |
| --- | -------------- | ------ |
| **EOD compliance** | 17:00 | For every `active` assignment without an EOD for today's `dateKey`: email the VA (candidate email), write an `EodReminder` (`sent`/`failed`), log it |
| **Survey dispatcher** | 09:00 | Every `pending` survey reminder due by the end of today: email the assigned account manager, set `sent`, log it |

---

## 8. SOCKET.IO

Auth: the access token is checked once at connect. Users need the matching `appAccess` (or admin).

| Namespace | Rooms joined | Notes |
| --------- | ------------ | ----- |
| `/ats` | `applications`, `candidates`, `jobs`, `clients`, `tags`, `pipeline-templates`, `email-templates`, `user:<id>` | `join:job` / `leave:job` add `job:<id>` |
| `/crm` | `user:<id>`; `assignments` **only for admin and account_manager** | VAs and clients get no data feed |

Events: `<resource>:created|updated|deleted` for candidate, job, application, interview, client, tag, pipeline_template, email_template, email; plus `candidate:statusChanged`, `application:phaseChanged`, `job:statusChanged`; CRM: `assignment:*`, `workEntry:*`, `eod:submitted|updated|deleted`, `performanceReview:*`. The CRM UI does not currently use sockets.

---

## 9. RELATIONSHIPS

```
User ──createdBy──► Candidate ──candidateId──► Application ◄──jobId── Job ◄──clientId── Client
                        │  ▲                        │                    │
                        │  └─ User.candidateRef     └─ Interview         └─ pipeline (copied from PipelineTemplate)
                        ▼
              InterviewScorecard · Email(context) · VaProfile

Assignment ──candidateId──► Candidate        Assignment ──clientId──► Client
   │  accountManagerId ──► User              User.clientRef ──► Client
   ├─► WorkEntry · EodSubmission · EodReminder · Scorecard (weekly)
   └─► SurveyReminder (relatedType: assignment)

PerformanceReview ──► Candidate, Client, Job
Application.dispositionReasonId / Candidate.permanentlyIneligibleReason ──► DispositionReason
Tag ◄── Candidate, Job, Client
```

---

## 10. EXTERNAL SERVICES

| Service | Use |
| ------- | --- |
| Resend | Outbound email; inbound mail and delivery events via webhook |
| Svix | Webhook signature verification |
| Cloudinary | Resumes and portfolio files (`raw`), avatars and logos (`image`); deleted with the candidate |
| Zoom API | Create / update / delete interview meetings (token cached) |
| Claude / OpenAI | All AI tasks |
| Sentry | Error monitoring (5xx only) |
| node-cron | Scheduled jobs |
| Heroku / Vercel | Backend / frontends hosting |

---

## 11. KEY BUSINESS RULES

1. **Rejection never deletes.** It closes the application with a reason; the destination (Talent Pool or Permanently Ineligible) is applied only on the candidate's last live application.
2. An application exists only after approval or assignment — a public apply creates just a candidate.
3. `(candidateId, jobId)` is unique; only plain moves can be reopened.
4. Talent Pool and eligibility are flags, independent of `status`.
5. Permanent delete: Ineligible list only, admin only, blocked by legal hold, cascades to all related records.
6. A hired candidate stays hired when assigned to more jobs.
7. Tags are shared by candidates, jobs and clients.
8. Settings is a singleton; AI jobs are idempotent.
9. Role → `appAccess` and default permissions are derived; changing roles rebuilds them.
10. `DELETE /shared/users/:id` is a **hard delete** (despite the name). Soft switch-off is `isActive = false` (`PATCH`) or `revoke-crm`; both clear refresh tokens.
11. Only admins can grant or alter admin accounts.
12. Interview feedback: once per assigned interviewer. Interviews never overlap for the same interviewer.
13. The company day (Settings timezone) defines EOD days, the compliance cron and the survey cron.
14. One EOD per assignment per company day; hours are computed server-side.
15. Soft-deleted work entries never count in reports, dashboards or scorecards.
16. A job needs a pipeline; changing it remaps only approved applications.
17. Rate limits (production only): 100 requests / 15 min on `/api`, 10 / 15 min on `/api/v1/auth`.
18. Forgot-password never reveals whether an email exists.
19. Public job data is limited to open jobs and public fields; query values are validated.
20. Stored links must be http(s).

---

## 12. ACTIVITY LOG

Keyed by `resourceType` + `action`. Entries are written by services, AI jobs and cron; the UI only reads them. Entries without a `description` are rendered from the action name.

**Resource types:** `candidate`, `client`, `job`, `application`, `interview`, `user`, `assignment`, `eod`, `performance_review`, `survey`, `tag`, `work_entry`, `settings`, `scorecards`, `vaProfile`, `client_account`.

| Action(s) | Resource | Source |
| --------- | -------- | ------ |
| `created`, `updated`, `deleted` | candidate, client, job, user, tag, assignment, work_entry (delete: candidate, client, job, tag) | services |
| `status_changed` | candidate, job, assignment | services |
| `talent_pool_added`, `talent_pool_removed` | candidate | candidate service |
| `eligibility_changed`, `legal_hold_toggled`, `ineligible_reapply_blocked`, `disposition` | candidate | candidate/application services |
| `rejected` | candidate (In Review reject) and application | services |
| `ai_score_updated`, `ai_validation_updated`, `parsed_data_updated` | candidate, application | AI jobs |
| `applied`, `approved`, `hired`, `stage_changed`, `notes_updated`, `job_changed` | application | application service |
| `interview_scheduled`, `interview_updated`, `interview_cancelled`, `interview_completed`, `interview_no_show`, `interview_feedback_submitted` | application (related: interview) | interview service |
| interview scorecard created/updated | candidate (related: `interview_scorecard`) | scorecard service |
| `pipeline_changed` | job | job service |
| `contact_added/updated/removed`, `crm_profile_updated`, `note_added/updated/deleted` | client | client service |
| `permissions_updated`, `deactivated`, `provisioned_va`, `provisioned_client`, `revoked_crm` | user | user service |
| `ended` | assignment | assignment service |
| `review_generated`, `review_completed`, `review_deleted` | performance_review | review service |
| `eod_submitted`, `eod_deleted` | eod | EOD service |
| `eod_compliance_checked` | eod | EOD cron |
| `survey_dispatched` | survey | survey cron |
| `scorecard_generated` | scorecards | scorecard service |
| `settings_updated` | settings | settings service |
| `crm_client_account_updated`, `va_profile_updated` | client / vaProfile | CRM services |

---

## 13. AUTH FLOW

```
Login          POST /auth/login { email, password, app? }  (app defaults to 'ats')
               → unknown user / wrong password → generic error; inactive → USER_INACTIVE
               → access JWT (roles, appAccess, permissions, refs) in the response body
               → refresh JWT in an httpOnly cookie: refreshTokenAts or refreshTokenCrm
               (login does not check that the user has access to the requested app;
                routes enforce it)
Refresh        reads that cookie; refused if the user is inactive or the token is not
               the one stored → new access token + user
Logout         clears the token and cookie of the given app (both if none given)
Forgot         always answers success; sends a reset link (1 h) only to an active user.
               The link always points to the ATS reset page.
Reset          token from forgot-password OR invite → new password, all refresh tokens cleared.
               Only an invite token re-activates an account.
Change         current password required → all refresh tokens cleared
Invite         admin creates a user → invite token (24 h) emailed:
               ATS roles → ATS verify-email page; CRM-only roles → CRM accept-invitation page
               verify-email marks the invite accepted; set-password sets the password and activates
```

Access and refresh lifetimes come from `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES`; the cookie lasts 7 days, `sameSite: none` + `secure` in production. The ATS UI keeps the access token in memory only.
