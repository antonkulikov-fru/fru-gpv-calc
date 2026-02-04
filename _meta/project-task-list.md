# gpv-impact-calc Project Task List

## Current Tasks

- [ ] **SETUP-TASK-001: Initial project setup** - 🚧 **IN PROGRESS**
	- Ensure metacoding workflow and assistant configurations are complete and verified
	- Acceptance: Project setup steps documented and validated

- [ ] **CORE-TASK-001: Implement GPV compute engine** - ✅ **COMPLETED**
	- Implement model-data computation per schema and PRD formulas
	- Emit computation trace and warnings for UI
	- Acceptance: Deterministic outputs match documented formulas and constraints

- [ ] **UI-TASK-001: Wire scenario UI to schema and outputs** - ✅ **COMPLETED**
	- Bind layer inputs to schema entities and validations
	- Surface warnings and computation trace in UI
	- Acceptance: UI inputs recompute outputs live and display warnings

- [ ] **DATA-TASK-001: Provide default scenario JSON** - ✅ **COMPLETED**
	- Create seed scenario based on provided baseline values
	- Enable import/export of scenario JSON
	- Acceptance: Default scenario loads and exports/imports round-trip

- [ ] **TEST-TASK-001: Add compute engine tests** - ✅ **COMPLETED**
	- Add unit tests for formulas, constraints, and warnings
	- Acceptance: Tests validate deterministic outputs and strict distributions

- [ ] **DOC-TASK-001: Update documentation and changelog** - ✅ **COMPLETED**
	- Update docs after implementation and testing
	- Acceptance: README/CHANGELOG/task status updated

- [ ] **UI-TASK-002: Group Intent Capture by vertical** - ✅ **COMPLETED**
	- Render Capture layer sections per vertical with nested channel, surface, model, and CR-1 tables
	- Acceptance: Capture layer UI is organized by vertical without changing data model or compute

- [ ] **UI-TASK-003: Add flow-based Intent Capture layout** - ✅ **COMPLETED**
	- Render per-org flow rows (Channel → Surface → Model → CR-1) with inline values
	- Acceptance: Capture layer matches the provided flow layout screenshot

- [ ] **UI-TASK-004: Render Capture as table** - ✅ **COMPLETED**
	- Replace flow layout with a table of vertical, channel, surface, model, and CR-1 columns
	- Acceptance: Capture layer renders rows like the specified column layout

- [ ] **UI-TASK-005: Add row grouping to Capture table** - ✅ **COMPLETED**
	- Use row spans to avoid repeating vertical and channel values
	- Acceptance: Capture table shows unique vertical/channel rows and maintains 100% mix

- [ ] **UI-TASK-006: Donation Execution table + Config tab** - ✅ **COMPLETED**
	- Render Donation Execution as aggregate rows with output columns
	- Move churn and seasonality inputs to a new Config tab
	- Acceptance: Execution table shows cadence inputs and outputs; Config tab holds churn/seasonality

- [ ] **UI-TASK-007: Remove GPV outputs from Execution table** - ✅ **COMPLETED**
	- Drop GPV 1T output column from Donation Execution table
	- Acceptance: GPV outputs only appear in Overall Outputs panel

- [ ] **UI-TASK-008: Align Config tables with original model** - ✅ **COMPLETED**
	- Add churn and seasonality derived columns to match the original config layout
	- Acceptance: Config tab matches the shared reference tables

- [ ] **UI-TASK-009: Editable churn inputs** - ✅ **COMPLETED**
	- Make monthly churn editable and recompute cumulative survival
	- Acceptance: Config churn table matches the bordered input layout

- [ ] **UI-TASK-010: Enforce offline surface mapping** - ✅ **COMPLETED**
	- Restrict offline channel to mobile app surface in UI and defaults
	- Acceptance: Offline no longer renders website/donor portal surfaces

- [x] **UI-TASK-011: Fix Capture table row spans** - ✅ **COMPLETED**
	- Compute row spans from actual rendered rows to avoid overlap between orgs
	- Acceptance: Vertical and Channel cells align correctly per org

- [ ] **UI-TASK-012: Add channel-surface mappings** - 🚧 **IN PROGRESS**
	- Add phone and direct mail channels with virtual terminal and API surfaces
	- Map offline to mobile app and reuse existing donation models
	- Acceptance: Capture/Execution tables render new channels and surfaces with valid defaults

- [ ] **UI-TASK-013: Harmonize percent input widths** - 🚧 **IN PROGRESS**
	- Standardize percent input sizing and bounds across layers
	- Acceptance: Percent fields use consistent width and stay within 0-100

- [ ] **UI-TASK-014: Adopt Tailwind + shadcn inputs** - 🚧 **IN PROGRESS**
	- Replace custom CSS with Tailwind utilities and shadcn input components
	- Acceptance: Inputs accept direct typing and step increments correctly

- [x] **DOC-TASK-002: Create comprehensive README.md** - ✅ **COMPLETED**
	- Detail project goal, architecture, tech stack, and setup
	- Acceptance: README.md exists and accurately reflects the project

- [x] **CONFIG-TASK-001: Update .gitignore with standard exclusions** - ✅ **COMPLETED**
	- Add node_modules, dist, .env, and other common exclusions
	- Acceptance: .gitignore covers standard Node.js and OS-specific temporary files

- [ ] **CONFIG-TASK-002: Push initial commit** - 🚧 **IN PROGRESS**
	- Stage all project files
	- Create initial commit with conventional format
	- Push to remote repository
	- Acceptance: Remote reflects the current project state

## Task Status Legend

- 🚧 **IN PROGRESS** - Currently being worked on
- ✅ **COMPLETED** - Task finished and verified
- ❌ **BLOCKED** - Task cannot proceed due to dependency or issue
- ⏸️ **ON HOLD** - Task paused for specific reason
- 📋 **NOT STARTED** - Task identified but not yet begun

## Notes

This task list follows the 7-step development workflow. All tasks must be documented here before implementation begins.
