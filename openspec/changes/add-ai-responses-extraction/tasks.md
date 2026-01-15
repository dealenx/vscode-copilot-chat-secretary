# Tasks: Add AI Responses Extraction

## Phase 1: copilot-chat-analyzer Library

### 1.1 Add AIResponse Interface

- [ ] Add `AIResponse` interface to `src/index.ts`
- [ ] Add `ConversationTurn` interface to `src/index.ts`
- [ ] Export new interfaces

### 1.2 Implement getAIResponses Method

- [ ] Add `getAIResponses(chatData): AIResponse[]` method
- [ ] Extract response text from `response[].value`
- [ ] Extract response text from `toolCallRounds[].response`
- [ ] Aggregate multiple response parts
- [ ] Count tool calls per response

### 1.3 Implement getConversationHistory Method

- [ ] Add `getConversationHistory(chatData): ConversationTurn[]` method
- [ ] Pair user requests with AI responses
- [ ] Handle missing/incomplete responses (return null)
- [ ] Maintain correct ordering by index

### 1.4 Unit Tests

- [ ] Test basic response extraction
- [ ] Test multi-part response aggregation
- [ ] Test tool call counting
- [ ] Test empty/missing responses
- [ ] Test conversation history pairing

### 1.5 Build and Publish

- [ ] Run `pnpm build` in copilot-chat-analyzer
- [ ] Verify exports in dist/index.d.ts

## Phase 2: VS Code Extension UI

### 2.1 Update ProcessedDialogsTreeProvider

- [ ] Import new interfaces (AIResponse, ConversationTurn)
- [ ] Add method `getConversationForSession(sessionId)`
- [ ] Update `getRequestChildren()` to include response items

### 2.2 Add Response Tree Items

- [ ] Create response items under each request
- [ ] Add `contextValue: "response"` for AI responses
- [ ] Set appropriate icon (🤖 or ThemeIcon)
- [ ] Add tooltip with full response text

### 2.3 UI Polish

- [ ] Truncate long response previews (max 50 chars)
- [ ] Add "(no response)" for pending/canceled
- [ ] Show tool call count indicator if > 0

### 2.4 Testing

- [ ] Test with completed dialogs
- [ ] Test with in-progress dialogs
- [ ] Test with failed dialogs
- [ ] Test with tool-heavy responses

## Validation Checklist

- [ ] All unit tests pass
- [ ] Extension compiles without errors
- [ ] Tree view shows request → response hierarchy
- [ ] Tooltips display full text
- [ ] Edge cases handled gracefully
