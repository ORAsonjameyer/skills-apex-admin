#!/usr/bin/env node
import process from 'node:process';

const SUPPORT_MATRIX_AS_OF = '2026-06-08';
const CURRENT_OFFICIAL_APEX_DOCS = '26.1';
const SUPPORTED_APEX = new Map([
  ['26.1', { supportEnds: '2027-11', status: 'supported' }],
  ['24.2', { supportEnds: '2027-07', status: 'supported' }],
  ['24.1', { supportEnds: '2026-12', status: 'supported' }],
  ['23.2', { supportEnds: '2026-05', status: 'ended' }]
]);

function usage(exitCode = 0) {
  const text = `
Usage:
  node apex-release-path-check.mjs --source 24.2 --target 26.1 --db 19.18 --ords 26.1.1
  node apex-release-path-check.mjs --source 5.1 --target 26.1 --json

Options:
  --source <version>         Current APEX version, for example 18.1 or 24.2
  --target <version>         Target APEX version, default 26.1, the current official Oracle docs baseline checked on 2026-06-08
  --db <version>             Target database/RU version, for example 19.18 or 23.26.0
  --ords <version>           Target ORDS version, for example 26.1.1
  --sga-mb <number>          Known SGA size in MB
  --pga-mb <number>          Known PGA aggregate target in MB
  --workarea <value>         Known WORKAREA_SIZE_POLICY value
  --dev-env <yes|no>         Full development environment target
  --xdb <installed|missing>  Known XML DB availability
  --anonymous <exists|missing> Known ANONYMOUS account availability
  --software-free-mb <number> Known APEX software staging space in MB
  --full-download <yes|no>   Use 1,178 MB software requirement instead of 670 MB
  --apex-free-mb <number>    Known free MB in target APEX tablespace
  --system-free-mb <number>  Known free MB in SYSTEM tablespace
  --language-count <number>  Additional installed language count
  --reduced-downtime <yes|no> Reduced-downtime upgrade requested
  --cdb-root <yes|no>        APEX is installed in CDB$ROOT
  --json                     Print JSON instead of Markdown
`;
  process.stdout.write(text.trimStart());
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { target: '26.1', json: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') usage(0);
    if (arg === '--json') {
      args.json = true;
      continue;
    }
    if ([
      '--source',
      '--target',
      '--db',
      '--ords',
      '--sga-mb',
      '--pga-mb',
      '--workarea',
      '--dev-env',
      '--xdb',
      '--anonymous',
      '--software-free-mb',
      '--full-download',
      '--apex-free-mb',
      '--system-free-mb',
      '--language-count',
      '--reduced-downtime',
      '--cdb-root'
    ].includes(arg)) {
      args[arg.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.source) throw new Error('Missing required --source version.');
  return args;
}

function normalizeVersion(input) {
  const match = String(input || '').trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) throw new Error(`Invalid version: ${input}`);
  return {
    raw: String(input).trim(),
    major: Number(match[1]),
    minor: Number(match[2] || 0),
    patch: Number(match[3] || 0),
    key: `${Number(match[1])}.${Number(match[2] || 0)}`
  };
}

function compare(a, b) {
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

function optionalNumber(input, name) {
  if (input === undefined) return null;
  const value = Number(input);
  if (!Number.isFinite(value)) throw new Error(`Invalid number for ${name}: ${input}`);
  return value;
}

function checkDbVersion(input) {
  if (!input) return { status: 'unknown', message: 'Target database version/RU was not provided.' };
  const db = normalizeVersion(input);
  if (db.major === 19) {
    return db.minor >= 18
      ? { status: 'pass', message: 'Oracle Database 19c RU gate meets 19.18 or newer.' }
      : { status: 'fail', message: 'APEX 26.1 requires Oracle Database 19c RU 19.18 or newer.' };
  }
  if (db.major === 23) {
    return compare(db, normalizeVersion('23.26.0')) >= 0
      ? { status: 'pass', message: 'Oracle AI Database 26ai gate meets Database Version 23.26.0 or newer.' }
      : { status: 'fail', message: 'On Oracle AI Database 26ai, APEX 26.1 requires Database Version 23.26.0 or newer.' };
  }
  return { status: 'review', message: 'Database version does not match the documented 19c or 26ai target patterns; verify against the current APEX installation requirements.' };
}

function checkOrdsVersion(input) {
  if (!input) return { status: 'unknown', message: 'Target ORDS version was not provided.' };
  const ords = normalizeVersion(input);
  return compare(ords, normalizeVersion('26.1.1')) >= 0
    ? { status: 'pass', message: 'ORDS gate meets 26.1.1 or newer.' }
    : { status: 'fail', message: 'APEX 26.1 requires ORDS 26.1.1 or newer.' };
}

function checkMinimumNumber(input, name, minimum, unit) {
  const value = optionalNumber(input, name);
  if (value === null) return { status: 'unknown', message: `${name} was not provided.` };
  return value >= minimum
    ? { status: 'pass', message: `${name} meets ${minimum} ${unit} or more.` }
    : { status: 'fail', message: `APEX 26.1 requires ${name} of at least ${minimum} ${unit}.` };
}

function checkWorkarea(input) {
  if (!input) return { status: 'unknown', message: 'WORKAREA_SIZE_POLICY was not provided.' };
  return String(input).trim().toUpperCase() === 'AUTO'
    ? { status: 'pass', message: 'WORKAREA_SIZE_POLICY is AUTO.' }
    : { status: 'fail', message: 'WORKAREA_SIZE_POLICY must be AUTO for the APEX installation or upgrade session.' };
}

function checkXdb(args) {
  const devEnv = normalizeBool(args['dev-env']);
  if (devEnv === false) return { status: 'review', message: 'Runtime-only target reported; XML DB requirement depends on target capabilities and should be verified if development features are needed.' };
  if (!args.xdb) return { status: 'unknown', message: 'XML DB availability was not provided.' };
  return String(args.xdb).trim().toLowerCase() === 'installed'
    ? { status: 'pass', message: 'XML DB is reported as installed.' }
    : { status: 'fail', message: 'Oracle XML DB must be installed for a full APEX development environment.' };
}

function checkAnonymous(input) {
  if (!input) return { status: 'unknown', message: 'ANONYMOUS account availability was not provided.' };
  return String(input).trim().toLowerCase() === 'exists'
    ? { status: 'pass', message: 'ANONYMOUS account is reported as present.' }
    : { status: 'fail', message: 'ANONYMOUS must not be dropped because APEX workspace provisioning depends on it.' };
}

function checkDisk(args) {
  const checks = [];
  const fullDownload = normalizeBool(args['full-download']);
  const softwareRequired = fullDownload === true ? 1178 : 670;
  checks.push({
    name: 'software_staging_space',
    ...checkMinimumNumber(args['software-free-mb'], 'APEX software staging space', softwareRequired, 'MB')
  });
  checks.push({
    name: 'apex_tablespace_space',
    ...checkMinimumNumber(args['apex-free-mb'], 'APEX tablespace free space', 260, 'MB')
  });
  checks.push({
    name: 'system_tablespace_space',
    ...checkMinimumNumber(args['system-free-mb'], 'SYSTEM tablespace free space', 128, 'MB')
  });
  const languageCount = optionalNumber(args['language-count'], 'language-count');
  if (languageCount !== null && args['apex-free-mb'] !== undefined) {
    const required = 260 + (languageCount * 60);
    checks.push({
      name: 'language_pack_space',
      ...checkMinimumNumber(args['apex-free-mb'], `APEX tablespace free space for ${languageCount} additional language(s)`, required, 'MB')
    });
  } else {
    checks.push({
      name: 'language_pack_space',
      status: 'unknown',
      message: 'Additional language count and/or APEX tablespace free space was not provided.'
    });
  }
  return checks;
}

function checkReducedDowntime(args) {
  const requested = normalizeBool(args['reduced-downtime']);
  if (requested !== true) return { status: 'review', message: 'Reduced-downtime upgrade was not requested.' };
  const cdbRoot = normalizeBool(args['cdb-root']);
  if (cdbRoot === null) return { status: 'unknown', message: 'Reduced-downtime requested, but CDB$ROOT placement was not provided.' };
  return cdbRoot
    ? { status: 'fail', message: 'Reduced-downtime APEX upgrade is not supported when APEX is installed in CDB$ROOT.' }
    : { status: 'pass', message: 'Reduced-downtime request is not blocked by CDB$ROOT placement.' };
}

function supportInfo(version) {
  const info = SUPPORTED_APEX.get(version.key);
  if (!info) {
    return {
      status: 'unsupported_or_legacy',
      message: `APEX ${version.raw} is not listed in the public support matrix as of ${SUPPORT_MATRIX_AS_OF}. Use only for upgrade-path or legacy compatibility planning.`
    };
  }
  return {
    status: info.status,
    message: `APEX ${version.key} support status as of ${SUPPORT_MATRIX_AS_OF}: ${info.status}, support ends ${info.supportEnds}.`
  };
}

function evaluate(args) {
  const source = normalizeVersion(args.source);
  const target = normalizeVersion(args.target);
  const minDirect = normalizeVersion('18.1');
  const result = {
    asOf: SUPPORT_MATRIX_AS_OF,
    officialDocumentationRelease: CURRENT_OFFICIAL_APEX_DOCS,
    source: source.raw,
    target: target.raw,
    directUpgradeSupported: null,
    path: [],
    gates: [],
    warnings: []
  };

  result.gates.push({ name: 'source_support', ...supportInfo(source) });
  result.gates.push({ name: 'target_support', ...supportInfo(target) });

  if (target.key === '26.1') {
    if (compare(source, minDirect) >= 0) {
      result.directUpgradeSupported = true;
      result.path.push('Direct APEX upgrade to 26.1 is supported for source APEX 18.1 or later.');
    } else {
      result.directUpgradeSupported = false;
      result.path.push('Direct APEX upgrade to 26.1 is not supported for source releases older than 18.1.');
      result.path.push('Plan either an intermediate upgrade to APEX 24.2 and then 26.1, or manually export workspaces/applications and import into a new APEX 26.1 instance.');
    }
    result.gates.push({ name: 'database', ...checkDbVersion(args.db) });
    result.gates.push({ name: 'ords', ...checkOrdsVersion(args.ords) });
    result.gates.push({ name: 'sga', ...checkMinimumNumber(args['sga-mb'], 'SGA', 1200, 'MB') });
    result.gates.push({ name: 'pga', ...checkMinimumNumber(args['pga-mb'], 'PGA', 300, 'MB') });
    result.gates.push({ name: 'workarea_size_policy', ...checkWorkarea(args.workarea) });
    result.gates.push({ name: 'xml_db', ...checkXdb(args) });
    result.gates.push({ name: 'anonymous_account', ...checkAnonymous(args.anonymous) });
    result.gates.push(...checkDisk(args));
    result.gates.push({ name: 'reduced_downtime', ...checkReducedDowntime(args) });
  } else {
    result.path.push('Target is not APEX 26.1; verify the exact path against the target release documentation.');
  }

  if (source.key === '18.1' && target.key === '24.2') {
    result.warnings.push('Oracle documents a 18.1 to 24.2 caution: upgrade to APEX 24.1 first, then to 24.2.');
  }

  return result;
}

function printMarkdown(result) {
  const lines = [
    '# APEX Release Path Check',
    '',
    `- Source APEX: ${result.source}`,
    `- Target APEX: ${result.target}`,
    `- Official docs baseline checked: APEX ${result.officialDocumentationRelease} as of ${result.asOf}`,
    `- Direct upgrade supported: ${result.directUpgradeSupported === null ? 'review target docs' : result.directUpgradeSupported ? 'yes' : 'no'}`,
    '',
    '## Path',
    ...result.path.map((line) => `- ${line}`),
    '',
    '## Gates',
    ...result.gates.map((gate) => `- ${gate.name}: ${gate.status} - ${gate.message}`)
  ];
  if (result.warnings.length) {
    lines.push('', '## Warnings', ...result.warnings.map((line) => `- ${line}`));
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

try {
  const args = parseArgs(process.argv);
  const result = evaluate(args);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    printMarkdown(result);
  }
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n\n`);
  usage(1);
}
