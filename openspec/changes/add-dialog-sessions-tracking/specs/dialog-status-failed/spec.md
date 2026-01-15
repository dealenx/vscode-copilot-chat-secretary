# Spec: Dialog Status Failed

## Description

Add support for detecting and displaying failed dialog status when API errors occur.

## ADDED Requirements

### Requirement: Failed Status Detection

The `copilot-chat-analyzer` library MUST detect failed dialogs based on `errorDetails` in the response.

#### Scenario: Detect failed status from errorDetails

**Given** a chat export JSON where the last request has `result.errorDetails.code === "failed"`
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"failed"`

#### Scenario: Detect failed status from responseIsIncomplete

**Given** a chat export JSON where the last request has `result.errorDetails.responseIsIncomplete === true`
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"failed"`

#### Scenario: Failed takes priority over in_progress

**Given** a chat export JSON where the last request has `errorDetails` but no `followups`
**When** `getDialogStatus(chatData)` is called
**Then** it returns `"failed"` (not `"in_progress"`)

---

### Requirement: Failed Status Details

The `copilot-chat-analyzer` library MUST provide error details for failed dialogs.

#### Scenario: Get error message from failed dialog

**Given** a chat export JSON with a failed request
**When** `getDialogStatusDetails(chatData)` is called
**Then** it returns status `"failed"` with `errorMessage` containing the error details

#### Scenario: Get error code from failed dialog

**Given** a chat export JSON with a failed request containing `errorDetails.code`
**When** `getDialogStatusDetails(chatData)` is called
**Then** it includes `errorCode` in the result

---

### Requirement: Failed Status Display

The VS Code extension MUST display failed status with appropriate visual indicators.

#### Scenario: Show failed status in Chat Monitor

**Given** the current chat has failed status
**When** the Chat Monitor view is displayed
**Then** it shows "⚠️ Status: failed" with warning icon

#### Scenario: Show failed dialogs in Processed Dialogs view

**Given** a dialog in history has failed status
**When** the Processed Dialogs view is displayed
**Then** it shows the dialog with "⚠️" icon and failed status indicator
