#!/usr/bin/env node

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

const program = new Command();

program
  .name('paw')
  .description('📟 PocketAgent Wallet - Agentic wallet for AI agents on Solana')
  .version('0.1.0');

// Register commands
program.addCommand(initCommand);
program.addCommand(importCommand);
program.addCommand(dashboardCommand);
program.addCommand(configCommand);
program.addCommand(guardrailsCommand);
program.addCommand(eventsCommand);
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

// Parse arguments
program.parse();
