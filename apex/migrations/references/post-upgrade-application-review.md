# APEX Post-Upgrade Application Review

Use this reference after an APEX instance upgrade, after importing an application exported from an older APEX release, or when a migration handoff asks for post-upgrade application review planning.

This is migration-owned planning and triage. State-changing APEX administration work remains outside this skill.

## Scope

This reference owns:

- Reviewing APEX application metadata and App Builder upgrade findings.
- Planning Universal Theme refresh, Compatibility Mode review, Application Upgrade Wizard actions, and legacy JavaScript review.
- Collecting APEX-native evidence before and after post-upgrade changes.
- Requiring explicit confirmation before state-changing application actions.

This reference does not own:

- Database/ORDS prerequisites, SYSDBA execution, backups, restore, or reduced-downtime upgrade execution. Route those to the DB/ORDS workflow.
- Generating or materially changing `.apx` or APEX application artifacts. Route those changes to `apex/apexlang/SKILL.md`.
- Executing APEX admin changes, import validation, Advisor runs, activity/debug/page-performance evidence collection, or workspace administration. Route those to `apex/admin/SKILL.md`.
- Generic database grants, schemas, SQL tuning, AWR/ASH, SQL Monitor, ORDS pool diagnostics, or platform work. Route those to the relevant DB/ORDS workflow.

## Required Gate

Live MCP-backed checks or changes must use the confirmed APEX admin identity from `apex/admin/SKILL.md`.

Before state-changing post-upgrade work, require:

- Target workspace, application ID, application name, and current Compatibility Mode.
- Confirmation that an export or backup exists.
- A list of planned actions and affected applications.
- Explicit user confirmation for the exact action.

Do not silently run Universal Theme refresh, Compatibility Mode changes, Application Upgrade Wizard actions, Advisor remediations, or JavaScript cleanup.

## Review Checklist

For each target application:

- Review the target APEX release notes for changed behavior, deprecated features, desupported features, and known issues that apply to the application.
- Check the current Compatibility Mode and decide whether it should remain unchanged for first cutover or be updated after remediation and regression testing.
- Review whether Universal Theme can be refreshed and whether custom templates, theme roller changes, or template overrides raise risk.
- Open and review Application Upgrade Wizard findings. Treat each available upgrade as a planned change, not an automatic action.
- Review old JavaScript usage, including jQuery Migrate, deprecated APIs, direct DOM assumptions, custom plug-ins, and JavaScript embedded in page attributes, dynamic actions, templates, or static files.
- Run APEX Advisor where appropriate and record findings as review evidence.
- Build regression scope for any app changed by Compatibility Mode, Universal Theme refresh, Application Upgrade Wizard, Advisor remediation, or manual post-upgrade fixes.

## Safe Inventory Queries

Inspect column availability in the target APEX release before relying on version-specific columns:

```sql
SELECT column_name
FROM apex_dictionary
WHERE apex_view_name = 'APEX_APPLICATIONS'
  AND column_name IN ('APPLICATION_ID', 'APPLICATION_NAME', 'ALIAS', 'COMPATIBILITY_MODE', 'THEME_NUMBER')
ORDER BY column_name;
```

Then collect application inventory with only available columns:

```sql
SELECT workspace,
       application_id,
       application_name,
       alias,
       compatibility_mode
FROM apex_applications
WHERE workspace = :workspace_name
ORDER BY application_id;
```

Use App Builder, APEX Advisor, Activity Log, Debug, Page Performance, and export review as the preferred evidence surfaces. Do not query internal APEX repository tables directly.

## State-Changing Actions

For any planned Universal Theme refresh, Compatibility Mode change, Application Upgrade Wizard action, or JavaScript remediation:

1. List the target application and current state.
2. Confirm export or backup evidence exists.
3. State why the change is required and what regression scope it creates.
4. Ask for explicit confirmation.
5. Apply the smallest change through the supported APEX UI/API path or route artifact changes to APEXlang.
6. Validate immediately with focused application tests and APEX-native evidence.

If the application behavior changes after Compatibility Mode is updated, treat that as a migration regression until confirmed otherwise.

## Sources

- Oracle APEX 26.1 application upgrade guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/upgrading-apex-applications.html`
- Oracle APEX 26.1 release notes: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmrn/`
- Oracle APEX 26.1 migration guide: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmig/`
