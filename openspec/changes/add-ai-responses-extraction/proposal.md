# Proposal: Add AI Responses Extraction

## Summary

Add functionality to extract and display AI agent responses from chat exports, creating a complete conversation history with both user requests and AI responses.

## Motivation

Currently, the system only extracts user requests (`getUserRequests`), leaving the conversation history incomplete. Users see only their own messages without corresponding AI responses.

**Problems:**

1. Incomplete conversation history - only user requests are visible
2. Cannot review what AI responded to each request
3. No way to analyze AI response patterns or content

**Goals:**

1. Extract AI responses paired with user requests
2. Display full conversation (request + response) in UI
3. Support multiple response formats (text, tool calls, code blocks)

## Scope

### In Scope

1. **copilot-chat-analyzer library**:

   - Add `AIResponse` interface for response metadata
   - Add `ConversationTurn` interface combining request + response
   - Add `getAIResponses(chatData): AIResponse[]` method
   - Add `getConversationHistory(chatData): ConversationTurn[]` method
   - Extract response text from `response[].value` and `toolCallRounds[].response`

2. **VS Code extension**:
   - Update tree view to show AI responses under each request
   - Add expandable conversation turns with request → response structure
   - Add preview of AI response text in tooltips

### Out of Scope

- Rendering markdown/code blocks in tree view (plain text only)
- Editing or modifying AI responses
- Streaming response support (only completed responses)

## Technical Approach

### Response Location in Chat Export

Based on analysis of chat export JSON structure:

```json
{
  "requests": [
    {
      "requestId": "request_xxx",
      "message": { "text": "user message" },
      "response": [
        { "value": "AI response text", "kind": "text" }
      ],
      "result": {
        "metadata": {
          "toolCallRounds": [
            { "response": "AI response text", "toolCalls": [...] }
          ]
        }
      }
    }
  ]
}
```

### Proposed Interfaces

```typescript
interface AIResponse {
  requestId: string;
  responseId?: string;
  message: string; // Aggregated response text
  timestamp?: number;
  index: number;
  hasToolCalls: boolean;
  toolCallCount: number;
}

interface ConversationTurn {
  index: number;
  request: UserRequest;
  response: AIResponse | null;
}
```

### Response Text Extraction Logic

1. Check `response[]` array for text items (`{ value: string }`)
2. Check `result.metadata.toolCallRounds[]` for response text
3. Aggregate multiple response parts into single message
4. Handle missing/incomplete responses gracefully

## Impact Analysis

### Breaking Changes

None - new methods are additive.

### Dependencies

- copilot-chat-analyzer must be updated before extension
- Extension depends on new analyzer interfaces

### Testing Requirements

- Unit tests for response extraction with various chat formats
- Tests for incomplete/empty responses
- Tests for multi-turn conversations

## Alternatives Considered

1. **Store raw response array** - rejected due to complex structure
2. **Only show first response** - rejected, loses information
3. **Parse markdown in analyzer** - deferred, UI concern

## Success Criteria

1. `getAIResponses()` returns array of AI responses
2. `getConversationHistory()` returns paired request/response turns
3. UI shows expandable conversation with both sides
4. Empty responses handled gracefully
