# gpv-impact-calc Test Documentation

## Test Framework Configuration

**Framework**: Jest + React Testing Library
**Test Command**: `npm test`

## Test Cases

| Test Case ID  | Description                                                      | Type | Status      |
| :------------ | :--------------------------------------------------------------- | :--- | :---------- |
| SETUP-UNIT-001 | Verify project setup configuration files are present             | Unit | Not Started |
| CORE-UNIT-001 | Compute IntentExposed per org and TotalIntentExposedToFRU         | Unit | Not Started |
| CORE-UNIT-002 | Enforce strict distribution constraints and rate bounds           | Unit | Completed   |
| CORE-UNIT-003 | Compute opportunities, transactions, and GPV totals               | Unit | Completed   |
| CORE-UNIT-004 | Compute processor fees, FRU revenue, and org net proceeds         | Unit | Completed   |
| CORE-UNIT-005 | Emit warnings for zero active orgs or unsupported execution paths | Unit | Not Started |
| UI-UNIT-001   | Enforce channel-to-surface mappings for phone/direct mail/offline | Unit | Completed   |
| UTIL-UNIT-001 | Percent conversion preserves small inputs (2%, 5%)               | Unit | Completed   |
| CORE-UNIT-006 | Use per-row CR-2/amount/existing recurring inputs                | Unit | Completed   |

## Test Coverage Goals

- Unit Tests: 80%+ coverage for critical functionality
- Integration Tests: Key workflow paths
- End-to-end Tests: User scenarios

## Notes

All test cases must be documented here before test implementation begins, following the TDD approach of the 7-step workflow.
