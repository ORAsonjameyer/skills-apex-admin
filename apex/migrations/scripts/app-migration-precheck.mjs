#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DOC_BASELINE_AS_OF = '2026-06-11';
const CURRENT_OFFICIAL_APEX = '26.1';
const TEXT_EXTENSIONS = new Set(['.sql', '.apx', '.yaml', '.yml', '.json']);

function usage(exitCode = 0) {
  const text = `
Usage:
  node app-migration-precheck.mjs /path/to/f123.sql --target-apex 26.1
  node app-migration-precheck.mjs /path/to/apexlang-export --target-apex 26.1 --target-ords 26.1.1 --rest-enabled-schema yes
  node app-migration-precheck.mjs /path/to/export --source-apex 24.2 --target-apex 26.1 --json

Options:
  --source-apex <version>          Source/export APEX release override when it cannot be read from files
  --target-apex <version>          Target APEX release, default 26.1
  --target-ords <version>          Target ORDS version, relevant for APEXlang imports
  --rest-enabled-schema <yes|no>   Whether at least one target workspace schema is REST enabled
  --workspace-match <yes|no>       Target workspace name and ID mirror the source export
  --schema-match <yes|no>          Target parsing schema mirrors the source export
  --alias-match <yes|no>           Target application alias can be reused without collision
  --replace-existing <yes|no>      This is a re-import replacing an existing application
  --background-running <yes|no>    Existing background executions are running or queued
  --export-type <type>             Known export type: standard, runtime, full, or custom
  --fresh-install-app-migration <yes|no> App-only migration into a newly installed target
  --json                          Print JSON instead of Markdown
`;
  process.stdout.write(text.trimStart());
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { json: false, 'target-apex': CURRENT_OFFICIAL_APEX };
  const optionsWithValues = new Set([
    '--source-apex',
    '--target-apex',
    '--target-ords',
    '--rest-enabled-schema',
    '--workspace-match',
    '--schema-match',
    '--alias-match',
    '--replace-existing',
    '--background-running',
    '--export-type',
    '--fresh-install-app-migration'
  ]);

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') usage(0);
    if (arg === '--json') {
      args.json = true;
      continue;
    }
    if (optionsWithValues.has(arg)) {
      args[arg.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    if (!args.input) {
      args.input = arg;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.input) throw new Error('Missing input file or directory.');
  return args;
}

function normalizeVersion(input) {
  const match = String(input || '').trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return {
    raw: String(input).trim(),
    major: Number(match[1]),
    minor: Number(match[2] || 0),
    patch: Number(match[3] || 0),
    key: `${Number(match[1])}.${Number(match[2] || 0)}`
  };
}

function compareVersions(a, b) {
  for (const part of ['major', 'minor', 'patch']) {
    if (a[part] > b[part]) return 1;
    if (a[part] < b[part]) return -1;
  }
  return 0;
}

function normalizeBool(input) {
  if (input === undefined) return null;
  const value = String(input).trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(value)) return true;
  if (['no', 'n', 'false', '0'].includes(value)) return false;
  throw new Error(`Invalid yes/no value: ${input}`);
}

function normalizeChoice(input, name, allowed) {
  if (input === undefined) return null;
  const value = String(input).trim().toLowerCase();
  if (allowed.includes(value)) return value;
  throw new Error(`Invalid ${name}: ${input}. Expected one of: ${allowed.join(', ')}`);
}

function collectFiles(inputPath) {
  const stat = fs.statSync(inputPath);
  if (stat.isFile()) return [inputPath];
  if (!stat.isDirectory()) throw new Error(`Input is neither a file nor a directory: ${inputPath}`);

  const files = [];
  const stack = [inputPath];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }
  return files.sort();
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function captureAll(regex, text, max = 20) {
  const values = [];
  for (const match of text.matchAll(regex)) {
    const value = (match[1] || '').replace(/''/g, "'").trim();
    if (value) values.push(value);
    if (values.length >= max) break;
  }
  return uniq(values);
}

function count(regex, text) {
  return [...text.matchAll(regex)].length;
}

function mergeText(files) {
  return files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
}

function detectExportKind(files, text) {
  const hasApxExtension = files.some((file) => path.extname(file).toLowerCase() === '.apx');
  const hasYamlExtension = files.some((file) => ['.yaml', '.yml'].includes(path.extname(file).toLowerCase()));
  const hasApexlangSignal = /\bAPEXlang\b|apex_application:|application:\s*\n\s*(id|name):/i.test(text);
  const hasSqlExportSignal = /wwv_flow_api\.import_begin|wwv_flow_api\.create_flow|prompt\s+--application\//i.test(text);
  const pageOnly = !/wwv_flow_api\.create_flow\s*\(/i.test(text) && /wwv_flow_api\.create_page\s*\(/i.test(text);

  if (hasYamlExtension && !hasApxExtension) return 'deprecated_yaml_export';
  if (hasApxExtension || hasApexlangSignal) return pageOnly ? 'apexlang_or_page_export' : 'apexlang_application_export';
  if (pageOnly) return 'sql_page_or_component_export';
  if (hasSqlExportSignal) return 'sql_application_export';
  return 'unknown_text_export';
}

function detectSourceRelease(text, override) {
  if (override) return normalizeVersion(override);

  const candidates = [
    ...captureAll(/p_release\s*=>\s*'([^']+)'/gi, text),
    ...captureAll(/Exported\s+from\s+APEX\s+([0-9]+(?:\.[0-9]+){1,2})/gi, text),
    ...captureAll(/Oracle\s+APEX\s+export\s+file.*?([0-9]+(?:\.[0-9]+){1,2})/gis, text, 3),
    ...captureAll(/\bAPEX\s+release\s+([0-9]+(?:\.[0-9]+){1,2})/gi, text)
  ];

  return candidates.map(normalizeVersion).find(Boolean) || null;
}

function scan(text, files, args) {
  const source = detectSourceRelease(text, args['source-apex']);
  const target = normalizeVersion(args['target-apex']);
  if (!target) throw new Error(`Invalid target APEX version: ${args['target-apex']}`);

  return {
    docBaselineAsOf: DOC_BASELINE_AS_OF,
    officialDocumentationRelease: CURRENT_OFFICIAL_APEX,
    filesScanned: files.length,
    exportKind: detectExportKind(files, text),
    exportType: args['export-type'] || null,
    sourceApex: source ? source.raw : null,
    targetApex: target.raw,
    targetOrds: args['target-ords'] || null,
    applicationIds: captureAll(/p_flow_id\s*=>\s*(\d+)/gi, text),
    applicationNames: captureAll(/p_name\s*=>\s*'([^']*(?:''[^']*)*)'/gi, text),
    aliases: captureAll(/p_alias\s*=>\s*'([^']*(?:''[^']*)*)'/gi, text),
    workspaceIds: captureAll(/p_default_workspace_id\s*=>\s*(\d+)/gi, text),
    compatibilityModes: captureAll(/p_compatibility_mode\s*=>\s*'([^']+)'/gi, text),
    pageCount: count(/wwv_flow_api\.create_page\s*\(/gi, text),
    pluginCount: count(/wwv_flow_api\.create_plugin\s*\(/gi, text),
    credentialCount: count(/wwv_flow_api\.create_credential\s*\(/gi, text),
    remoteServerCount: count(/wwv_flow_api\.create_remote_server\s*\(/gi, text),
    restDataSourceCount: count(/wwv_flow_api\.create_web_source_module\s*\(/gi, text),
    supportingObjectSignals: count(/\b(supporting objects?|install supporting objects?|create_install_script|create_install_object)\b/gi, text),
    backgroundProcessSignals: count(/\b(background execution|maximum scheduler jobs|execute in background|after submit background|p_execute_in_background)\b/gi, text),
    legacyJsSignals: count(/(\$\.browser\b|\.live\s*\(|\.bind\s*\(|jquery[-.]migrate|apex\.jQuery|\bjQuery\.browser\b|include deprecated|desupported javascript)/gi, text)
  };
}

function gate(status, name, message) {
  return { status, name, message };
}

function evaluate(summary, args) {
  const gates = [];
  const target = normalizeVersion(summary.targetApex);
  const source = summary.sourceApex ? normalizeVersion(summary.sourceApex) : null;
  const isApexlang = summary.exportKind.startsWith('apexlang');
  const isPageOrComponent = summary.exportKind === 'sql_page_or_component_export' || summary.exportKind === 'apexlang_or_page_export';

  if (summary.exportKind === 'unknown_text_export') {
    gates.push(gate('review', 'export_type', 'No full application, page/component, SQL, or APEXlang export signature was detected. Confirm that the input is an APEX export.'));
  }
  if (summary.exportKind === 'deprecated_yaml_export') {
    gates.push(gate('review', 'export_format', 'YAML-style export input was detected. Use current SQL or APEXlang export format for migration planning and import validation.'));
  }

  if (!source) {
    gates.push(gate('review', 'source_release', 'Source/export APEX release was not found in the files. Provide --source-apex or confirm in App Builder.'));
  } else if (compareVersions(source, target) > 0) {
    gates.push(gate('blocked', 'release_direction', `The export appears to come from APEX ${source.raw}, which cannot be imported into older target APEX ${target.raw}.`));
  } else {
    gates.push(gate('pass', 'release_direction', `The target APEX release ${target.raw} is the same as or newer than the detected source/export release ${source.raw}.`));
  }

  if (target.key !== CURRENT_OFFICIAL_APEX) {
    gates.push(gate('review', 'documentation_baseline', `Official Oracle documentation checked on ${DOC_BASELINE_AS_OF} lists ${CURRENT_OFFICIAL_APEX} as the current APEX documentation release. Re-check Oracle docs before relying on target ${target.raw} gates.`));
  } else {
    gates.push(gate('pass', 'documentation_baseline', `Target uses the current official Oracle APEX documentation baseline ${CURRENT_OFFICIAL_APEX} as checked on ${DOC_BASELINE_AS_OF}.`));
  }

  const exportType = normalizeChoice(args['export-type'], 'export-type', ['standard', 'runtime', 'full', 'custom']);
  if (exportType === 'full') {
    gates.push(gate('review', 'export_type_selection', 'Full export is intended for moving applications across environments and may include application data. Keep it out of source control and handle it as sensitive migration evidence.'));
  } else if (exportType === 'runtime') {
    gates.push(gate('review', 'export_type_selection', 'Runtime export targets runtime environments and excludes development/audit/runtime data. Confirm it matches the migration objective.'));
  } else if (exportType === 'custom') {
    gates.push(gate('review', 'export_type_selection', 'Custom export requires the selected granular options and flashback setting to be recorded with the migration evidence.'));
  } else if (exportType === 'standard') {
    gates.push(gate('pass', 'export_type_selection', 'Standard export is suitable for day-to-day development and source-control review, but it excludes runtime data.'));
  }

  const freshInstallAppMigration = normalizeBool(args['fresh-install-app-migration']);
  if (freshInstallAppMigration === true) {
    gates.push(gate('review', 'workspace_configuration', 'Fresh-install application migration moves applications only. Inventory and recreate required workspace-level configuration separately.'));
  }

  if (isApexlang) {
    if (compareVersions(target, normalizeVersion('26.1')) < 0) {
      gates.push(gate('blocked', 'apexlang_target', 'APEXlang application import is a 26.1-era feature; use SQL export or upgrade the target APEX release.'));
    }
    const ords = summary.targetOrds ? normalizeVersion(summary.targetOrds) : null;
    if (!ords) {
      gates.push(gate('review', 'apexlang_ords', 'APEXlang App Builder import requires ORDS 26.1.1 or later; target ORDS was not provided.'));
    } else if (compareVersions(ords, normalizeVersion('26.1.1')) < 0) {
      gates.push(gate('blocked', 'apexlang_ords', `APEXlang App Builder import requires ORDS 26.1.1 or later; target ORDS is ${ords.raw}.`));
    } else {
      gates.push(gate('pass', 'apexlang_ords', `Target ORDS ${ords.raw} meets the APEXlang import gate.`));
    }

    const restEnabled = normalizeBool(args['rest-enabled-schema']);
    if (restEnabled === null) {
      gates.push(gate('review', 'rest_enabled_schema', 'APEXlang App Builder import requires at least one REST-enabled schema in the workspace; status was not provided.'));
    } else if (!restEnabled) {
      gates.push(gate('blocked', 'rest_enabled_schema', 'No REST-enabled workspace schema was reported for APEXlang import.'));
    } else {
      gates.push(gate('pass', 'rest_enabled_schema', 'At least one target workspace schema is reported as REST enabled.'));
    }
  }

  for (const [name, option, message] of [
    ['workspace_mapping', 'workspace-match', 'Target workspace name/ID does not mirror the source export; installation context or remapping must be planned.'],
    ['schema_mapping', 'schema-match', 'Target parsing schema does not mirror the source export; installation context or schema mapping must be planned.'],
    ['alias_mapping', 'alias-match', 'Target application alias cannot be reused as-is; plan alias change or collision handling.']
  ]) {
    const value = normalizeBool(args[option]);
    if (value === false) gates.push(gate('review', name, message));
  }

  if (isPageOrComponent) {
    gates.push(gate('review', 'page_component_export', 'Page/component exports have stricter target alignment needs than full app exports; confirm target application ID and workspace ID before import.'));
  }

  if (summary.credentialCount || summary.remoteServerCount || summary.restDataSourceCount) {
    gates.push(gate('review', 'external_dependencies', 'Credentials, remote servers, or REST data sources were detected. Confirm target credentials, endpoints, ACLs, and ORDS behavior.'));
  }

  if (summary.supportingObjectSignals) {
    gates.push(gate('review', 'supporting_objects', 'Supporting object signals were detected. Review install scripts before enabling supporting object installation.'));
  }

  if (summary.pluginCount) {
    gates.push(gate('review', 'plugins', 'Plug-ins were detected. Verify plug-in compatibility with the target APEX release.'));
  }

  if (summary.legacyJsSignals) {
    gates.push(gate('review', 'legacy_javascript', 'Legacy or deprecated JavaScript signals were detected. Include post-import JavaScript review and regression tests.'));
  }

  const replaceExisting = normalizeBool(args['replace-existing']);
  const backgroundRunning = normalizeBool(args['background-running']);
  if (replaceExisting === true && summary.backgroundProcessSignals) {
    if (backgroundRunning === true) {
      gates.push(gate('blocked', 'background_executions', 'The export appears to contain background-process usage and running/queued executions were reported. Disable or resolve them before replacement.'));
    } else if (backgroundRunning === null) {
      gates.push(gate('review', 'background_executions', 'The export appears to contain background-process usage. Confirm whether running or queued executions exist before replacing the app.'));
    } else {
      gates.push(gate('pass', 'background_executions', 'Background-process signals were found, but no running or queued executions were reported.'));
    }
  }

  const verdict = gates.some((item) => item.status === 'blocked')
    ? 'blocked'
    : gates.some((item) => item.status === 'review')
      ? 'review'
      : 'allowed';

  return { verdict, gates };
}

function printMarkdown(input, summary, evaluation) {
  const lines = [
    '# APEX Application Migration Pre-Check',
    '',
    'No database access is needed for this static application migration pre-check.',
    '',
    `- Input: ${input}`,
    `- Files scanned: ${summary.filesScanned}`,
    `- Export kind: ${summary.exportKind}`,
    `- Export type: ${summary.exportType || 'not provided'}`,
    `- Source/export APEX: ${summary.sourceApex || 'not found'}`,
    `- Target APEX: ${summary.targetApex}`,
    `- Verdict: ${evaluation.verdict}`,
    `- Applications: ${summary.applicationIds.join(', ') || 'not found'}`,
    `- Aliases: ${summary.aliases.join(', ') || 'not found'}`,
    `- Compatibility modes: ${summary.compatibilityModes.join(', ') || 'not found'}`,
    '',
    '## Gates',
    ...evaluation.gates.map((item) => `- ${item.name}: ${item.status} - ${item.message}`),
    '',
    'Treat this as static evidence only. Final import readiness must be confirmed in the target APEX/SQLcl workflow with the target workspace, schema mappings, credentials, and import logs.'
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

try {
  const args = parseArgs(process.argv);
  const input = path.resolve(args.input);
  const files = collectFiles(input);
  if (!files.length) throw new Error('No text export files found to scan.');
  const text = mergeText(files);
  const summary = scan(text, files, args);
  const evaluation = evaluate(summary, args);

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ input, ...summary, verdict: evaluation.verdict, gates: evaluation.gates }, null, 2)}\n`);
  } else {
    printMarkdown(input, summary, evaluation);
  }
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n\n`);
  usage(1);
}
