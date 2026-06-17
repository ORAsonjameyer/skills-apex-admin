# Rollback and Revert Planning

Use this reference before non-production execution, before production-readiness handoff, and whenever validation fails during or after a non-production migration.

For production, this skill may plan rollback/revert decision points and handoff records only. It must not coordinate production rollback/revert execution.

## Concepts

- Backup/restore: platform or database-level return to a prior state. Owned by DB/platform workflow.
- APEX revert/downgrade: APEX-specific return path using documented scripts. Owned by DB/SYSDBA workflow.
- Application rollback: re-import or restore prior application export. Owned by APEX Admin or APEXlang workflow.
- ORDS rollback: restore prior ORDS version/configuration/static images. Owned by ORDS/platform workflow.
- Target reset: non-production reset after rehearsal or test migration. Owned by DB/platform workflow.

Do not treat these as interchangeable. The runbook must state which option applies.

## Required Before Cutover Or Handoff

Record:

- Chosen rollback/revert strategy.
- Owner and access requirements.
- Expected data loss or configuration loss.
- Last safe decision point.
- Estimated duration.
- Required backups, snapshots, exports, and ORDS/config copies.
- Validation failures that trigger rollback/revert.
- Who can authorize rollback/revert.

## APEX Revert Caution

Reverting to a prior APEX release can lose changes made in the upgraded APEX instance after the upgrade. Treat any post-upgrade application changes, workspace changes, runtime data changes, or imports as at-risk until the rollback window is closed.

## Decision Points

Define these in the runbook:

- Pre-execution: no state-changing work has started.
- After backup/snapshot: restore path should be confirmed before continuing.
- After APEX upgrade/install scripts: decide whether to continue to ORDS/static image/application validation.
- After ORDS/static image switch: decide whether web tier rollback is sufficient or DB/APEX revert is needed.
- After application imports/remediation: decide between app rollback and wider platform rollback.
- After non-production validation: decide whether to stabilize, rollback, reset, or accept risk.
- For production-readiness plans: define the external decision owner for stabilize, rollback, or accept-risk decisions.

## Rollback Handoff Block

```text
Trigger:
Rollback type:
Owner:
Authorization required:
Inputs/evidence:
Expected duration:
Expected data/config loss:
Validation after rollback:
Next communication:
```

## Close Rollback Window

Close the rollback window only when:

- Post-upgrade validation has passed or accepted risks are recorded.
- Business owner accepts the upgraded state.
- Follow-up work is tracked.
- Old APEX schema cleanup timing is agreed but not prematurely executed.
