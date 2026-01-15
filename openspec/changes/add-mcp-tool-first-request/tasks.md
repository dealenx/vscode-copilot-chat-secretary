# Tasks: Add MCP Tool for First Request Retrieval

## 1. Base Tool Infrastructure

- [x] 1.1 Create `src/mcp/Tool.ts` with abstract base class
- [x] 1.2 Implement `invoke()` method with error handling
- [x] 1.3 Define `call()` abstract method signature
- [x] 1.4 Add helper methods for JSON formatting

## 2. GetFirstRequestTool Implementation

- [x] 2.1 Create `src/mcp/GetFirstRequestTool.ts`
- [x] 2.2 Define tool name constant
- [x] 2.3 Implement MCP tool description with detailed instructions
- [x] 2.4 Define input schema for parameters
- [x] 2.5 Implement `call()` method logic:
  - [x] 2.5.1 Parse sessionId from options
  - [x] 2.5.2 Get current session if no sessionId provided
  - [x] 2.5.3 Retrieve session from DialogSessionsService
  - [x] 2.5.4 Format and return JSON response
- [x] 2.6 Implement error handling for all scenarios

## 3. GetRequestTool Implementation

- [x] 3.1 Create `src/mcp/GetRequestTool.ts`
- [x] 3.2 Define tool name constant
- [x] 3.3 Implement MCP tool description with detailed instructions
- [x] 3.4 Define input schema for parameters (index required, sessionId optional)
- [x] 3.5 Implement `call()` method logic:
  - [x] 3.5.1 Parse index and sessionId from options
  - [x] 3.5.2 Validate index >= 1
  - [x] 3.5.3 Get current session if no sessionId provided
  - [x] 3.5.4 Load chat JSON file from session.chatJsonPath
  - [x] 3.5.5 Parse JSON and get requests using CopilotChatAnalyzer
  - [x] 3.5.6 Validate index <= totalRequests
  - [x] 3.5.7 Return request at index (convert to 0-based)
- [x] 3.6 Implement error handling for all scenarios

## 4. Registration

- [x] 4.1 Register both MCP tools in `extension.ts` using `vscode.lm.registerTool`
- [x] 4.2 Pass required dependencies (chatMonitorProvider, sessionsService, context)
- [x] 4.3 Add tool registrations to subscriptions for cleanup
- [x] 4.4 Add console logging for successful registrations

## 5. Package.json Configuration

- [x] 5.1 Add `languageModelTools` section to package.json
- [x] 5.2 Declare all three MCP tools (get_first_request, get_request, hello_world_tool)
- [x] 5.3 Configure tool metadata (displayName, descriptions, icons, tags)
- [x] 5.4 Define input schemas for each tool
- [x] 5.5 Fix tool name consistency (hello_world_tool in both code and package.json)

## 6. Types

- [x] 6.1 Define `GetFirstRequestToolOptions` interface
- [x] 6.2 Define `GetRequestToolOptions` interface
- [x] 6.3 Define response types for type safety

## 7. Documentation

- [x] 7.1 Add MCP Tools section to README.md
- [x] 7.2 Document both tool names and parameters
- [x] 7.3 Add usage examples for AI agents
- [x] 7.4 Document error responses

## 8. Testing

- [ ] 8.1 Manual test: GetFirstRequestTool without parameters
- [ ] 8.2 Manual test: GetFirstRequestTool with valid sessionId
- [ ] 8.3 Manual test: GetFirstRequestTool with invalid sessionId
- [ ] 8.4 Manual test: GetFirstRequestTool when no active dialog
- [ ] 8.5 Manual test: GetRequestTool with index=1 (first request)
- [ ] 8.6 Manual test: GetRequestTool with index=2 (second request)
- [ ] 8.7 Manual test: GetRequestTool with index out of range
- [ ] 8.8 Manual test: GetRequestTool with index < 1
- [ ] 8.9 Manual test: GetRequestTool with sessionId parameter
- [ ] 8.10 Verify tools appear in AI agent's available tools list
