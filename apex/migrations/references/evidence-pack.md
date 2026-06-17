# Evidence Pack

Use this reference to define the proof needed before, during, and after an APEX migration.

Do not store customer-specific evidence in this skill folder. Filled evidence packs must be written only to a user-confirmed external path or kept chat-only.

Execution evidence collected by this skill must come from non-production migrations only. For production, define expected evidence and handoff ownership, but do not coordinate the live execution that produces it.

## Evidence Register Row

Use this compact shape:

```text
Evidence ID:
Phase:
Owner:
Source:
Expected item:
Received: yes | no | waived
Status: pass | review | blocked
Notes:
Follow-up owner:
```

## Pre-Migration Evidence

Collect or request:

- Source APEX version, target APEX version, source support status, target support status.
- Environment name and explicit production status.
- Database version/RU, CDB/PDB placement, APEX local/root placement, edition, RAC status if relevant.
- ORDS version, deployment model, static images path, restart method, and web tier owner.
- Memory, `WORKAREA_SIZE_POLICY`, tablespace free space, software staging space, language packs.
- XML DB, `ANONYMOUS`, Database Vault, network services, and workspace provisioning constraints.
- Workspace/application inventory, critical apps, compatibility modes, plug-ins, REST data sources, credentials, mail/PDF/reporting, jobs, AI services, and external integrations.
- Application exports and export type.
- Backup, snapshot, restore, rollback/revert, and retention plan.
- Rehearsal output or explicit waiver.
- Test plan and acceptance criteria.

## Non-Production Execution Evidence

For non-production runs, record:

- Start and finish time for each phase.
- Owner and workflow used for each state-changing action.
- APEX upgrade/install/import logs from the owning workflow.
- ORDS upgrade/static image/restart evidence from the owning workflow.
- Application validate/import output from APEX Admin or APEXlang.
- Errors, retries, deviations, and accepted-risk approvals.

For production handoff packages, list the expected execution evidence and external owner instead of collecting live execution results through this skill.

## Post-Migration Evidence

Collect:

- Target APEX version and ORDS version.
- APEX Administration Services login and workspace login evidence.
- Static images load correctly from the expected virtual directory.
- Critical application smoke test results.
- Authentication and authorization checks.
- Activity logs, debug logs, background jobs, mail, REST data sources, web credentials, PDF/reporting, AI services, and external integrations.
- APEX Advisor/Application Upgrade Wizard findings and disposition.
- Release-note impact review for critical apps.
- Performance or timing evidence when performance risk was in scope.

## Closeout Evidence

Closeout needs:

- Final go/no-go or acceptance decision.
- Outstanding findings with owners and target dates.
- Rollback/revert status and whether the rollback window remains open.
- Old APEX schema cleanup decision deferred or explicitly scheduled through DB workflow.
- Confirmation that no customer-specific reports were stored inside this skill folder.
