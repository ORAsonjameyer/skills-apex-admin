# Go/No-Go Decision Standard

Use this reference before non-production rehearsals/cutovers, production-readiness handoffs, post-upgrade acceptance, and rollback/revert decisions.

This skill may recommend production go/no-go status, but it must not coordinate production execution.

## Decision States

- `go`: all hard gates pass and review items are accepted.
- `go_with_risk`: no hard blockers, but review items remain with explicit owner and acceptance.
- `no_go`: one or more hard blockers exist.
- `hold`: facts are missing and the decision cannot be made yet.

## Environment Decision Gate

- Non-production execution can proceed only when the environment is explicitly identified as non-production.
- Production decisions are readiness recommendations and handoff outputs only.
- If production status is unclear, classify the decision as `hold` for execution and request environment confirmation.

## Hard No-Go Gates

Classify as `no_go` when any of these apply:

- Source and target APEX release path is unsupported or unknown.
- Target database, ORDS, memory, tablespace, XML DB, or required account facts fail documented APEX gates.
- Backup, snapshot, restore, or rollback plan is missing.
- The user asks this skill to coordinate production execution.
- Environment production status is unclear for an execution run.
- Reduced-downtime upgrade is planned in an unsupported topology.
- Application export comes from a newer APEX release than the target.
- APEXlang import is planned without required ORDS and REST-enabled workspace schema facts.
- Target workspace, parsing schema, application alias, or application ID mapping is ambiguous.
- Required workspace-level configuration for app-only migration is not inventoried.
- Static images, ORDS restart method, or web access disablement/enablement plan is missing.
- Critical application smoke tests are undefined.
- Rehearsal failed and no explicit waiver exists.
- Required owners are unavailable for the cutover window.

## Review Gates

Classify as `go_with_risk` only when these have owner, mitigation, and acceptance:

- Unknown optional capacity or language-pack facts.
- Legacy JavaScript, plug-ins, custom templates, Universal Theme refresh, or Compatibility Mode changes.
- External dependencies such as SSO, OAuth, SAML, mail, PDF/reporting, REST data sources, web credentials, jobs, AI services, or network ACLs.
- Custom export options, supporting object install scripts, or application data included in migration export.
- Performance risk without comparable rehearsal timings.
- Post-upgrade application review items planned as follow-up work.

## Decision Record

Record each decision in this shape:

```text
Decision point:
Decision: go | go_with_risk | no_go | hold
Scope:
Environment:
Required evidence reviewed:
Hard gates:
Review gates:
Accepted risks:
Owner approving:
Timestamp:
Next action:
```

## Cutover Rule

Non-production cutover requires `go` or `go_with_risk`. If the decision is `go_with_risk`, list the exact accepted risks in the user-facing response before moving to execution handoffs.

Production cutover decisions may be documented as readiness recommendations, but execution must be handed off outside this skill.
