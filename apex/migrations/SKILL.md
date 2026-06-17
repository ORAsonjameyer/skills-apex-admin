---
name: migrations
description: Oracle APEX migration and upgrade planning plus non-production execution orchestration for APEX release upgrades, pre-checks, rehearsals, go/no-go decisions, cutover strategy, rollback/revert planning, evidence packs, regression scope, post-upgrade validation, and handoff routing. Use when Codex needs to assess, plan, or coordinate an APEX instance upgrade, APEX release migration, workspace/application migration readiness, non-production migration execution runbook, or production-readiness handoff without duplicating APEX admin, APEXlang, DB, ORDS, or SQLcl execution guidance.
---

# Oracle APEX Migrations

Use this skill for APEX migration and release-upgrade planning. Keep it as the orchestration layer: identify scope, choose the supported upgrade path, assemble pre-checks, plan cutover and validation, coordinate the migration runbook, and route execution work to the owning skill.

This skill can drive an end-to-end migration as the migration commander only for explicitly non-production environments: maintain the runbook, enforce phase gates, collect evidence, decide when to stop or proceed, and hand off state-changing actions. It must not execute or orchestrate production migrations. For production, it may create plans, readiness checks, evidence requirements, and handoff packages only.

## Scope

This skill owns:

- APEX release-upgrade readiness and migration planning.
- Source and target release assessment.
- APEX-specific pre-check inventory.
- Cutover, downtime, rollback/revert, and post-upgrade validation planning.
- Non-production end-to-end migration execution orchestration through phase gates, owner routing, go/no-go checks, evidence collection, and closeout.
- Production-readiness planning, handoff packaging, rehearsal standards, freeze planning, rollback/revert planning, and stabilization standards.
- Regression-test scope for upgraded APEX applications.
- File-only static scans of APEX application exports for migration-risk triage.
- Handoff decisions for APEX Admin, APEXlang, DB, ORDS, and SQLcl work.

This skill does not own:

- Generating or materially changing APEX application artifacts. Route to `apex/apexlang/SKILL.md`.
- Routine APEX administration, workspace lifecycle, imports, monitoring, or security checks. Route to `apex/admin/SKILL.md`.
- Running APEX install/upgrade SQL scripts, changing database parameters, managing tablespaces, AWR/ASH, ORDS runtime tuning, database upgrades, or SYSDBA work. Route to the relevant DB, platform, ORDS, or SQLcl skill/runbook.
- Executing application imports, APEXlang imports, Universal Theme refreshes, Compatibility Mode changes, Advisor remediation, or application artifact changes. Route to APEX Admin or APEXlang.
- Coordinating or driving production migration execution. For production, stop at planning, readiness, evidence requirements, and handoff routing.

## Start Order

1. Classify the request:
   - `release_upgrade`: existing APEX instance to a newer APEX release.
   - `instance_migration`: move APEX instance/workspaces/apps to another database or service.
   - `application_migration`: app/workspace migration without platform upgrade.
   - `compatibility_review`: assess app/export readiness for a target release.
   - `execution_orchestration`: coordinate a real non-production migration runbook, rehearsal, cutover, validation, rollback/revert, or closeout.
2. If the task is file-only or planning-only, say that no database access is needed for that step.
3. For execution orchestration, classify the target environment before any runbook execution:
   - Allowed execution environments: development, test, QA, UAT, staging, sandbox, training, demo, rehearsal, or another environment explicitly confirmed as non-production.
   - Blocked execution environments: production, live, customer-facing production, business-critical production, or any environment whose production status is unclear.
   - If production or unclear, switch to production-readiness planning and handoff packaging only. Do not coordinate live execution.

   ```bash
   node apex/migrations/scripts/migration-environment-gate.mjs --environment <env_name> --production-status <non-production|production|unknown> --intent execution
   ```

4. Run the minimal prerequisite gate before loading broader references when source/target facts are available.

   For APEX release-upgrade planning:

   ```bash
   node apex/migrations/scripts/apex-release-path-check.mjs --source <source_apex> --target <target_apex> --db <db_version_or_ru> --ords <ords_version>
   ```

   Add optional facts such as `--sga-mb`, `--pga-mb`, `--workarea`, `--xdb`, `--anonymous`, `--apex-free-mb`, `--system-free-mb`, `--software-free-mb`, `--language-count`, `--dev-env`, `--reduced-downtime`, and `--cdb-root` when the user or a DB handoff has already provided them. Do not call DB/ORDS skills just to fill optional facts during the minimal pass.

   For file-only application/workspace migration eligibility:

   ```bash
   node apex/migrations/scripts/app-migration-precheck.mjs <apex_export_file_or_dir> --target-apex <target_apex>
   ```

   Add optional target facts such as `--source-apex`, `--target-ords`, `--rest-enabled-schema`, `--workspace-match`, `--schema-match`, `--alias-match`, `--replace-existing`, `--background-running`, `--export-type`, and `--fresh-install-app-migration` when known. Use this before `static-app-upgrade-scan.mjs` when the user asks whether an exported application can be migrated/imported into a target.
5. Ask once for missing migration inputs:
   - source APEX version, target APEX version, database version/RU, ORDS version;
   - environment name and production status, plus platform type: self-managed, co-managed Cloud, Autonomous AI Database, or APEX Service;
   - CDB/PDB/local APEX placement, runtime-only vs full development environment;
   - outage window, rollback expectation, critical apps, app exports, logs, ORDS details, and test evidence.
6. Read the routed reference only after the minimal gate determines which path is relevant:
   - Upgrade path and pre-checks: `references/upgrade-prechecks.md`
   - Execution orchestration: `references/execution-runbook.md`
   - Rehearsal and production readiness: `references/rehearsal.md`
   - Go/no-go decisions: `references/go-no-go.md`
   - Cutover, regression, post-upgrade: `references/cutover-regression.md`
   - Rollback and revert: `references/rollback-revert.md`
   - Evidence pack and closeout: `references/evidence-pack.md`
   - Application post-upgrade review: `references/application-upgrade.md`
   - Detailed application post-upgrade checklist: `references/post-upgrade-application-review.md`
   - External runbook template: `references/migration-runbook-template.md`
   - Cross-skill boundaries: `references/handoffs.md`
7. Use bundled helpers when they fit the task:
   - `scripts/migration-environment-gate.mjs`: file-only environment gate that allows execution orchestration only for explicitly non-production targets.
   - `scripts/apex-release-path-check.mjs`: file-only source/target path and 26.1 prerequisite gate.
   - `scripts/app-migration-precheck.mjs`: file-only application export eligibility gate before app import/migration planning.
   - `scripts/static-app-upgrade-scan.mjs`: file-only APEX export scan for regression-risk hints.
   - `scripts/apex-upgrade-precheck.sql`: read-only SQL collector for the DB/SQLcl owning workflow. Do not execute it directly from this skill.

## Hard Gates

- Use official Oracle APEX documentation as the authoritative source for current APEX upgrade requirements.
- As of 2026-06-11, Oracle's public APEX documentation and download pages list APEX 26.1 as the current documented release.
- For APEX 26.1 planning, validate that the target database and ORDS versions meet the documented minimums before proposing an upgrade window.
- Direct upgrade to APEX 26.1 is supported only from APEX 18.1 or later. For older releases, plan an intermediate upgrade to APEX 24.2 or a manual export/import migration to a new APEX 26.1 instance.
- For APEX 18.1 or later to APEX 26.1, do not invent an intermediate APEX release unless another documented constraint requires it.
- Keep instance-upgrade support and application portability separate. An unsupported direct instance upgrade can still have an application export/import migration path into a new target instance, but application-only migration does not retain workspace-level configuration.
- For application migration exports, record the chosen export type. Full Export is the migration-oriented export for moving applications across environments, may include application data, and must not be treated as normal source-control content.
- Treat YAML-style exports as legacy input. Prefer current SQL or APEXlang export formats for migration planning and import validation.
- Productive migration execution is not allowed through this skill. If the target is production or production status is unclear, provide planning, readiness checks, and handoff instructions only.
- Non-production execution orchestration requires the user or environment evidence to explicitly identify the target as non-production before any execution runbook phase starts.
- Do not provide runnable `SYS AS SYSDBA` install, upgrade, downgrade, or parameter-change commands as this skill's own execution path. Mark them as DBA/DB-skill work and require explicit user confirmation in the owning workflow.
- Do not run APEX upgrade/import/install scripts automatically. Validation and planning may run, but upgrade execution must require explicit confirmation and the owning execution skill.
- A production migration handoff package must define phase owners, stop criteria, rollback/revert decision points, required evidence, and go/no-go gates before external cutover starts.
- Do not mark a migration complete until required post-upgrade validation evidence is collected or explicitly waived by the user.
- Do not alter APEX files that ship inside the Oracle Database home when the source APEX release came with the database.
- Do not automatically run Application Upgrade Wizard changes, Universal Theme refreshes, compatibility-mode changes, or JavaScript cleanup. Plan and review them here; route actual application changes to APEX Admin or APEXlang as appropriate.

## Output Handling

- For customer-specific migration assessments, ask whether the result should be chat-only or saved externally before creating a report.
- Never write customer-specific exports, plans, findings, paths, app names, or evidence into this skill folder.
- If the user requests an artifact, require a user-confirmed external output directory or exact file path.
- Use `references/migration-runbook-template.md` only as a neutral template. Filled production-readiness runbooks, non-production execution runbooks, and evidence packs must be created outside this skill folder.

## Documentation

Use current official Oracle APEX documentation first. As of 2026-06-11, the current official public documentation checked for this skill is APEX 26.1.

```text
https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/upgrading-from-previous-apex-release.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/apex-installation-requirements.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/maximizing-uptime-during-apex-upgrade.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/upgrading-apex-applications.html
https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/importing-export-files.html
https://blogs.oracle.com/apex/26-1-direct-instance-upgrades-now-require-apex-18-1-or-higher
https://blogs.oracle.com/apex/apexlang-in-practice-export-edit-validate-and-import-oracle-apex-applications
https://www.oracle.com/apex/
https://www.oracle.com/tools/downloads/apex-downloads/
```

Use older documentation only for legacy-version compatibility analysis, and label it as legacy.
