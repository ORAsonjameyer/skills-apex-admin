#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const TEXT_EXTENSIONS = new Set(['.sql', '.apx', '.yaml', '.yml', '.json', '.md']);

function usage(exitCode = 0) {
  const text = `
Usage:
  node static-app-upgrade-scan.mjs /path/to/f123.sql
  node static-app-upgrade-scan.mjs /path/to/split-export --json

Options:
  --json    Print JSON instead of Markdown
`;
  process.stdout.write(text.trimStart());
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { json: false, input: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') usage(0);
    if (arg === '--json') {
      args.json = true;
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

function count(regex, text) {
  return [...text.matchAll(regex)].length;
}

function values(regex, text, max = 12) {
  const found = [];
  for (const match of text.matchAll(regex)) {
    const value = (match[1] || '').replace(/''/g, "'").trim();
    if (value && !found.includes(value)) found.push(value);
    if (found.length >= max) break;
  }
  return found;
}

function scanText(text) {
  return {
    applicationIds: values(/p_flow_id\s*=>\s*(\d+)/gi, text),
    applicationNames: values(/p_name\s*=>\s*'([^']*(?:''[^']*)*)'/gi, text),
    aliases: values(/p_alias\s*=>\s*'([^']*(?:''[^']*)*)'/gi, text),
    compatibilityModes: values(/p_compatibility_mode\s*=>\s*'([^']+)'/gi, text),
    themeIds: values(/p_theme_id\s*=>\s*(\d+)/gi, text),
    createFlowCount: count(/wwv_flow_api\.create_flow\s*\(/gi, text),
    pageCount: count(/wwv_flow_api\.create_page\s*\(/gi, text),
    processCount: count(/wwv_flow_api\.create_page_process\s*\(/gi, text),
    computationCount: count(/wwv_flow_api\.create_page_computation\s*\(/gi, text),
    dynamicActionCount: count(/wwv_flow_api\.create_page_da_event\s*\(/gi, text),
    pluginCount: count(/wwv_flow_api\.create_plugin\s*\(/gi, text),
    authenticationCount: count(/wwv_flow_api\.create_authentication\s*\(/gi, text),
    authorizationCount: count(/wwv_flow_api\.create_security_scheme\s*\(/gi, text),
    restDataSourceCount: count(/wwv_flow_api\.create_web_source_module\s*\(/gi, text),
    webCredentialCount: count(/wwv_flow_api\.create_credential\s*\(/gi, text),
    mailUsageCount: count(/\bAPEX_MAIL\b/gi, text),
    pdfOrPrintSignals: count(/\b(print|pdf|xsl-fo|bi publisher|jasper)\b/gi, text),
    aiSignals: count(/\b(APEX_AI|AI service|create_ai|generative ai|agent)\b/gi, text),
    legacyJsSignals: count(/(\$\.browser\b|\.live\s*\(|\.bind\s*\(|jquery[-.]migrate|apex\.jQuery|\bjQuery\.browser\b)/gi, text),
    deprecatedJsSettings: count(/(include deprecated|desupported javascript|jquery migrate|p_javascript_file_urls)/gi, text)
  };
}

function mergeScans(scans) {
  const merged = {
    filesScanned: scans.length,
    applicationIds: [],
    applicationNames: [],
    aliases: [],
    compatibilityModes: [],
    themeIds: []
  };
  const numericKeys = [
    'createFlowCount',
    'pageCount',
    'processCount',
    'computationCount',
    'dynamicActionCount',
    'pluginCount',
    'authenticationCount',
    'authorizationCount',
    'restDataSourceCount',
    'webCredentialCount',
    'mailUsageCount',
    'pdfOrPrintSignals',
    'aiSignals',
    'legacyJsSignals',
    'deprecatedJsSettings'
  ];

  for (const key of numericKeys) merged[key] = 0;
  for (const scan of scans) {
    for (const key of ['applicationIds', 'applicationNames', 'aliases', 'compatibilityModes', 'themeIds']) {
      for (const value of scan[key]) {
        if (!merged[key].includes(value)) merged[key].push(value);
      }
    }
    for (const key of numericKeys) merged[key] += scan[key];
  }
  return merged;
}

function risks(summary) {
  const items = [];
  if (summary.compatibilityModes.length) {
    items.push(`Compatibility mode present: ${summary.compatibilityModes.join(', ')}. If changed after upgrade, include the app in regression testing.`);
  } else {
    items.push('Compatibility mode not found in scanned files; confirm in App Builder or APEX dictionary views.');
  }
  if (summary.legacyJsSignals || summary.deprecatedJsSettings) {
    items.push('Legacy/deprecated JavaScript signals found. Review jQuery Migrate and deprecated/desupported JavaScript settings.');
  }
  if (summary.pluginCount) items.push('Plugins found. Verify plugin compatibility with the target APEX release.');
  if (summary.dynamicActionCount || summary.processCount || summary.computationCount) {
    items.push('Dynamic actions and PL/SQL logic found. Include complex pages in regression testing.');
  }
  if (summary.restDataSourceCount || summary.webCredentialCount) {
    items.push('REST data sources or web credentials found. Validate credentials, endpoints, and ORDS behavior after upgrade.');
  }
  if (summary.mailUsageCount) items.push('APEX_MAIL usage found. Validate mail configuration and representative mail flows.');
  if (summary.pdfOrPrintSignals) items.push('PDF/print/reporting signals found. Validate print server/reporting integration.');
  if (summary.aiSignals) items.push('AI-related signals found. Route AI token and runtime checks to apex/admin monitoring.');
  return items;
}

function printMarkdown(input, summary) {
  const lines = [
    '# Static APEX Application Upgrade Scan',
    '',
    'No database access is needed for this static scan.',
    '',
    `- Input: ${input}`,
    `- Files scanned: ${summary.filesScanned}`,
    `- Application IDs: ${summary.applicationIds.join(', ') || 'not found'}`,
    `- Application names: ${summary.applicationNames.join(', ') || 'not found'}`,
    `- Aliases: ${summary.aliases.join(', ') || 'not found'}`,
    `- Compatibility modes: ${summary.compatibilityModes.join(', ') || 'not found'}`,
    `- Pages: ${summary.pageCount}`,
    `- Dynamic actions: ${summary.dynamicActionCount}`,
    `- Page processes: ${summary.processCount}`,
    `- Page computations: ${summary.computationCount}`,
    `- Plugins: ${summary.pluginCount}`,
    `- REST data sources: ${summary.restDataSourceCount}`,
    `- Web credentials: ${summary.webCredentialCount}`,
    '',
    '## Regression Hints',
    ...risks(summary).map((risk) => `- ${risk}`),
    '',
    'Treat this as static evidence only. Confirm with APEX Advisor, runtime logs, debug evidence, and application tests.'
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

try {
  const args = parseArgs(process.argv);
  const input = path.resolve(args.input);
  const files = collectFiles(input);
  const scans = files.map((file) => scanText(fs.readFileSync(file, 'utf8')));
  const summary = mergeScans(scans);
  if (args.json) {
    process.stdout.write(`${JSON.stringify({ input, ...summary, risks: risks(summary) }, null, 2)}\n`);
  } else {
    printMarkdown(input, summary);
  }
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n\n`);
  usage(1);
}
