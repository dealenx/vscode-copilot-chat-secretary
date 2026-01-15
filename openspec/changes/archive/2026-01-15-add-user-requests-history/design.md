# Design: Add User Requests History

## Overview

Move user request parsing logic from extension to `copilot-chat-analyzer` library.

## Interface Design

```typescript
interface UserRequest {
  id: string; // Request ID from variableData.requestId or generated
  message: string; // User's message text
  timestamp?: number; // Optional timestamp
  index: number; // Zero-based index in requests array
}
```

## API Design

```typescript
class CopilotChatAnalyzer {
  // Existing methods...

  /**
   * Get all user requests from chat data
   * @param chatData - Copilot chat export data
   * @returns Array of user requests with message text
   */
  getUserRequests(chatData: CopilotChatData): UserRequest[];
}
```

## Implementation Notes

1. **Request Structure**: Each request in `chatData.requests` has:

   - `message: string` — User's message text
   - `variableData?.requestId: string` — Unique request ID
   - `timestamp?: number` — Optional timestamp

2. **Filtering**: Only include requests where `message` is a non-empty string

3. **Index**: Preserve original array index for ordering display

## Data Flow

```
Chat Export JSON
       ↓
CopilotChatAnalyzer.getUserRequests()
       ↓
UserRequest[]
       ↓
RequestsTreeProvider → Tree View
```
