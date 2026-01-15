# Spec: Dialog Status Detection

## Description

Fix the status detection logic to correctly distinguish between user-canceled and failed dialogs by checking the `errorDetails.code` field.

## MODIFIED Requirements

### Requirement: Canceled Status Detection via errorDetails

The `copilot-chat-analyzer` library MUST detect canceled dialogs from `errorDetails.code === "canceled"` in addition to the legacy `isCanceled` field.

#### Scenario: Detect canceled status from errorDetails.code

**Given** a chat export JSON where the last request has `result.errorDetails.code === "canceled"`
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"canceled"` (not `"failed"`)

#### Scenario: Backward compatibility with isCanceled field

**Given** a chat export JSON where the last request has `isCanceled === true`
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"canceled"`

#### Scenario: errorDetails.code takes priority over generic errorDetails check

**Given** a chat export JSON where the last request has `errorDetails.code === "canceled"`
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"canceled"` even though `errorDetails` exists

---

### Requirement: Failed Status Detection Refinement

The `copilot-chat-analyzer` library MUST only return failed status for actual failures, not for user cancellations.

#### Scenario: Detect failed status from errorDetails.code

**Given** a chat export JSON where the last request has `result.errorDetails.code === "failed"`
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"failed"`

#### Scenario: Failed status for unknown error codes

**Given** a chat export JSON where the last request has `result.errorDetails.code` with any value except "canceled"
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"failed"`

#### Scenario: Failed status when errorDetails exists without code

**Given** a chat export JSON where the last request has `result.errorDetails` without a `code` field
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"failed"` for backward compatibility

---

### Requirement: Status Detection Priority Order

The `copilot-chat-analyzer` library MUST apply status detection in the correct priority order.

#### Scenario: Priority order for status detection

**Given** any chat export JSON
**When** `getDialogStatus(chatData)` is called
**Then** it checks status in this order:

1. `isCanceled === true` → `"canceled"`
2. `errorDetails.code === "canceled"` → `"canceled"`
3. `errorDetails` exists → `"failed"`
4. `followups.length === 0` → `"completed"`
5. No `followups` property → `"in_progress"`
6. Default → `"in_progress"`

#### Scenario: Canceled via errorDetails overrides generic error detection

**Given** a chat export JSON where the last request has both:

- `errorDetails.code === "canceled"`
- `errorDetails.message` with error text
  **When** `getDialogStatus(chatData)` is called
  **Then** it returns `"canceled"` (not `"failed"`)

---

## Notes

This change fixes a bug where user-canceled chats were incorrectly marked as "failed" because the analyzer only checked for `errorDetails` existence without examining the `code` field. The fix maintains backward compatibility with older chat exports that use the `isCanceled` boolean field.
