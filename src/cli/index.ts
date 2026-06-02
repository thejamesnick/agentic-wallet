#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { balanceCommand } from './commands/balance';
import { addressCommand } from './commands/address';
import { sendCommand } from './commands/send';
import { swapCommand } from './commands/swap';
import { buyCommand } from './commands/buy';
import { sellCommand } from './commands/sell';
import { historyCommand } from './commands/history';
import { configCommand } from './commands/config';
import { tokensCommand } from './commands/tokens';
import { dashboardCommand } from './commands/dashboard';
import { exportCommand } from './commands/export';
import { importCommand } from './commands/import';
import { multiSendCommand } from './commands/multi-send';
import { guardrailsCommand } from './commands/guardrails';
import { eventsCommand } from './commands/events';
import { monitorCommand } from './commands/monitor';
import { agentRunCommand } from './commands/agent-run';
import { agentPolicyCommand } from './commands/agent-policy';
import { agentStatusCommand } from './commands/agent-status';
import * as fs from 'fs';
import * as path from 'path';

// Get version from package.json
const packageJsonPath = path.join(__dirname, '../../package.json');
let version = 'unknown';
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  version = packageJson.version;
} catch (e) {
  // Fallback if package.json can't be read
}

const program = new Command();

program
  .name('paw')
  .description('📟 PocketAgent Wallet - Agentic wallet for AI agents on Solana')
  .version(version);

// Register commands
program.addCommand(initCommand);
program.addCommand(importCommand);
program.addCommand(dashboardCommand);
program.addCommand(configCommand);
program.addCommand(guardrailsCommand);
program.addCommand(eventsCommand);
program.addCommand(monitorCommand);
program.addCommand(addressCommand);
program.addCommand(balanceCommand);
program.addCommand(tokensCommand);
program.addCommand(sendCommand);
program.addCommand(multiSendCommand);
program.addCommand(swapCommand);
program.addCommand(buyCommand);
program.addCommand(sellCommand);
program.addCommand(historyCommand);
program.addCommand(exportCommand);

// Agent commands
const agentCommand = new Command('agent')
  .description('🤖 Autonomous agent control (DCA, rebalancing, signals)');
agentCommand.addCommand(agentRunCommand);
agentCommand.addCommand(agentPolicyCommand);
agentCommand.addCommand(agentStatusCommand);
program.addCommand(agentCommand);

// Parse arguments
program.parse();
