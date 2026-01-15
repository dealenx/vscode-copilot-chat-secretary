# AI Responses Extraction Specification

## ADDED Requirements

### Requirement: AI Response Extraction

The copilot-chat-analyzer library MUST provide a method to extract AI responses from chat export data.

#### Scenario: Extract single AI response

**Given** a chat export with one request containing a response  
**When** `getAIResponses(chatData)` is called  
**Then** an array with one `AIResponse` object is returned  
**And** the `message` field contains the aggregated response text  
**And** the `requestId` matches the original request ID

#### Scenario: Extract response from multiple sources

**Given** a chat export where response text appears in both `response[].value` and `toolCallRounds[].response`  
**When** `getAIResponses(chatData)` is called  
**Then** response text from all sources is aggregated  
**And** duplicate text is not repeated

#### Scenario: Handle missing response

**Given** a chat export with a request that has no response (in_progress or canceled)  
**When** `getAIResponses(chatData)` is called  
**Then** an `AIResponse` object with empty `message` is returned for that request

#### Scenario: Count tool calls

**Given** a chat export with responses containing tool calls  
**When** `getAIResponses(chatData)` is called  
**Then** each `AIResponse.toolCallCount` reflects the number of tool calls  
**And** `hasToolCalls` is true when `toolCallCount > 0`

---

### Requirement: Conversation History

The copilot-chat-analyzer library MUST provide a method to get paired request/response conversation turns.

#### Scenario: Get full conversation history

**Given** a chat export with multiple requests and responses  
**When** `getConversationHistory(chatData)` is called  
**Then** an array of `ConversationTurn` objects is returned  
**And** each turn contains the `request` and corresponding `response`  
**And** turns are ordered by index

#### Scenario: Handle incomplete conversation

**Given** a chat export where the last request has no response  
**When** `getConversationHistory(chatData)` is called  
**Then** the last turn has `response: null`  
**And** all previous turns have valid responses

---

### Requirement: UI Display of Responses

The VS Code extension MUST display AI responses in the processed dialogs tree view.

#### Scenario: Show response under request

**Given** a session with completed requests  
**When** user expands a request item in the DIALOGS tree  
**Then** AI response item is shown as a child  
**And** response item has robot icon  
**And** response text is truncated to ~50 characters for display

#### Scenario: Show pending response

**Given** a session with an in-progress request  
**When** user views the DIALOGS tree  
**Then** response item shows "Waiting for response..." or similar  
**And** response item has pending icon

#### Scenario: Response tooltip

**Given** a response item in the tree view  
**When** user hovers over the response item  
**Then** tooltip shows full response text  
**And** long responses are displayed without truncation in tooltip
