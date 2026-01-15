# Spec: MCP Tools

Model Context Protocol (MCP) tools that enable AI agents in Copilot Chat to retrieve data from Copilot Chat Secretary.

## ADDED Requirements

### Requirement: Base Tool Infrastructure

The system SHALL provide an abstract base class `Tool` that implements `vscode.LanguageModelTool` interface for creating MCP tools.

#### Scenario: Tool with successful execution

- **WHEN** a concrete tool extends `Tool` and implements `call()` method
- **AND** AI agent invokes the tool through MCP
- **THEN** the `invoke()` method handles the call and returns `LanguageModelToolResult` with text part

#### Scenario: Tool with error handling

- **WHEN** concrete tool's `call()` method throws an error
- **AND** tool is invoked through MCP
- **THEN** base class catches error and returns `LanguageModelToolResult` with error JSON `{ isError: true, message: "..." }`

### Requirement: Get Request by Index Tool

The system SHALL provide an MCP tool named `copilot_chat_secretary_get_request` that retrieves a specific user request by position from a dialog.

#### Scenario: Get request by index from current dialog

- **WHEN** AI agent calls tool with `{ index: 2 }`
- **AND** there is an active dialog session with at least 2 requests
- **THEN** return JSON with `{ success: true, sessionId, request, index: 2, timestamp, totalRequests }`
- **AND** `request` contains the full text of the 2nd user request

#### Scenario: Get request by index from specific session

- **WHEN** AI agent calls tool with `{ index: 3, sessionId: "abc-123" }`
- **AND** session with that ID exists and has at least 3 requests
- **THEN** return JSON with session's 3rd request data

#### Scenario: Index less than 1

- **WHEN** AI agent calls tool with `{ index: 0 }` or `{ index: -1 }`
- **THEN** return JSON with `{ success: false, error: "Index must be 1 or greater" }`

#### Scenario: Index exceeds total requests

- **WHEN** AI agent calls tool with `{ index: 10 }`
- **AND** session only has 5 requests
- **THEN** return JSON with `{ success: false, error: "Index 10 exceeds total requests (5)" }`

#### Scenario: Chat data not available

- **WHEN** AI agent calls tool for a session
- **AND** session exists but has no chatJsonPath
- **THEN** return JSON with `{ success: false, error: "Chat data not available for session" }`

#### Scenario: Missing required index parameter

- **WHEN** AI agent calls tool without index parameter
- **THEN** return JSON with `{ success: false, error: "Index parameter is required" }`

### Requirement: Get First Request Tool

The system SHALL provide an MCP tool named `copilot_chat_secretary_get_first_request` that retrieves the first user request from a dialog.

#### Scenario: Get first request from current dialog

- **WHEN** AI agent calls tool without parameters
- **AND** there is an active dialog session
- **THEN** return JSON with `{ success: true, sessionId, firstRequest, timestamp, requestsCount }`
- **AND** `firstRequest` contains the first request preview (up to 80 characters)

#### Scenario: Get first request from specific session

- **WHEN** AI agent calls tool with `{ sessionId: "abc-123" }`
- **AND** session with that ID exists
- **THEN** return JSON with session's first request data

#### Scenario: No active dialog

- **WHEN** AI agent calls tool without parameters
- **AND** there is no active dialog session
- **THEN** return JSON with `{ success: false, error: "No active dialog found" }`

#### Scenario: Session not found

- **WHEN** AI agent calls tool with `{ sessionId: "non-existent" }`
- **AND** session does not exist
- **THEN** return JSON with `{ success: false, error: "Session not found: non-existent" }`

#### Scenario: First request unavailable

- **WHEN** AI agent calls tool for a session
- **AND** session exists but has no `firstRequestPreview`
- **THEN** return JSON with `{ success: false, error: "First request not available" }`

### Requirement: Tool Description for AI Agents

The system SHALL provide detailed tool descriptions that instruct AI agents when and how to use MCP tools.

#### Scenario: Tool description includes use cases

- **WHEN** tool is registered with VS Code Language Model API
- **THEN** tool description includes section "Use this tool when:" with specific scenarios
- **AND** description includes parameter documentation
- **AND** description includes return value format with examples

#### Scenario: Tool description includes example usage

- **WHEN** AI agent queries available tools
- **THEN** tool description includes "Example usage scenarios" section
- **AND** examples show both with and without parameters

### Requirement: Tool Registration

The system SHALL register MCP tools with VS Code Language Model API during extension activation.

#### Scenario: Tool registered successfully

- **WHEN** extension activates
- **THEN** call `vscode.lm.registerTool(toolName, tool)` for each MCP tool
- **AND** add returned disposable to subscriptions
- **AND** log successful registration to console

#### Scenario: Tool available to AI agents

- **WHEN** tool is registered
- **THEN** AI agent in Copilot Chat can discover and invoke the tool

### Requirement: Tool Input Schema

The system SHALL define JSON schema for tool parameters that validates AI agent inputs.

#### Scenario: Schema validation

- **WHEN** tool defines `inputSchema` with parameter types
- **AND** AI agent calls tool with parameters
- **THEN** VS Code validates parameters against schema before invoking tool

### Requirement: Dependency Injection for Tools

The system SHALL inject required services into MCP tools through constructor.

#### Scenario: Tool receives dependencies

- **WHEN** tool is instantiated
- **THEN** receive `ChatMonitorTreeProvider` for current session access
- **AND** receive `DialogSessionsServiceImpl` for session data retrieval

### Requirement: Tool Response Format

The system SHALL return tool results as JSON strings wrapped in `LanguageModelToolResult`.

#### Scenario: Successful response format

- **WHEN** tool execution succeeds
- **THEN** return `new LanguageModelToolResult([new LanguageModelTextPart(jsonString)])`
- **AND** JSON contains `success: true` field

#### Scenario: Error response format

- **WHEN** tool execution fails
- **THEN** return `LanguageModelToolResult` with JSON containing `{ success: false, error: "message" }`
- **OR** if exception occurs, return `{ isError: true, message: "exception message" }`

### Requirement: Tool Naming Convention

The system SHALL use prefixed snake_case names for all MCP tools.

#### Scenario: Tool name format

- **WHEN** new MCP tool is created
- **THEN** tool name starts with `copilot_chat_secretary_`
- **AND** followed by descriptive action in snake_case
- **EXAMPLE**: `copilot_chat_secretary_get_first_request`

### Requirement: Console Logging for Tool Operations

The system SHALL log MCP tool registration and invocations to console for debugging.

#### Scenario: Registration logged

- **WHEN** MCP tool is registered
- **THEN** log message `"MCP tool registered: {toolName}"` to console

#### Scenario: Invocation logged (optional for debugging)

- **WHEN** tool is invoked by AI agent
- **THEN** optionally log invocation details for debugging purposes
