# Migration Rehearsal

Use this reference when planning a dry run, non-production migration, dress rehearsal, or production-readiness exercise.

## Purpose

A rehearsal proves that the migration path, owners, timings, evidence collection, validation, rollback assumptions, and communication plan work before an external production cutover.

Rehearsal execution must run only in a non-production environment.

## Rehearsal Fidelity

The rehearsal should match production as closely as practical:

- Same source APEX release and target APEX release.
- Same target database family/RU and ORDS family/version.
- Same CDB/PDB and local/root APEX placement pattern.
- Same runtime-only or full development environment mode.
- Same critical workspaces and representative applications.
- Same static images, ORDS deployment model, authentication, mail, REST, PDF/reporting, jobs, credentials, AI services, and network dependencies where possible.
- Same export type and import approach for application migration.
- Same validation checklist and evidence pack shape.

If the rehearsal is not representative, record the gaps as review gates.

## Rehearsal Steps

1. Freeze rehearsal scope and inputs.
2. Confirm backup/restore or reset method for the rehearsal target.
3. Run release path and application eligibility gates.
4. Execute the planned migration through owning workflows in the non-production rehearsal environment.
5. Record phase durations, errors, owner handoffs, and deviations.
6. Run post-upgrade validation and regression scope.
7. Decide whether defects block production, require remediation, or are accepted risk.
8. Update the production-readiness handoff package with measured timings and corrected steps.

## Required Timings

Record:

- Backup/snapshot time.
- APEX upgrade or install time.
- Reduced-downtime phase durations when used.
- ORDS/static image/restart time.
- Application validate/import time.
- Post-upgrade validation time.
- Rollback/revert or target reset time when tested.

## Exit Criteria

Rehearsal passes when:

- The planned path completes without unaccepted blockers.
- Timings fit the planned external production window or the window is adjusted.
- Owners and handoffs are proven.
- Evidence pack can be collected.
- Critical app smoke tests pass or failures have accepted remediation before production.
- Rollback/revert assumptions are tested or explicitly waived.

If rehearsal fails, production-readiness status is `no_go` unless the user explicitly accepts the risk and records the waiver. This skill still must not coordinate production execution.
