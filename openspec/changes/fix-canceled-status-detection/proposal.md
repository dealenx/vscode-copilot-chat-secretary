# Fix Canceled Status Detection

## Problem

When a user cancels a Copilot chat (by stopping the response generation), the extension incorrectly displays the status as "failed" (⚠️) instead of "canceled" (❌). This is confusing because:

1. User-initiated cancellation is a normal action, not an error
2. The visual indicator (⚠️ warning) suggests something went wrong
3. Users cannot distinguish between actual failures and their own cancellations

**Root Cause:**
The `copilot-chat-analyzer` library checks for the existence of `errorDetails` object to mark a dialog as `FAILED`, but doesn't examine the `errorDetails.code` field to distinguish between:

- `errorDetails.code: "canceled"` - user stopped the chat
- `errorDetails.code: "failed"` - actual API or system failure

## Evidence

Comparing two chat exports:

**User-Canceled Chat** (`parse-export-canceled-chat/chat.json`):

```json
"result": {
  "errorDetails": {
    "code": "canceled",
    "message": "Canceled",
    ...
  }
}
```

**Failed Chat** (`parse-export-chat-with-error/chat.json`):

```json
"result": {
  "errorDetails": {
    "code": "failed",
    "message": "Sorry, your request failed. Please try again.",
    ...
  }
}
```

## Solution

Enhance the status detection logic in `copilot-chat-analyzer` to:

1. Check `errorDetails.code` field when `errorDetails` exists
2. Return `CANCELED` status when `code === "canceled"`
3. Return `FAILED` status when `code === "failed"` or any other error code
4. Maintain backward compatibility with the existing `isCanceled` field check

## Scope

- **Package:** `copilot-chat-analyzer` (library)
- **Impact:** All consumers of the library (VS Code extension)
- **Breaking Change:** No - this is a bug fix that corrects unintended behavior

## Outcome

After this change:

- User-canceled chats show ❌ "canceled" status
- Failed chats show ⚠️ "failed" status
- Status accurately reflects what actually happened
- Users can distinguish between their actions and system errors
