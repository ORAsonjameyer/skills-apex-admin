# APEX Migration Runbook Template

Use this as a neutral template only. Do not fill customer-specific values inside this skill folder.

## 1. Summary

```text
Migration name:
Migration type:
Runbook type: non-production execution | production-readiness handoff
Source environment:
Target environment:
Target production status: non-production | production | unclear
Source APEX:
Target APEX:
Database/RU:
ORDS:
Primary owner:
Cutover window:
Rollback owner:
Business approver:
```

## 2. Scope

```text
In scope:
Out of scope:
Critical applications:
Critical workspaces:
External integrations:
Runtime-only or full development target:
```

## 3. Path

```text
Selected path:
Reason:
Reduced downtime: yes | no
Application export/import migration: yes | no
Fresh install plus app migration: yes | no
Known constraints:
```

## 4. Pre-Checks

```text
Release path gate:
Database gate:
ORDS gate:
Memory gate:
Tablespace/software space gate:
XML DB / ANONYMOUS gate:
Application migration eligibility:
Workspace configuration inventory:
Open blockers:
```

## 5. Rehearsal

```text
Rehearsal environment:
Rehearsal date:
Result:
Measured duration:
Defects found:
Production runbook changes:
Waivers:
```

## 6. Go/No-Go

```text
Decision: go | go_with_risk | no_go | hold
Decision owner:
Evidence reviewed:
Accepted risks:
Next action:
```

## 7. Execution Plan

For each non-production execution phase, or each production handoff phase:

```text
Phase:
Owner:
Action:
Execution allowed in this skill: yes | no
Inputs:
Approval:
Stop criteria:
Expected evidence:
Status:
```

## 8. Validation Plan

```text
APEX version validation:
ORDS version validation:
Static images validation:
Administration Services login:
Workspace login:
Critical app smoke tests:
Authentication/authorization:
Mail:
REST/data sources:
PDF/reporting:
Jobs/background executions:
AI services:
Performance checks:
Advisor/Application Upgrade Wizard review:
```

## 9. Rollback/Revert

```text
Rollback strategy:
Last safe decision point:
Authorization owner:
Expected duration:
Expected data/config loss:
Rollback validation:
```

## 10. Evidence Pack

```text
Evidence location:
Missing evidence:
Waived evidence:
Follow-ups:
Closeout owner:
```

## 11. Closeout

```text
Final status:
Rollback window status:
Old APEX schema cleanup decision:
Accepted risks:
Follow-up owners:
Completion approval:
```
