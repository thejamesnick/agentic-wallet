#!/usr/bin/env node

/**
 * Test Webhook Server for PAW
 * 
 * This simple server receives webhook events from PAW and displays them.
 * Perfect for testing webhook integration.
 * 
 * Usage:
 *   node examples/test-webhook-server.js
 * 
 * Then configure PAW:
 *   paw events test-agent --subscribe --format webhook --url http://localhost:3000/webhook
 */

const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        
        console.log('\n' + '='.repeat(60));
        console.log('📟 PAW Webhook Received');
        console.log('='.repeat(60));
        console.log('Event ID:  ', event.event_id);
        console.log('Timestamp: ', event.timestamp);
        console.log('Agent ID:  ', event.agent_id);
        console.log('Type:      ', event.type);
        console.log('Severity:  ', event.severity);
        console.log('Message:   ', event.message);
        console.log('');
        console.log('Payload:');
        console.log(JSON.stringify(event.payload, null, 2));
        console.log('='.repeat(60) + '\n');
        
        // Respond with 200 OK
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true, event_id: event.event_id }));
      } catch (error) {
        console.error('Error parsing webhook:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log('\n📟 PAW Test Webhook Server');
  console.log('='.repeat(60));
  console.log('Server running on: http://localhost:' + PORT);
  console.log('Webhook endpoint:  http://localhost:' + PORT + '/webhook');
  console.log('='.repeat(60));
  console.log('');
  console.log('Configure PAW with:');
  console.log('  paw events test-agent --subscribe --format webhook --url http://localhost:3000/webhook');
  console.log('');
  console.log('Then test with:');
  console.log('  paw send --agent-id test-agent --to <address> --amount 0.01');
  console.log('');
  console.log('Waiting for webhooks...\n');
});
