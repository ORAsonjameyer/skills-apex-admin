# Handoffs

Use this reference to avoid duplicating adjacent skills.

## APEX Admin

Route to `apex/admin/SKILL.md` for:

- APEX admin identity gate and supported-version gate.
- Workspace inventory, provisioning, schema mapping, users, and removal.
- APEX deployment/import review, export risk, promotion, patching, and post-deploy validation.
- APEX activity logs, debug logs, page performance, background jobs, AI token monitoring, and runtime evidence.
- APEX-specific security reviews.

Use this handoff text:

```text
APEX admin skill in use: apex/admin/SKILL.md for APEX workspace, deployment, monitoring, or admin validation. The migrations skill is being used only for upgrade orchestration and migration planning.
```

## APEXlang

Route to `apex/apexlang/SKILL.md` for:

- Creating, generating, validating, importing, or materially changing `.apx` or APEX application artifacts.
- Compiler-backed APEXlang validation and import choices.
- Application artifact remediation that changes the app definition rather than only planning migration risk.
- Post-upgrade remediation that changes application definitions, including generated APEXlang changes.

Use this handoff text:

```text
APEXlang skill in use: apex/apexlang/SKILL.md for APEX application artifacts. The migrations skill is being used only for migration readiness and upgrade planning.
```

## DB, ORDS, SQLcl, and Platform

Route out of this skill for:

- Running `apexins.sql`, `apxrtins.sql`, phased upgrade scripts, `apxdwngrd.sql`, or any `SYS AS SYSDBA` step.
- Database parameter changes such as `WORKAREA_SIZE_POLICY`, memory settings, tablespace creation, backups, snapshots, restore, Data Pump, grants, synonyms, or cleanup of old APEX schemas.
- ORDS installation, ORDS upgrade, ORDS pool/runtime tuning, static-file deployment, and web-server restart automation.
- AWR, ASH, SQL Monitor, wait events, execution plans, and generic performance interpretation.

Use this handoff text:

```text
DB/ORDS skill in use for database, ORDS, SQLcl, or SYSDBA execution. The migrations skill is being used only for APEX migration planning and validation routing.
```

## Safety

- Do not silently reuse an APEX admin connection for DB or ORDS work.
- Do not place passwords in chat, scripts, MCP SQL calls, examples, or skill files.
- Do not run state-changing migration execution automatically. Planning and validation may proceed; execution requires explicit user confirmation in the owning workflow.
