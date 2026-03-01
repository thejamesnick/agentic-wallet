import { Command } from 'commander';
import { EventLogger } from '../../core/events/logger';
import Table from 'cli-table3';

export const eventsCommand = new Command('events')
  .description('📟 Manage event logging and subscriptions')
  .argument('[agent-id]', 'Agent identifier')
  .option('--agent-id <id>', 'Agent identifier (alternative)')
  .option('--subscribe', 'Subscribe to events')
  .option('--unsubscribe', 'Unsubscribe from events')
  .option('--path <path>', 'Log file path (default: ~/.paw/events/<agent-id>.log)')
  .option('--format <format>', 'Event format: file, json (default: file)', 'file')
  .option('--events <types>', 'Filter specific event types (comma-separated)')
  .option('--show', 'Show recent events')
  .option('--limit <number>', 'Number of events to show (default: 20)', '20')
  .option('--clear', 'Clear event log')
  .action(async (agentIdArg, options) => {
    try {
      // Support both positional and flag syntax
      const agentId = agentIdArg || options.agentId;
      
      if (!agentId) {
        console.error('\n❌ Error: Agent ID is required');
        console.log('\nUsage: paw events <agent-id> [options]');
        console.log('   or: paw events --agent-id <agent-id> [options]');
        console.log('');
        console.log('Examples:');
        console.log('  paw events agent-alice --subscribe                    # Enable event logging');
        console.log('  paw events agent-alice --subscribe --path ./my.log    # Custom log path');
        console.log('  paw events agent-alice --show                         # View recent events');
        console.log('  paw events agent-alice --unsubscribe                  # Disable logging');
        console.log('');
        process.exit(1);
      }

      console.log('\n📟 PAW - Event Logging');
      console.log('Agent ID:', agentId);
      console.log('');

      // Subscribe to events
      if (options.subscribe) {
        const defaultPath = `${process.env.HOME}/.paw/events/${agentId}.log`;
        const logPath = options.path || defaultPath;
        
        // Parse event types filter
        let eventTypes: string[] | undefined;
        if (options.events) {
          eventTypes = options.events.split(',').map((e: string) => e.trim());
        }
        
        await EventLogger.subscribe({
          agent_id: agentId,
          format: options.format,
          path: logPath,
          events: eventTypes as any,
          enabled: true,
        });
        
        console.log('✅ Event logging enabled');
        console.log('Log file:', logPath);
        if (eventTypes) {
          console.log('Filtering:', eventTypes.join(', '));
        } else {
          console.log('Logging: All events');
        }
        console.log('');
        console.log('💡 Tip: Tail the log file to see events in real-time:');
        console.log(`   tail -f ${logPath}`);
        console.log('');
      }

      // Unsubscribe from events
      if (options.unsubscribe) {
        await EventLogger.unsubscribe(agentId);
        console.log('⚠️  Event logging disabled');
        console.log('');
      }

      // Show recent events
      if (options.show) {
        const limit = parseInt(options.limit);
        const events = await EventLogger.readEvents(agentId, limit);
        
        if (events.length === 0) {
          console.log('No events found');
          console.log('');
          console.log('💡 Tip: Enable event logging with:');
          console.log(`   paw events ${agentId} --subscribe`);
          console.log('');
          return;
        }
        
        console.log(`📊 Recent Events (last ${events.length})`);
        console.log('');
        
        // Create table
        const table = new Table({
          head: ['Time', 'Type', 'Severity', 'Message'],
          colWidths: [20, 25, 12, 50],
          style: {
            head: ['cyan'],
            border: ['gray'],
          },
          wordWrap: true,
        });
        
        for (const event of events) {
          const time = new Date(event.timestamp).toLocaleString();
          const severity = event.severity === 'error' || event.severity === 'critical' ? '🔴' : 
                          event.severity === 'warning' ? '🟡' : '🟢';
          
          table.push([
            time,
            event.type,
            `${severity} ${event.severity}`,
            event.message,
          ]);
        }
        
        console.log(table.toString());
        console.log('');
      }

      // Clear events
      if (options.clear) {
        await EventLogger.clearEvents(agentId);
        console.log('✅ Event log cleared');
        console.log('');
      }

      // Show status if no action specified
      if (!options.subscribe && !options.unsubscribe && !options.show && !options.clear) {
        const subscription = await EventLogger.getSubscription(agentId);
        
        if (subscription) {
          console.log('📊 Event Logging Status: ✅ Enabled');
          console.log('');
          console.log('Log file:', subscription.path);
          console.log('Format:  ', subscription.format);
          if (subscription.events && subscription.events.length > 0) {
            console.log('Filtering:', subscription.events.join(', '));
          } else {
            console.log('Filtering: All events');
          }
          console.log('');
          console.log('💡 View events: paw events', agentId, '--show');
        } else {
          console.log('📊 Event Logging Status: ❌ Disabled');
          console.log('');
          console.log('💡 Enable logging: paw events', agentId, '--subscribe');
        }
        console.log('');
      }
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });
