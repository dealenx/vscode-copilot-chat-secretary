# Tasks: Add AI Responses Extraction

## Phase 1: copilot-chat-analyzer Library

### 1.1 Add AIResponse Interface

- [x] Add `AIResponse` interface to `src/index.ts`
- [x] Add `ConversationTurn` interface to `src/index.ts`
- [x] Export new interfaces

### 1.2 Implement getAIResponses Method

- [x] Add `getAIResponses(chatData): AIResponse[]` method
- [x] Extract response text from `response[].value`
- [x] Extract response text from `toolCallRounds[].response`
- [x] Aggregate multiple response parts
- [x] Count tool calls per response

### 1.3 Implement getConversationHistory Method

- [x] Add `getConversationHistory(chatData): ConversationTurn[]` method
- [x] Pair user requests with AI responses
- [x] Handle missing/incomplete responses (return null)
- [x] Maintain correct ordering by index

### 1.4 Unit Tests

- [x] Test basic response extraction
- [x] Test multi-part response aggregation
- [x] Test tool call counting
- [x] Test empty/missing responses
- [x] Test conversation history pairing

### 1.5 Build and Publish

- [x] Run `pnpm build` in copilot-chat-analyzer
- [x] Verify exports in dist/index.d.ts

## Phase 2: VS Code Extension UI

### 2.1 Update ProcessedDialogsTreeProvider

- [x] Import new interfaces (AIResponse, ConversationTurn)
- [x] Add method `getResponseForRequest()` to get AI response
- [x] Update `getChildren()` to include response items

### 2.2 Add Response Tree Items

- [x] Create response items under each request
- [x] Add `contextValue: "responseItem"` for AI responses
- [x] Set appropriate icon (🤖 hubot ThemeIcon)
- [x] Add tooltip with full response text

### 2.3 UI Polish

- [x] Truncate long response previews (max 50 chars)
- [x] Add "(no response)" for pending/canceled
- [x] Show tool call count indicator if > 0

### 2.4 Testing

- [ ] Test with completed dialogs
- [ ] Test with in-progress dialogs
- [ ] Test with failed dialogs
- [ ] Test with tool-heavy responses

## Validation Checklist

- [x] All unit tests pass
- [x] Extension compiles without errors
- [x] Tree view shows request → response hierarchy
- [x] Tooltips display full text
- [x] Edge cases handled gracefully
