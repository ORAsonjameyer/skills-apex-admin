# Application Post-Upgrade Review

Use this reference after an APEX instance upgrade or when reviewing applications imported from an older APEX release.

## Boundary

This migration skill plans and triages application upgrade work. It does not execute application changes.

Route state-changing application work as follows:

- Application artifact changes, APEXlang generation, validation, or import: `apex/apexlang/SKILL.md`.
- Migration-owned post-upgrade application review planning: `references/post-upgrade-application-review.md`.
- APEX admin execution and evidence collection for App Builder upgrade findings, Advisor evidence, deployment/import validation, activity/debug/page-performance evidence: `apex/admin/SKILL.md`.
- Database grants, schema changes, ORDS, AWR/ASH, SQL Monitor, and SQL execution requiring DBA privileges: DB/ORDS/SQLcl workflow.

## Application Migration Eligibility

Before planning an application import or workspace/application migration from an export, run the file-only eligibility check when an export is available:

```bash
node apex/migrations/scripts/app-migration-precheck.mjs <apex_export_file_or_dir> --target-apex <target_apex>
```

Use optional flags when facts are known: `--source-apex`, `--target-ords`, `--rest-enabled-schema`, `--workspace-match`, `--schema-match`, `--alias-match`, `--replace-existing`, and `--background-running`.

Treat the verdict as:

- `blocked`: do not plan the import until the blocker is resolved, for example an export from a newer APEX release into an older target.
- `review`: migration may be possible, but target mapping, credentials, APEXlang prerequisites, supporting objects, plug-ins, or re-import state need explicit review.
- `allowed`: static eligibility checks did not find a known blocker; still validate in the target APEX/SQLcl import workflow.

## Oracle-Recommended App Review Steps

After upgrading the APEX instance, plan these application-level checks:

- Review the target APEX release notes for changed behavior, deprecated features, desupported features, and known issues.
- Back up or export the application before any state-changing app remediation.
- Refresh Universal Theme only after review and testing.
- Review and, when appropriate, update application Compatibility Mode to the current APEX release.
- Run the Application Upgrade Wizard from App Builder Utilities and review each available upgrade type before applying it.
- Review legacy JavaScript settings, including deprecated or desupported JavaScript functions and jQuery Migrate.
- Run and test the application after each applied change, not only at the end.

## Regression Focus

Include these applications or pages in migration regression scope:

- Applications where Compatibility Mode is changed after upgrade.
- Pages changed by the Application Upgrade Wizard, Universal Theme refresh, Advisor remediation, or manual post-upgrade fixes.
- Pages with significant JavaScript, dynamic actions, PL/SQL computations, validations, processes, custom templates, or plugins.
- Representative forms, reports, interactive reports/grids, charts, dashboards, modal dialogs, REST-backed pages, mail/PDF/reporting flows, AI-enabled pages, and external integrations.

## File-Only Static Export Scan

If the user provides an APEX SQL export, split export folder, or APEXlang export, the first step can be file-only.

Say explicitly:

```text
No database access is needed for this static application migration scan.
```

Then use `scripts/static-app-upgrade-scan.mjs` to identify candidate regression risks. Treat results as static hints only; confirm with APEX Advisor, runtime logs, debug evidence, and test execution through the owning skills.

Use `scripts/app-migration-precheck.mjs` before the static regression-risk scan when the user's first question is whether the app can be migrated/imported into the target.

## Sources

- Oracle APEX 26.1 application upgrade guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/upgrading-apex-applications.html`
- Oracle APEX 26.1 import guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/importing-export-files.html`
- Oracle APEX 26.1 upgrade guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/upgrading-from-previous-apex-release.html`
