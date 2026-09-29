# Devin Orchestrator — API Research & Reference

> **Purpose:** Research document for building an external orchestrator that replaces Devin's built-in batch session mode. The orchestrator manages individual Devin sessions via the API, with Linear as the task management layer. Implementation details are intentionally open — this captures the API surface, patterns, and considerations needed to build it in any system.

---

## Concept

Devin's Advanced Mode includes a **batch session mode** where Devin itself orchestrates child sessions. The idea: replace that with an external orchestrator (any LLM-based agent or automation system) that manages Devin sessions via the REST API.

**Why externalize orchestration:**
- Stronger reasoning for planning, dependency analysis, and context forwarding
- Interactive course-correction with a human in the loop
- Direct integration with Linear (or any project management tool) for real-time status tracking
- The orchestrator can leverage tools/integrations the external system already has
- Context forwarding between sessions — the #1 value-add — is done by the orchestrator with full visibility, not by Devin guessing

**The pattern:** The orchestrator is the *brain* (reasoning, decisions, approvals). The Devin API is the *hands* (executing code tasks). Linear is the *contract* between them.

---

## Devin API v3 — Full Surface

### Authentication

| Key type | Format | Use case |
|----------|--------|----------|
| Service user key | `cog_...` | Programmatic access (recommended) |
| Personal API key | `apk_user_...` | Individual user access |

All requests: `Authorization: Bearer <key>`

Base URL: `https://api.devin.ai/v3`

### Session Lifecycle

```
new → working → blocked → working → ... → exit (success)
                                         → error
                                         → suspended
```

Terminal statuses: `exit`, `error`, `suspended`

### Endpoints — Session Management

#### Create Session
```
POST /v3/{scope}/sessions
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | string | **Required.** The task prompt |
| `title` | string | Display title for the session |
| `playbook_id` | string | Playbook to attach to the session |
| `repos` | string[] | GitHub repos the session should access |
| `tags` | string[] | Tags for filtering/grouping |
| `structured_output_schema` | object | JSON schema for structured output (session returns data matching this) |
| `secret_ids` | string[] | Secret IDs to make available |
| `session_secrets` | object[] | Inline secrets: `[{key, value, sensitive}]` |
| `knowledge_ids` | string[] | Knowledge note IDs to attach |
| `max_acu_limit` | number | ACU cap for this session |
| `attachment_urls` | string[] | URLs to attach as context |
| `create_as_user_id` | string | Impersonate a user (requires `ImpersonateOrgSessions` role) |
| `advanced_mode` | enum | `analyze`, `create`, `improve`, `batch`, `manage` |
| `child_playbook_id` | string | Playbook for child sessions (advanced mode) |
| `session_links` | string[] | Links to other sessions (advanced mode) |
| `bypass_approval` | boolean | Skip approval step (batch mode) |

Response includes: `session_id`, `url`, `status`, `tags`, `created_at`

#### Get Session
```
GET /v3/{scope}/sessions/{session_id}
```

Response includes:

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | string | Unique ID |
| `status` | string | Current status |
| `status_detail` | enum | `working`, `blocked`, `finished`, `error`, `suspended`, `exit` |
| `pull_requests` | object[] | `[{pr_url, pr_state}]` |
| `structured_output` | object | Structured data matching the schema provided at creation |
| `acus_consumed` | number | ACUs used so far |
| `child_session_ids` | string[] | Child sessions (if advanced mode) |
| `parent_session_id` | string | Parent session (if this is a child) |
| `is_advanced` | boolean | Whether this is an advanced session |
| `playbook_id` | string | Attached playbook |
| `url` | string | Devin UI URL for the session |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update |

#### List Sessions
```
GET /v3/{scope}/sessions
```
Cursor-based pagination (`first`, `after` params). Enterprise supports `org_ids` filter for cross-org listing.

#### Send Message
```
POST /v3/{scope}/sessions/{session_id}/messages
```
Body: `{ "message": "string" }` — Session auto-resumes if suspended.

#### Archive Session
```
POST /v3/{scope}/sessions/{session_id}/archive
```

#### Terminate Session
```
DELETE /v3/{scope}/sessions/{session_id}
```
Optional `archive` query param to archive on termination.

### Endpoints — Knowledge & Configuration

#### Knowledge Notes
```
POST /v3/organizations/{org_id}/knowledge/notes
GET  /v3/organizations/{org_id}/knowledge/notes
```
Body: `{ "name": "string", "trigger_description": "string", "body": "string" }`

Notes are automatically surfaced to sessions when the trigger description matches. Useful for embedding repo conventions, patterns, and standards.

#### Playbooks
```
GET /v3/organizations/{org_id}/playbooks
```
Playbooks are pre-defined instruction sets that sessions follow.

#### Secrets
```
GET /v3/organizations/{org_id}/secrets
```
Secrets can be referenced by ID when creating sessions.

#### Scheduled Sessions
```
POST   /v3/organizations/{org_id}/schedules
GET    /v3/organizations/{org_id}/schedules
GET    /v3/organizations/{org_id}/schedules/{schedule_id}
PATCH  /v3/organizations/{org_id}/schedules/{schedule_id}
DELETE /v3/organizations/{org_id}/schedules/{schedule_id}
```

---

## Enterprise vs Teams API

The `{scope}` in endpoints above resolves differently depending on account tier.

### Scope Patterns

| Tier | Scope | Behavior |
|------|-------|----------|
| Enterprise | `/v3/enterprise/...` | Can specify `org_id` per request; cross-org operations |
| Teams | `/v3/organizations/...` or `/v3/organizations/{org_id}/...` | Single org, inferred from key or specified in path |

### Enterprise-Only Endpoints

| Category | Endpoint | What it provides |
|----------|----------|-----------------|
| **Consumption** | `GET /v3/enterprise/consumption/daily` | ACU spend per day (Unix timestamp range filter) |
| **Audit logs** | `GET /v3/enterprise/audit-logs` | Actions with `data`, `service_user_name`, `user_email`, timestamps |
| **Metrics** | `GET /v3/enterprise/metrics/*` | DAU, WAU, MAU, PRs created, sessions, searches, active users, usage |
| **Guardrails** | `GET /v3beta1/enterprise/guardrail-violations` | Violation type, reasoning, confidence, action taken, triggering message |
| **Cross-org sessions** | `GET /v3/enterprise/sessions` | `org_ids` filter for listing across orgs |
| **Multi-org management** | `GET /v3/enterprise/organizations` | List all orgs in the enterprise |
| **RBAC** | Various | Role management, permission assignment |
| **IP access lists** | `GET/PUT/DELETE /v3/enterprise/ip-access-list` | Enterprise IP allowlists (CIDR) |
| **Hypervisors** | `GET /v3/enterprise/hypervisors` | `utilization_percentage` for capacity planning |
| **Org group limits** | `GET/PUT /v3/enterprise/org-group-limits` | ACU caps per org group per billing cycle |

### What Teams Accounts Lose & Workarounds

| Missing Feature | Orchestration Impact | Workaround |
|----------------|---------------------|------------|
| Consumption API | Can't query ACU spend per wave/day natively | Track `acus_consumed` from each session's GET response; sum locally |
| Audit logs | No centralized action log | Use Linear comments + session URLs as the audit trail |
| Metrics API | No pre-aggregated metrics | Compute session counts, PR counts, etc. from session list responses |
| Guardrail violations | No visibility into policy triggers | Review session outputs manually or via structured output |
| Cross-org listing | Can't aggregate sessions across orgs | Single-org only (acceptable for most orchestration use cases) |
| RBAC | Simpler permission model | Service user key grants full org access |

**Key takeaway:** The core orchestration loop (create → poll → message → review → next wave) is identical on both tiers. Enterprise adds an *observability layer* and multi-org routing.

---

## Orchestration Pattern

This is the general pattern, independent of implementation technology.

### 1. Analyze
- Fetch Linear milestone → retrieve all issues with relevant statuses
- Build dependency graph from "blocked by" / "blocks" relations
- Detect circular dependencies
- Group into execution waves (Wave N = issues whose blockers are all in waves < N)
- Validate issue quality (goal, repo URL, outputs, validation criteria, sizing)
- Check infrastructure prerequisites

### 2. Execute (per wave)
- Craft session prompts using the session prompt template (includes context digest from prior waves)
- Create Devin sessions via API for all issues in the wave
- Tag sessions for grouping/filtering (e.g., `milestone:X`, `wave:N`)
- Use `structured_output_schema` to get machine-readable results back

### 3. Monitor
- Poll session statuses via GET
- Handle `blocked` status (may need a message to unblock)
- Handle `error` / `suspended` (flag for human review)
- Track ACU consumption per session

### 4. Review & Transition
- When all sessions in a wave reach terminal status:
  - Review outputs against validation criteria
  - Check for downstream impact (scope changes, new risks, API changes)
  - Update Linear issue statuses
  - Post Linear project update (chronological log)
  - Update Linear project description (static source of truth)
  - Prepare context digest for next wave
- Get human approval before launching next wave

### 5. Context Forwarding (the #1 value-add)
Between waves, the orchestrator embeds a condensed digest into the next wave's prompts:
- What files were created/modified
- What patterns/conventions were established
- What schemas/APIs are now available
- What decisions were made during implementation
- Any cross-cutting concerns discovered during review

This is what makes external orchestration better than Devin's built-in batch mode — the orchestrator has full visibility and can reason about what context matters.

---

## Session Prompt Template

Reference template for crafting Devin session prompts from the orchestrator:

```
Execute Linear issue: [Issue Title]

**Goal:** [Issue goal from Linear]

**Repo:** [Repo URL from issue]

**Branch strategy:** Create branch `[feature-branch]/[issue-slug]` from `[feature-branch]`.
PR targets `[feature-branch]` (NOT `master`/`main`).

**Context:**
- This is part of milestone: [Milestone Name]
- Wave [N] of [Total Waves] in the execution plan
- Dependencies completed: [List of completed blocker issues]
- Summary of completed work:
  [3-5 line digest: what's already merged, key files/schemas/patterns, decisions made]

**Outputs:**
[List from issue]

**Validation Criteria:**
[List from issue]

**Shared File Warning (if applicable):**
[If parallel sessions may touch the same files, note which files and merge order]

**Local Validation (BEFORE creating a PR):**
- Run all existing tests and verify they pass
- Write and run new tests for the functionality being implemented
- Run linting and type checks
- Run the build
- Only create the PR after all local validation passes

**When starting:**
1. Set Linear issue status to "In Progress"
2. Add a comment to the issue with a link to this Devin session

**When complete:**
1. Create a PR with changes
2. Set Linear issue status to "In Review"
```

---

## Structured Output Opportunity

The `structured_output_schema` param on session creation is powerful for orchestration. Example schema for implementation sessions:

```json
{
  "type": "object",
  "properties": {
    "files_created": { "type": "array", "items": { "type": "string" } },
    "files_modified": { "type": "array", "items": { "type": "string" } },
    "patterns_established": { "type": "array", "items": { "type": "string" } },
    "apis_created": { "type": "array", "items": { "type": "string" } },
    "decisions_made": { "type": "array", "items": { "type": "string" } },
    "tests_added": { "type": "array", "items": { "type": "string" } },
    "issues_found": { "type": "array", "items": { "type": "string" } },
    "pr_url": { "type": "string" },
    "validation_passed": { "type": "boolean" }
  }
}
```

This structured output becomes the raw material for context forwarding — the orchestrator can auto-generate context digests from it rather than parsing free-text.

---

## API Configuration Shape (Reference)

Minimum config an implementation would need:

```
devin_api_key       — cog_ or apk_user_ prefixed key
devin_api_tier      — "enterprise" or "teams" (determines endpoint scope)
devin_org_id        — required for teams; optional for enterprise (can route per-request)
linear_api_key      — for project management integration
playbook_path       — path to the orchestrator playbook (optional, could be inline)
```

---

## Open Design Considerations

These are intentionally unresolved — to be decided based on the target system:

- **Delivery mechanism** — MCP server, SDK/library, CLI tool, or direct API calls from an agent
- **State management** — stateless (caller manages), in-memory per run, or persisted (file/DB)
- **Linear integration** — embedded in orchestrator, separate service, or leveraging an existing integration
- **Playbook injection** — hardcoded, file-based, or passed per invocation
- **Context forwarding** — auto-generated from structured output, manually crafted by orchestrator, or hybrid
- **Polling strategy** — interval-based, webhook-based (if available), or event-driven
- **Concurrency limits** — how many parallel sessions per wave (Devin may have org-level limits)
- **Error recovery** — retry logic, human escalation paths, partial wave completion handling
- **Transport** — stdio, SSE, HTTP, depends on consumer capabilities

---

## Related Resources

- [Devin API Overview](https://docs.devin.ai/api-reference/overview)
- [v3 Usage Examples](https://docs.devin.ai/api-reference/v3/usage-examples)
- [API Release Notes](https://docs.devin.ai/api-reference/release-notes)
- [Create Session (Enterprise)](https://docs.devinenterprise.com/api-reference/v3/sessions/post-organizations-sessions)
- [Session Status Reference](https://docs.devin.ai/api-reference/sessions/retrieve-details-about-an-existing-session)
