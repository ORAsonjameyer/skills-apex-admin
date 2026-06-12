---
name: migrations
description: Oracle APEX migration and upgrade planning for APEX release upgrades, pre-checks, cutover strategy, regression scope, post-upgrade validation, and handoff routing. Use when Codex needs to assess or plan an APEX instance upgrade, APEX release migration, workspace/application migration readiness, or APEX upgrade risk without duplicating APEX admin, APEXlang, DB, ORDS, or SQLcl execution guidance.
---

# Oracle APEX Migrations

Use this skill for APEX migration and release-upgrade planning. Keep it as the orchestration layer: identify scope, choose the supported upgrade path, assemble pre-checks, plan cutover and validation, and route execution work to the owning skill.

## Scope

This skill owns:

- APEX release-upgrade readiness and migration planning.
- Source and target release assessment.
- APEX-specific pre-check inventory.
- Cutover, downtime, rollback/revert, and post-upgrade validation planning.
- Regression-test scope for upgraded APEX applications.
- File-only static scans of APEX application exports for migration-risk triage.
- Handoff decisions for APEX Admin, APEXlang, DB, ORDS, and SQLcl work.

This skill does not own:

- Generating or materially changing APEX application artifacts. Route to `apex/apexlang/SKILL.md`.
- Routine APEX administration, workspace lifecycle, imports, monitoring, or security checks. Route to `apex/admin/SKILL.md`.
- Running APEX install/upgrade SQL scripts, changing database parameters, managing tablespaces, AWR/ASH, ORDS runtime tuning, database upgrades, or SYSDBA work. Route to the relevant DB, platform, ORDS, or SQLcl skill/runbook.

## Start Order

1. Classify the request:
   - `release_upgrade`: existing APEX instance to a newer APEX release.
   - `instance_migration`: move APEX instance/workspaces/apps to another database or service.
   - `application_migration`: app/workspace migration without platform upgrade.
   - `compatibility_review`: assess app/export readiness for a target release.
2. If the task is file-only or planning-only, say that no database access is needed for that step.
3. Run the minimal prerequisite gate before loading broader references when source/target facts are available.

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
4. Ask once for missing migration inputs:
   - source APEX version, target APEX version, database version/RU, ORDS version;
   - environment type: self-managed, co-managed Cloud, Autonomous AI Database, or APEX Service;
   - CDB/PDB/local APEX placement, runtime-only vs full development environment;
   - outage window, rollback expectation, critical apps, app exports, logs, ORDS details, and test evidence.
5. Read the routed reference only after the minimal gate determines which path is relevant:
   - Upgrade path and pre-checks: `references/upgrade-prechecks.md`
   - Cutover, regression, post-upgrade: `references/cutover-regression.md`
   - Application post-upgrade review: `references/application-upgrade.md`
   - Detailed application post-upgrade checklist: `references/post-upgrade-application-review.md`
   - Cross-skill boundaries: `references/handoffs.md`
6. Use bundled helpers when they fit the task:
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
- Do not provide runnable `SYS AS SYSDBA` install, upgrade, downgrade, or parameter-change commands as this skill's own execution path. Mark them as DBA/DB-skill work and require explicit user confirmation in the owning workflow.
- Do not run APEX upgrade/import/install scripts automatically. Validation and planning may run, but upgrade execution must require explicit confirmation and the owning execution skill.
- Do not alter APEX files that ship inside the Oracle Database home when the source APEX release came with the database.
- Do not automatically run Application Upgrade Wizard changes, Universal Theme refreshes, compatibility-mode changes, or JavaScript cleanup. Plan and review them here; route actual application changes to APEX Admin or APEXlang as appropriate.

## Output Handling

- For customer-specific migration assessments, ask whether the result should be chat-only or saved externally before creating a report.
- Never write customer-specific exports, plans, findings, paths, app names, or evidence into this skill folder.
- If the user requests an artifact, require a user-confirmed external output directory or exact file path.

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
