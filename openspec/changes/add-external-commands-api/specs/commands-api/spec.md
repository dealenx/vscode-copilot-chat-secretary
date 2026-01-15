# Spec: Commands API

External Commands API для доступа к данным Copilot Chat Secretary из других расширений.

## ADDED Requirements

### Requirement: Get Status Command

The system SHALL provide a command `copilotChatSecretary.api.getStatus` that returns the current chat monitoring status.

#### Scenario: Get status when chat is active

- **WHEN** external extension executes `copilotChatSecretary.api.getStatus`
- **AND** there is an active chat session
- **THEN** return object with `status`, `sessionId`, `requestsCount`, `lastUpdate`, `isActive`

#### Scenario: Get status when no chat activity

- **WHEN** external extension executes `copilotChatSecretary.api.getStatus`
- **AND** there is no active chat session
- **THEN** return object with `status: 'pending'`, `sessionId: null`, `requestsCount: 0`, `isActive: false`

### Requirement: Get Current Dialog Command

The system SHALL provide a command `copilotChatSecretary.api.getCurrentDialog` that returns the currently active dialog session.

#### Scenario: Get current dialog when active

- **WHEN** external extension executes `copilotChatSecretary.api.getCurrentDialog`
- **AND** there is an active dialog session
- **THEN** return DialogSessionResponse object with session details

#### Scenario: Get current dialog when none active

- **WHEN** external extension executes `copilotChatSecretary.api.getCurrentDialog`
- **AND** there is no active dialog session
- **THEN** return `null`

### Requirement: Get Dialog History Command

The system SHALL provide a command `copilotChatSecretary.api.getDialogHistory` that returns historical dialog sessions.

#### Scenario: Get all history

- **WHEN** external extension executes `copilotChatSecretary.api.getDialogHistory` without options
- **THEN** return array of DialogSessionResponse objects sorted by lastSeen descending
- **AND** limit to 100 items by default

#### Scenario: Get history with limit

- **WHEN** external extension executes `copilotChatSecretary.api.getDialogHistory` with `{ limit: 5 }`
- **THEN** return at most 5 DialogSessionResponse objects

#### Scenario: Get history filtered by status

- **WHEN** external extension executes `copilotChatSecretary.api.getDialogHistory` with `{ status: 'completed' }`
- **THEN** return only DialogSessionResponse objects where status equals 'completed'

### Requirement: Get Session By ID Command

The system SHALL provide a command `copilotChatSecretary.api.getSession` that returns a specific session by ID.

#### Scenario: Get existing session

- **WHEN** external extension executes `copilotChatSecretary.api.getSession` with `{ sessionId: 'abc-123' }`
- **AND** session with that ID exists
- **THEN** return DialogSessionResponse object for that session

#### Scenario: Get non-existing session

- **WHEN** external extension executes `copilotChatSecretary.api.getSession` with `{ sessionId: 'non-existent' }`
- **AND** session with that ID does not exist
- **THEN** return `null`

### Requirement: Immutable Response Data

The system SHALL return copies of internal data structures to prevent external mutation.

#### Scenario: Returned data is independent

- **WHEN** external extension modifies returned status object
- **THEN** internal state of Copilot Chat Secretary remains unchanged

### Requirement: API Response Types

The system SHALL define and export the following types for API responses:

```typescript
interface ChatStatusResponse {
  status: "pending" | "in_progress" | "completed" | "canceled" | "failed";
  sessionId: string | null;
  requestsCount: number;
  lastUpdate: number;
  isActive: boolean;
}

interface DialogSessionResponse {
  sessionId: string;
  status: string;
  firstSeen: number;
  lastSeen: number;
  requestsCount: number;
  firstRequestPreview: string;
  agentId?: string;
  modelId?: string;
}
```

#### Scenario: Type definitions available

- **WHEN** external extension imports types from package
- **THEN** TypeScript types are available for API responses
