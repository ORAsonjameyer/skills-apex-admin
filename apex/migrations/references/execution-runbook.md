# Migration Execution Runbook

Use this reference when the user asks to perform, coordinate, run, or drive an APEX migration in a non-production environment.

For production, use this reference only to create a readiness plan or handoff package. Do not coordinate production execution.

## Commander Contract

The migrations skill can coordinate a real migration only when the target environment is explicitly non-production. It does not execute state-changing work itself.

It owns:

- Phase sequencing and runbook control.
- Owner routing for DB, ORDS, APEX Admin, APEXlang, platform, and test work.
- Readiness, rehearsal, go/no-go, cutover, validation, rollback/revert, and closeout gates.
- Evidence requests and evidence review.
- Stop/proceed recommendations.
- Production-readiness planning and external handoff packaging.

It does not own:

- Productive migration execution or live production cutover coordination.
- Running APEX install, upgrade, downgrade, or import scripts.
- Changing database parameters, tablespaces, users, grants, backups, snapshots, or restores.
- Upgrading ORDS, deploying static images, restarting web tiers, or tuning pools.
- Importing APEX applications or APEXlang artifacts.
- Applying Universal Theme refreshes, Compatibility Mode changes, Application Upgrade Wizard actions, Advisor fixes, or application artifact changes.

## Environment Gate

Before execution orchestration starts, classify the target environment:

- Allowed: development, test, QA, UAT, staging, sandbox, training, demo, rehearsal, or another target explicitly confirmed as non-production.
- Blocked: production, live, customer-facing production, business-critical production, or unclear production status.

If the target is production or unclear, stop execution orchestration and produce only:

- Readiness assessment.
- Go/no-go recommendation.
- Evidence requirements.
- Owner handoff package.
- External production runbook template.

Use the bundled helper when the environment facts are available:

```bash
node apex/migrations/scripts/migration-environment-gate.mjs --environment <env_name> --production-status <non-production|production|unknown> --intent execution
```

## Phase Model

Use these phases for non-production execution runbooks and production-readiness handoff plans:

1. Assess: classify migration type, source/target releases, environment, critical apps, outage expectation, rollback expectation, and known blockers.
2. Pre-check: run file-only gates and request DB/ORDS/APEX Admin evidence for live facts.
3. Design: choose migration path, reduced-downtime option if applicable, app migration strategy, owners, and acceptance criteria.
4. Rehearse: run the migration in a representative non-production environment and collect timing plus defects.
5. Freeze: lock scope, freeze app changes where needed, confirm backups/exports, confirm owner availability, and confirm communication plan.
6. Execute: for non-production only, hand off each state-changing step to the owning workflow and record start, finish, status, evidence, and next action. For production, replace this with external owner handoff.
7. Validate: run instance, ORDS, workspace, application, integration, and post-upgrade checks.
8. Stabilize: monitor logs, background jobs, activity, performance, integrations, and user-reported issues.
9. Close: collect evidence pack, record accepted risks, record follow-ups, and declare completion only after required evidence is present or waived.

## Handoff Block

For each state-changing action, produce a handoff block instead of running the action:

```text
Phase:
Owner:
Action:
Inputs required:
Approval required:
Stop criteria:
Expected evidence:
Return result:
Next migration step:
```

## Execution Loop

For every phase:

1. State the current phase and objective.
2. List required inputs and evidence.
3. Identify the owning skill or human owner.
4. Stop if a hard gate is missing or failed.
5. After the owner returns evidence, classify the result as `pass`, `review`, or `blocked`.
6. Update the runbook and choose the next phase.

## Stop Conditions

Stop the migration runbook when:

- A documented hard gate fails.
- The target environment is production or unclear and the user asks this skill to drive execution.
- Backup, restore, snapshot, or rollback expectation is missing for the target environment.
- A state-changing action is requested without explicit confirmation in the owning workflow.
- A phase owner or required access is missing.
- Live evidence contradicts the planned path.
- The target application identity, workspace, schema mapping, ORDS path, or static image path is ambiguous.
- Required validation fails and no accepted-risk waiver exists.

## Completion Rule

Do not call the migration complete until:

- The selected migration path completed.
- For execution orchestration, the target environment was explicitly non-production.
- Post-upgrade validation passed or each failure is recorded as accepted risk.
- Rollback/revert window status is documented.
- Evidence pack is complete.
- Open follow-ups have owners and target dates.
