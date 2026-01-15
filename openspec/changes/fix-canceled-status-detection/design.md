# Design: Fix Canceled Status Detection

## Context

The VS Code Copilot Chat Secretary extension monitors Copilot chat sessions and displays their status in a tree view. The status detection logic is implemented in the `copilot-chat-analyzer` library, which parses exported chat JSON data.

## Current Behavior

```typescript
// Current logic in getDialogStatus()
if (lastRequest.isCanceled === true) {
  return DialogStatus.CANCELED;
}

if (lastRequest?.result?.errorDetails) {
  return DialogStatus.FAILED; // ❌ Problem: doesn't check errorDetails.code
}
```

This causes:

- Any `errorDetails` → `FAILED` status
- User cancellations have `errorDetails.code: "canceled"` → incorrectly marked as `FAILED`

## VS Code Chat Export Data Structure

When a user cancels a chat, VS Code exports:

```json
{
  "requests": [
    {
      "result": {
        "errorDetails": {
          "code": "canceled", // ← Key field to check
          "message": "Canceled",
          "responseIsIncomplete": true
        }
      }
    }
  ]
}
```

When a chat fails due to error:

```json
{
  "requests": [
    {
      "result": {
        "errorDetails": {
          "code": "failed", // ← Different code
          "message": "Sorry, your request failed...",
          "responseIsIncomplete": true
        }
      }
    }
  ]
}
```

**Note:** The `isCanceled` field (boolean) exists in older chat exports but not in newer ones. We need to support both formats.

## Proposed Solution

### Status Detection Priority

```typescript
// Proposed logic order:
1. Check isCanceled field (backward compatibility)
   if (lastRequest.isCanceled === true) → CANCELED

2. Check errorDetails.code for "canceled"
   if (errorDetails?.code === "canceled") → CANCELED

3. Check errorDetails existence for other errors
   if (errorDetails) → FAILED

4. Check followups for completion
   if (followups.length === 0) → COMPLETED

5. Default to IN_PROGRESS
```

### Implementation

```typescript
getDialogStatus(chatData: CopilotChatData): DialogStatusType {
  if (!this.hasRequests(chatData)) {
    return DialogStatus.PENDING;
  }

  const lastRequest = this.getLastRequest(chatData);
  if (!lastRequest) {
    return DialogStatus.PENDING;
  }

  // Priority 1: Check isCanceled field (backward compatibility)
  if (lastRequest.isCanceled === true) {
    return DialogStatus.CANCELED;
  }

  const errorDetails = lastRequest?.result?.errorDetails;

  // Priority 2: Check errorDetails.code for "canceled"
  if (errorDetails?.code === "canceled") {
    return DialogStatus.CANCELED;
  }

  // Priority 3: Other errorDetails mean failure
  if (errorDetails) {
    return DialogStatus.FAILED;
  }

  // Priority 4: Check completion via followups
  if ("followups" in lastRequest && Array.isArray(lastRequest.followups)) {
    if (lastRequest.followups.length === 0) {
      return DialogStatus.COMPLETED;
    }
  }

  // Priority 5: No followups property means in progress
  if (!("followups" in lastRequest)) {
    return DialogStatus.IN_PROGRESS;
  }

  return DialogStatus.IN_PROGRESS;
}
```

## Backward Compatibility

✅ **Maintains compatibility** with:

- Old exports using `isCanceled: true` field
- New exports using `errorDetails.code: "canceled"`
- Existing failed status detection
- All current test cases

## Impact Analysis

### Files to Modify

- `copilot-chat-analyzer/src/index.ts` - Update `getDialogStatus()` method
- `copilot-chat-analyzer/src/__tests__/CopilotChatAnalyzer.test.ts` - Add/update tests

### No Changes Needed

- Extension code (uses library as-is)
- Tree provider (receives correct status from analyzer)
- UI/Icons (already has correct mappings for CANCELED vs FAILED)

## Testing Strategy

### Unit Tests

1. Existing test with `isCanceled: true` → should still pass
2. New test with `errorDetails.code: "canceled"` → CANCELED
3. Existing test with `errorDetails` → update to use `code: "failed"`
4. Priority test: both `isCanceled` and `errorDetails` → CANCELED

### Integration Tests

1. Manual: Cancel a running chat → verify ❌ "canceled" appears
2. Manual: Trigger API error → verify ⚠️ "failed" appears
3. Use example files:
   - `parse-export-canceled-chat/chat.json` → CANCELED
   - `parse-export-chat-with-error/chat.json` → FAILED

## Alternative Approaches Considered

### ❌ Option A: Only check errorDetails.code

**Rejected:** Breaks backward compatibility with old exports using `isCanceled` field

### ❌ Option B: Remove errorDetails.code check, rely only on isCanceled

**Rejected:** Doesn't work with newer VS Code chat exports that don't set `isCanceled` field

### ✅ Option C: Check both fields with proper priority (Selected)

**Reason:** Supports both old and new export formats, minimal code change, no breaking changes

## Risks

**Low Risk:**

- Small, localized change
- Covered by unit tests
- No API changes
- Backward compatible

## Open Questions

None - the solution is straightforward based on actual chat export data.
