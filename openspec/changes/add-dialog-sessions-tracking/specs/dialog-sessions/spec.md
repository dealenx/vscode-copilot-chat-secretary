# Spec: Dialog Sessions

## Description

Track and manage dialog session identities in Copilot chat interactions.

## ADDED Requirements

### Requirement: Session ID Extraction

The `copilot-chat-analyzer` library MUST provide a method to extract the session ID from chat export data.

#### Scenario: Extract session ID from completed chat

**Given** a chat export JSON with at least one request that has a response
**When** `getSessionId(chatData)` is called
**Then** it returns the `sessionId` string from `requests[].result.metadata.sessionId`

#### Scenario: Extract session ID when no response yet

**Given** a chat export JSON where no requests have responses
**When** `getSessionId(chatData)` is called
**Then** it returns `null`

#### Scenario: Extract session ID from empty chat

**Given** an empty chat export JSON with no requests
**When** `getSessionId(chatData)` is called
**Then** it returns `null`

---

### Requirement: Session Info Extraction

The `copilot-chat-analyzer` library MUST provide a method to extract session metadata.

#### Scenario: Get full session info

**Given** a chat export JSON with completed requests
**When** `getSessionInfo(chatData)` is called
**Then** it returns a `DialogSession` object with `sessionId`, optional `agentId`, and optional `modelId`

---

### Requirement: Session History Persistence

The VS Code extension MUST persist processed dialog sessions across restarts.

#### Scenario: Record new session

**Given** the extension receives chat data with a new `sessionId`
**When** the session is processed
**Then** a `DialogSessionRecord` is saved to globalState with sessionId, timestamps, and request preview

#### Scenario: Update existing session

**Given** the extension receives chat data with an existing `sessionId`
**When** the session is processed
**Then** the existing record's `lastSeen`, `requestsCount`, and `status` are updated

#### Scenario: Load session history on startup

**Given** the extension activates
**When** session history is requested
**Then** previously saved `DialogSessionRecord` entries are loaded from globalState

---

### Requirement: Session History Display

The VS Code extension MUST display a list of processed dialog sessions.

#### Scenario: Show processed dialogs view

**Given** the extension is active
**When** the user opens the "Processed Dialogs" view
**Then** a list of `DialogSessionRecord` entries is displayed with session ID preview, status, and request count

#### Scenario: Show current session in monitor

**Given** the extension is monitoring an active chat
**When** the chat has a session ID
**Then** the Chat Monitor panel shows the current session ID
