# Upgrade Path and Pre-Checks

Use this reference for APEX release-upgrade readiness, especially APEX 26.1 target planning.

As of 2026-06-11, Oracle's public APEX documentation and download pages list APEX 26.1 as the current documented release.

## Intake

Collect these facts before planning an upgrade:

- Source APEX version and target APEX version.
- Database version, Release Update, edition, CDB/PDB placement, RAC status, and whether APEX is local or in `CDB$ROOT`.
- ORDS version, ORDS deployment model, static image path, and whether APEX REST modules still use legacy APEX-based REST.
- Full development environment vs runtime-only environment.
- Self-managed, co-managed Cloud, Autonomous AI Database, or APEX Service.
- Tablespaces for APEX platform schema, APEX files schema, temp tablespace, and image virtual directory.
- Installed languages and required language packs.
- Database Vault, XML DB, ANONYMOUS account status, and network-services requirements.
- Critical applications, authentication methods, plugins, JavaScript-heavy pages, PL/SQL-heavy processes, REST integrations, jobs, mail, PDF/reporting, and external credentials.
- Outage window, backup/snapshot plan, revert/rollback expectation, and test environments.

## Official APEX 26.1 Gates

- APEX 26.1 requires Oracle Database 19c with RU 19.18 or newer. On Oracle AI Database 26ai, require at least Database Version 23.26.0.
- APEX 26.1 requires ORDS 26.1.1 or later.
- If another APEX 26.1 page mentions a lower ORDS release while describing how to view the ORDS version, use the Installation Requirements page as the stricter target install/upgrade gate.
- APEX requires SGA at least 1200 MB and PGA at least 300 MB.
- `WORKAREA_SIZE_POLICY` must be `AUTO` for the installation or upgrade session. In a CDB install, it must be system-wide for the install/upgrade window.
- Oracle XML DB must be installed for a full development environment. `ANONYMOUS` must not be dropped because workspace provisioning depends on it.
- Disk-space checks for APEX 26.1: 670 MB for English-only software files, 1,178 MB for full download software files, 260 MB free in the APEX tablespace, 128 MB free in `SYSTEM`, and 60 MB in APEX tablespace for each additional language.
- Database Vault requires additional configuration and may affect workspace provisioning and SQL Workshop.

## Upgrade Path

- If the current APEX release is 18.1 or later, direct upgrade to APEX 26.1 is supported.
- For current APEX release 18.1 or later and target APEX 26.1, keep the planned path direct unless another documented environment constraint changes the plan.
- If the current APEX release is older than 18.1, plan either:
  - upgrade first to APEX 24.2, then upgrade to APEX 26.1; or
  - manually export workspaces and applications, then import them into a new APEX 26.1 instance.
- Keep the prior point scoped: the direct-upgrade limit applies to APEX instance upgrades. Application portability is different; application exports from older APEX releases can still be used for an application migration into a new APEX 26.1 instance.
- If using fresh install plus application migration, record that the approach migrates applications only. Workspace-level configuration must be inventoried and recreated separately.
- If planning a legacy 18.1 to 24.2 intermediate step, account for the documented 24.1-before-24.2 caution.
- If APEX came with the database, do not alter APEX files inside the database Oracle home. Use the downloaded APEX release files from a separate writable directory.

## Bundled Pre-Check Helpers

Use these helpers only within this skill's boundaries:

- `scripts/apex-release-path-check.mjs`: file-only gate for source/target release path and APEX 26.1 prerequisites. It checks required facts that are supplied by the user or by a DB handoff, and marks missing facts as `unknown` instead of loading more skills.
- `scripts/app-migration-precheck.mjs`: file-only gate for application export migration/import eligibility. Use it before the broader static risk scan when the user asks whether an exported app can be migrated into a target APEX release.
- `scripts/static-app-upgrade-scan.mjs`: file-only scan of APEX SQL exports, split exports, or APEXlang files to identify static regression-risk hints. It does not require database access.
- `scripts/apex-upgrade-precheck.sql`: read-only SQL collector for the owning DB/SQLcl workflow. Do not execute this script directly from the migrations skill, and do not use it to make changes.

Before running file-only helpers, say that no database access is needed for that step.

## Token-Saving Minimal Gate

Stay inside this skill for the first pass. Do not load APEX Admin, APEXlang, DB, ORDS, or SQLcl references until the minimal gate proves that a handoff is needed.

For APEX 26.1, the minimal gate should answer:

- Is the source APEX release 18.1 or later for a direct 26.1 upgrade?
- Is the target database at least Oracle Database 19c RU 19.18 or Oracle AI Database 26ai Database Version 23.26.0?
- Is ORDS at least 26.1.1?
- Are SGA and PGA at least 1200 MB and 300 MB when those values are known?
- Is `WORKAREA_SIZE_POLICY` set to `AUTO` for the upgrade window when known?
- For full development environments, is XML DB installed when known?
- Does `ANONYMOUS` exist when known?
- Is documented disk space available for software staging, APEX tablespace, `SYSTEM`, and additional languages when known?
- If reduced downtime is requested, is APEX not installed in `CDB$ROOT`?

If any required known value fails, stop migration planning and route only the failed area to the owning DB/ORDS/platform workflow. If values are unknown, ask for them or provide the read-only DB precheck collector as a DB/SQLcl handoff; do not infer them.

## Pre-Check Buckets

- Version: source APEX, target APEX, database/RU, ORDS, browser support.
- Architecture: CDB/PDB/local APEX, runtime-only vs development, self-managed vs managed service.
- Capacity: tablespace free space, software staging space, language packs, memory settings.
- Security: Database Vault, credentials, authentication schemes, SSO/OAuth/SAML dependencies, workspace provisioning behavior.
- Web tier: ORDS compatibility, static images path, friendly URLs, REST modules, restart method.
- Application risk: compatibility mode, plugins, Universal Theme/template usage, JavaScript-heavy pages, PL/SQL-heavy pages, reports/charts/forms, background jobs, mail, PDF, REST data sources.
- Evidence: application exports, APEX Advisor output, activity/debug logs, ORDS logs, deployment logs, AWR/ASH or SQL Monitor only through DB-skill handoff.
- Application post-upgrade tasks: release notes review, Universal Theme refresh planning, Compatibility Mode review, Application Upgrade Wizard planning, and legacy JavaScript review. See `application-upgrade.md`.

## Application Migration Eligibility

Use `scripts/app-migration-precheck.mjs` for file-only app export checks before import/migration planning:

```bash
node apex/migrations/scripts/app-migration-precheck.mjs <apex_export_file_or_dir> --target-apex 26.1
```

It checks:

- Export source release versus target APEX release. An application export from a newer APEX release must not be planned for import into an older target.
- APEXlang import prerequisites when an APEXlang export is detected: target APEX 26.1-era support, ORDS 26.1.1 or later for App Builder import, and at least one REST-enabled target workspace schema.
- Export type discipline: Standard Export is for day-to-day development and source control; Runtime Export is for runtime environments; Full Export is the cross-environment migration export and may include application data; Custom Export requires the selected options and flashback setting to be recorded.
- Whether workspace, schema, and alias mappings require an installation-context plan when the target does not mirror the source.
- Fresh-install application migration does not retain workspace-level configuration; require a separate workspace configuration inventory.
- Page/component-export alignment risk, because those exports require tighter target application/workspace alignment than full application exports.
- Credentials, remote servers, REST data sources, supporting objects, plug-ins, background process re-import risk, and legacy JavaScript as review gates rather than automatic blockers.
- Legacy YAML-style export input should be treated as review-only. Prefer current SQL or APEXlang exports for migration planning and import validation.

Use `scripts/static-app-upgrade-scan.mjs` after this eligibility check when the next question is regression scope rather than basic import eligibility.

## Sources

- Oracle APEX 26.1 upgrade guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/upgrading-from-previous-apex-release.html`
- Oracle APEX 26.1 requirements: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/apex-installation-requirements.html`
- Oracle APEX 26.1 import guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/importing-export-files.html`
- Oracle APEX blog, direct instance upgrade limits and application migration: `https://blogs.oracle.com/apex/26-1-direct-instance-upgrades-now-require-apex-18-1-or-higher`
- Oracle APEX blog, APEXlang export/import workflow and export types: `https://blogs.oracle.com/apex/apexlang-in-practice-export-edit-validate-and-import-oracle-apex-applications`
- Oracle APEX 26.1 downloads: `https://www.oracle.com/tools/downloads/apex-downloads/`
- Oracle APEX support status: `https://www.oracle.com/apex/`
