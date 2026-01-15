# Copy AI Response Specification

## ADDED Requirements

### Requirement: Copy AI Response Command

The VS Code extension MUST provide a command to copy AI agent responses to clipboard.

#### Scenario: Copy response from OPENED DIALOG view

**Given** a conversation turn with an AI response in the OPENED DIALOG tree view  
**When** user clicks the copy button on the response item  
**Then** the full response text is copied to clipboard  
**And** an information message "AI response copied to clipboard" is shown

#### Scenario: Copy response from DIALOGS view

**Given** a dialog session with AI responses in the DIALOGS tree view  
**When** user expands a request and clicks copy button on the response item  
**Then** the full response text is copied to clipboard  
**And** an information message "AI response copied to clipboard" is shown

#### Scenario: Handle empty response

**Given** an AI response item with no message content (empty or null)  
**When** user attempts to copy the response  
**Then** a warning message "No AI response available to copy" is shown  
**And** clipboard is not modified

#### Scenario: Handle copy failure

**Given** an AI response with valid content  
**When** clipboard operation fails (system error)  
**Then** an error message with failure details is shown  
**And** user is informed of the error
