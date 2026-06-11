set echo off
set feedback on
set heading on
set pagesize 200
set linesize 220
set trimspool on
set serveroutput on
whenever sqlerror continue

prompt === APEX migration pre-check: context ===
select
    sys_context('USERENV', 'DB_NAME') as db_name,
    sys_context('USERENV', 'CON_NAME') as con_name,
    sys_context('USERENV', 'CURRENT_USER') as current_user
from dual;

prompt === Database version ===
select banner_full
from v$version
where banner_full like 'Oracle Database%';

prompt === APEX and XML DB registry ===
select comp_id, comp_name, version, status
from dba_registry
where comp_id in ('APEX', 'XDB')
order by comp_id;

prompt === APEX release view ===
select version_no
from apex_release;

prompt === Memory and workarea parameters ===
select name, display_value
from v$parameter
where name in (
    'memory_target',
    'sga_target',
    'pga_aggregate_target',
    'workarea_size_policy'
)
order by name;

prompt === APEX schemas and ANONYMOUS account ===
select username, account_status, created
from dba_users
where username = 'ANONYMOUS'
   or username like 'APEX\_%' escape '\'
order by username;

prompt === Tablespace usage summary ===
select tablespace_name, used_percent
from dba_tablespace_usage_metrics
order by used_percent desc;

prompt === APEX workspace and application counts ===
select count(*) as workspace_count
from apex_workspaces;

select count(*) as application_count
from apex_applications;

prompt === APEX applications by compatibility mode ===
select compatibility_mode, count(*) as application_count
from apex_applications
group by compatibility_mode
order by compatibility_mode;

prompt === APEX application inventory for regression planning ===
select workspace, application_id, application_name, alias, compatibility_mode
from apex_applications
order by workspace, application_id;

prompt === APEX plugins by application ===
select workspace, application_id, application_name, count(*) as plugin_count
from apex_appl_plugins
group by workspace, application_id, application_name
order by workspace, application_id;

prompt === APEX REST data source inventory ===
select workspace, application_id, application_name, module_name
from apex_appl_web_src_modules
order by workspace, application_id, module_name;

prompt === End of read-only APEX migration pre-check ===
