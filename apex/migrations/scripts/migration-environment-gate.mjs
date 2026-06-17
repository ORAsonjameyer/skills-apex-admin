#!/usr/bin/env node
import process from 'node:process';

const ALLOWED_NON_PROD = new Set([
  'dev',
  'development',
  'test',
  'qa',
  'uat',
  'stage',
  'staging',
  'sandbox',
  'training',
  'demo',
  'rehearsal',
  'non-production',
  'nonproduction',
  'non-prod',
  'nonprod'
]);

const BLOCKED_PROD = new Set([
  'prod',
  'production',
  'live',
  'customer-facing',
  'customer-facing-production',
  'business-critical',
  'business-critical-production'
]);

function usage(exitCode = 0) {
  const text = `
Usage:
  node migration-environment-gate.mjs --environment TEST --production-status non-production --intent execution
  node migration-environment-gate.mjs --environment PROD --production-status production --intent planning --json

Options:
  --environment <name>                 Environment name or label
  --production-status <status>         non-production, production, or unknown
  --intent <intent>                    execution, planning, readiness, or handoff
  --json                               Print JSON instead of Markdown
`;
  process.stdout.write(text.trimStart());
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = { json: false, intent: 'planning', 'production-status': 'unknown' };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') usage(0);
    if (arg === '--json') {
      args.json = true;
      continue;
    }
    if (['--environment', '--production-status', '--intent'].includes(arg)) {
      args[arg.slice(2)] = argv[i + 1];
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function normalize(input) {
  return String(input || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function classifyEnvironment(environment, productionStatus) {
  const env = normalize(environment);
  const status = normalize(productionStatus);

  if (status === 'production') return { status: 'production', source: 'explicit production-status' };
  if (status === 'non-production' || status === 'nonproduction' || status === 'non-prod' || status === 'nonprod') {
    return { status: 'non-production', source: 'explicit production-status' };
  }

  if (BLOCKED_PROD.has(env)) return { status: 'production', source: 'environment name' };
  if (ALLOWED_NON_PROD.has(env)) return { status: 'non-production', source: 'environment name' };

  return { status: 'unknown', source: 'not enough evidence' };
}

function evaluate(args) {
  const intent = normalize(args.intent || 'planning');
  const classification = classifyEnvironment(args.environment, args['production-status']);

  if (intent === 'execution') {
    if (classification.status === 'non-production') {
      return {
        verdict: 'allowed',
        intent,
        environment: args.environment || null,
        productionStatus: classification.status,
        reason: `Execution orchestration is allowed because the target is explicitly non-production (${classification.source}).`
      };
    }
    return {
      verdict: 'blocked',
      intent,
      environment: args.environment || null,
      productionStatus: classification.status,
      reason: classification.status === 'production'
        ? 'Production migration execution is not allowed through this skill. Provide readiness planning and handoff only.'
        : 'Environment production status is unclear. Execution orchestration is blocked until the target is explicitly confirmed as non-production.'
    };
  }

  return {
    verdict: 'planning_only',
    intent,
    environment: args.environment || null,
    productionStatus: classification.status,
    reason: 'Planning, readiness, evidence requirements, and handoff packaging are allowed.'
  };
}

function printMarkdown(result) {
  const lines = [
    '# APEX Migration Environment Gate',
    '',
    `- Intent: ${result.intent}`,
    `- Environment: ${result.environment || 'not provided'}`,
    `- Production status: ${result.productionStatus}`,
    `- Verdict: ${result.verdict}`,
    `- Reason: ${result.reason}`
  ];
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
