# Workspace Diagnostics

Use this reference when an APEX issue can be investigated from the workspace UI without opening APEX Administration Services. It combines the documented Workspace Administration dashboards, Monitor Activity reports, active-session controls, and browser-assisted reproduction.

This is an APEX-admin diagnostic workflow. It does not replace the APEX Admin Identity Gate for MCP/SQL and does not own generic database, ORDS, SQL tuning, or MLE implementation work.

## Access Boundary

Use the least-privileged authenticated browser identity that can perform the required observation:

- affected end user or comparable test user for application reproduction;
- authorized developer for Developer Toolbar and application debugging;
- workspace administrator for Workspace Administration, dashboards, Monitor Activity, Active Sessions, Debug, and Trace controls.

The browser session does not authorize MCP or SQL access. If database correlation is needed, stop and apply the APEX Admin Identity Gate separately.

## Workspace Dashboard Pass

From the workspace, use Administration > Dashboards and review only the dashboard relevant to the symptom:

- Workspace: workspace, applications, schemas, files, and service requests;
- Users: user status, recently created users, roles, and password status;
- Activity: top users, applications, pages, recent logins, and recent errors;
- Developer Activity: application and page changes;
- Performance: pages with poor page performance;
- Applications: application inventory and activity;
- Database: workspace database-object summary.

Use the dashboard as a compact discovery pass. Do not copy complete reports into chat. Record only the workspace, application, page, time window, counts, and the few findings needed for the next step.

## Monitor Activity Pass

Use Administration > Monitor Activity when the dashboard identifies a time window or application to investigate. Select the smallest relevant report:

- Page Views for traffic, request timing, and application/page usage;
- Developer Activity for application changes and component changes;
- Active Sessions for a current session and session details;
- Page View Analysis for usage trends and weighted page performance;
- Environment for browser and client context;
- Login Attempts for authentication symptoms;
- Application Errors for visible APEX application errors;
- Workspace Schema Reports for APEX workspace mappings and APEX-scoped schema context;
- Web Service Activity Log for APEX outbound web-service activity;
- Archived Activity for historical APEX activity.

Do not turn a workspace schema report into generic database administration. Route users, grants, quotas, tablespaces, and privilege remediation to the DB skill.

## Active Session Debugging

Use Active Sessions only for a narrow investigation with a known workspace, application, page or journey, user, session, and timebox.

1. Identify the target active session.
2. Inspect session details and capture only non-secret correlation facts.
3. Ask for explicit confirmation before enabling Debug or Trace.
4. Prefer the lowest useful debug level. Use Application Trace (LEVEL6) or lower unless Oracle Support directs otherwise.
5. Reproduce the smallest safe user journey.
6. Review the Debug view or relevant error evidence.
7. Disable Debug and Trace after the reproduction.

Debug and Trace can expose SQL, item values, URLs, bind values, component names, and error details. Treat the output as sensitive and record only a redacted summary in the local protocol file.

## Browser-Assisted Correlation

When the application is open in VS Code, Codex, or another browser-capable tool:

- the user signs in manually;
- the browser tool reproduces the issue and inspects visible UI, console messages, and network metadata when available;
- the agent records application/page identifiers, request type, status, timing, and timestamp;
- the workspace dashboard or Monitor Activity report is used to correlate the same period;
- APEX Debug or Trace is enabled only after confirmation and only for the narrow target session.

If the browser tool cannot inspect console or network metadata, limit the result to visible behavior and request a redacted screenshot or HAR. Never request passwords, cookies, session IDs, authorization headers, tokens, or unredacted request bodies.

## Handoff Rules

- AWR, ASH, SQL Monitor, wait events, execution plans, or ORDS pool symptoms: hand off to the DB/ORDS skill.
- MLE JavaScript breakpoints, variables, call stacks, or debug-runner execution: hand off to the MLE skill. The APEX Admin skill may correlate the originating APEX request but does not debug the MLE module itself.
- APEX application generation or application artifact changes: hand off to `apex/apexlang`.
- Persistent application instrumentation or custom dashboard application artifacts: hand off to the owning APEXlang or DB skill.

## Protocol And Output

Before debugging, load `protocol-file.md` and require a user-confirmed local output directory or exact file path. Use a timestamped `apex-browser-debug-protocol-YYYYMMDD-HHMMSS.md` or `apex-debug-protocol-YYYYMMDD-HHMMSS.md` file outside the skill tree.

The protocol must include the environment, workspace/application/page/session scope, identity category, confirmation gates, actions, observations, evidence references, handoffs, and final status. Do not create database logging tables or modify APEX internal, workspace, or application tables for this protocol.

## Sources

- Oracle APEX 26.1, Monitoring Activity Within a Workspace: `https://docs.oracle.com/en/database/oracle/apex/26.1/aeadm/monitoring-activity-within-a-workspace.html`
- Oracle APEX 26.1, Viewing Workspace Dashboards: `https://docs.oracle.com/en/database/oracle/apex/26.1/aeadm/viewing-workspace-dashboards.html`
- Oracle APEX 26.1, Utilizing Debug Mode: `https://docs.oracle.com/en/database/oracle/apex/26.1/htmdb/utilizing-debug-mode.html`
