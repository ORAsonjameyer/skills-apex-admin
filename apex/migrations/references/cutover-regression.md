# Cutover, Regression, and Post-Upgrade

Use this reference when turning a migration assessment into a non-production execution plan, production-readiness handoff, or validation checklist.

For full non-production execution orchestration or production-readiness planning, use this together with:

- `execution-runbook.md` for non-production phase sequencing and owner handoffs.
- `go-no-go.md` for cutover and acceptance decisions.
- `rehearsal.md` for dry-run expectations.
- `rollback-revert.md` for rollback/revert decision points.
- `evidence-pack.md` for required proof before closeout.

This skill must not coordinate production migration execution. For production, produce readiness, validation, rollback, and handoff materials only.

## Cutover Strategy

Choose one of these strategies:

- Standard one-step upgrade: in non-production, DBA executes the documented `apexins.sql` or `apxrtins.sql` path through the owning DB/platform workflow. For production, provide the handoff plan only.
- Reduced-downtime upgrade: in non-production, DBA executes the documented phased scripts in order. This is not supported when APEX is installed in `CDB$ROOT`. For production, provide the handoff plan only.
- Export/import migration: use when upgrading from releases older than the supported direct-upgrade path, when moving between services, or when a clean target instance is preferred.

For reduced-downtime upgrades, plan around the four phases:

- Phase 1 creates schemas and database objects; end-user runtime is not affected.
- Phase 2 migrates application metadata; development is disabled and new background page processes do not run, but runtime usage is not affected.
- Phase 3 migrates runtime-modified data and switches to the new version; all APEX access is affected.
- Phase 4 migrates additional log and summary data in the background after the switch.

Always plan ORDS/web access disablement, static images deployment, ORDS restart, and user communication around the phase that affects runtime access.

## Regression Scope

Plan regression based on application complexity, size, and count.

Include:

- Critical user journeys and all externally visible entry points.
- Complex pages, especially pages with significant JavaScript, dynamic actions, PL/SQL computations, validations, processes, or custom templates.
- A representative mix of page types: forms, reports, interactive reports/grids, charts, dashboards, modal dialogs, REST-backed pages, and background-job workflows.
- Pages changed by the Application Upgrade Wizard, APEX Advisor, compatibility-mode changes, or manual post-upgrade remediation.
- Authentication, authorization, session timeout, mail, PDF/reporting, REST data sources, AI services, and external integrations.

If compatibility mode changes after upgrade, include the affected application in regression testing.

## Post-Upgrade Validation

Validate:

- APEX Administration Services login and workspace login.
- APEX version and ORDS version.
- Static images load from the expected virtual directory.
- Critical applications open and core workflows complete.
- Activity logs, debug logs, background jobs, mail, REST data sources, web credentials, and PDF/reporting behave as expected.
- Install/upgrade logs in APEX Administration Services show no unresolved phase errors.
- APEX Advisor/Application Upgrade Wizard items are reviewed and either fixed or accepted as known follow-up work.
- Release notes changed behavior, deprecated features, desupported features, and known issues are reviewed for each critical application.
- Universal Theme refresh, Compatibility Mode changes, Application Upgrade Wizard actions, and legacy JavaScript cleanup are planned as explicit application changes, not silently applied during migration planning.

Route workspace operations, runtime monitoring, import validation, and APEX admin evidence collection to `apex/admin/SKILL.md`.
Route application artifact changes, APEXlang generation, validation, or import to `apex/apexlang/SKILL.md`.

## Cleanup and Revert Planning

- Do not remove older APEX schemas immediately after the first successful upgrade.
- Keep older APEX schemas for a few weeks after all environments are upgraded and stable, then remove them through the owning DB/platform workflow.
- If the prior release used separate tablespaces, cleanup may include dropping those tablespaces only after explicit confirmation in the owning DB workflow.
- Revert planning must be explicit before non-production execution or production handoff. Reverting can lose modifications made in the new APEX instance after upgrade.
- Revert/downgrade scripts and public synonym/grant switching are DB/SYSDBA work, not migration-skill execution.
- Use `rollback-revert.md` when the runbook needs explicit rollback triggers, owners, expected data/config loss, and post-rollback validation.
- Use `evidence-pack.md` before declaring migration closeout.

## Sources

- Oracle APEX 26.1 upgrade guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/upgrading-from-previous-apex-release.html`
- Reduced downtime upgrade: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/maximizing-uptime-during-apex-upgrade.html`
- Application upgrades: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/upgrading-apex-applications.html`
