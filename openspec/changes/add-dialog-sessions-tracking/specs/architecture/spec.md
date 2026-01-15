# Spec: Architecture

## Description

Defines system boundaries, responsibilities, and integration patterns for the copilot-chat-secretary ecosystem.

## ADDED Requirements

### Requirement: Chat Export Responsibility

The VS Code extension MUST use the VS Code built-in command `workbench.action.chat.export` to obtain chat data. The `copilot-chat-analyzer` library MUST NOT implement chat export functionality.

#### Scenario: Extension exports chat using VS Code command

**Given** the extension needs to access current chat data
**When** it requests chat content
**Then** it calls `vscode.commands.executeCommand('workbench.action.chat.export', tempUri)`
**And** reads the exported JSON file from the specified URI

#### Scenario: Library receives pre-exported data

**Given** the `copilot-chat-analyzer` library needs to analyze chat
**When** any of its methods are called
**Then** it receives already-exported JSON data as a parameter
**And** it does NOT call any VS Code commands or APIs

---

### Requirement: Library Analysis Scope

The `copilot-chat-analyzer` library MUST be limited to parsing and analyzing chat export JSON data. It MUST NOT have dependencies on VS Code APIs.

#### Scenario: Library is environment-agnostic

**Given** the `copilot-chat-analyzer` library
**When** its package.json is examined
**Then** it has NO dependencies on `@types/vscode` or `vscode`
**And** it can be used in Node.js, browsers, or other environments

#### Scenario: Library provides analysis methods only

**Given** the `copilot-chat-analyzer` library
**When** its exported API is examined
**Then** all methods accept chat data as input parameters
**And** no methods perform I/O operations (file reads, network requests, etc.)

---

### Requirement: Extension UI Responsibility

The VS Code extension MUST manage all user interface elements. UI logic MUST NOT be placed in the `copilot-chat-analyzer` library.

#### Scenario: Extension provides tree views

**Given** the copilot-chat-secretary extension
**When** it displays chat monitoring information
**Then** it uses VS Code TreeDataProvider API
**And** the library only provides data structures and analysis results

---

### Requirement: Data Flow Direction

Data MUST flow from VS Code export → Extension → Library → Extension → UI. The library MUST be a pure transformation layer.

#### Scenario: Standard data flow

**Given** the user has an active Copilot chat
**When** the extension monitors the chat
**Then** VS Code exports chat to JSON (step 1)
**And** Extension reads JSON file (step 2)
**And** Extension passes JSON to library for analysis (step 3)
**And** Library returns analysis results (step 4)
**And** Extension updates UI with results (step 5)
