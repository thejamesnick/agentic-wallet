# PAW Webhook Events Specification
## Making PAW Easy for AI Agents (OpenClaw & Others)

**Version:** 1.0  
**Date:** 2026-03-01  
**Target:** AI agents using PAW (OpenClaw, AutoGPT, etc.)

---

## Executive Summary

Webhooks let AI agents receive real-time notifications when wallet events happen, without polling. This enables event-driven workflows and async operations.

**Key Principle:** Make it dead simple for agents to use - just provide a URL, get JSON POSTs.

---

## 1. User Experience (Agent Perspective)

### Setup (One Command)

```bash
# Agent provides their webhook URL
paw events agent-alice --subscribe --format webhook --url https://myagent.com/webhook

# That's it! Now agent receives all events
```

### What Agent Receives

```http
POST https://myagent.com/webhook
Content-Type: application/json
X-PAW-Signature: sha256=abc123...  (optional, for verification)

{
  "event_id": "evt_1772369761718_0c0bf2fa",
  "timestamp": "2026-03-01T12:56:01.718Z",
  "agent_id": "agent-alice",
  "type": "transaction_executed",
  "severity": "info",
  "message": "Buy completed: 1000 BONK for 0.5 SOL",
  "payload": {
    "type": "buy",
    "token": "BONK",
    "amount": 1000,
    "spent": 0.5,
    "currency": "SOL",
    "signature": "5ytWk63qeJkyTGzusbUxs5EDXKkRaT4Ufatx8qpQnEfjTcQ4NfWuC6JEQzHh3pp8x5ckSnfU12h6ohN7wAGxMUTn",
    "explorer": "https://explorer.solana.com/tx/..."
  }
}
```

### Agent Response

```javascript
// Agent's webhook endpoint (simple!)
app.post('/webhook', (req, res) => {
  const event = req.body;
  
  console.log('PAW event:', event.type, event.message);
  
  // Respond quickly (PAW will retry if no 200)
  res.status(200).json({ received: true });
  
  // Process event async
  processEvent(event);
});
```

---

## 2. Event Types

### Transaction Events
- `transaction_executed` - Buy/sell/send completed successfully
- `transaction_failed` - Transaction failed to execute
- `balance_changed` - Balance updated (future: blockchain monitoring)

### Safety Events
- `guardrail_blocked` - Transaction blocked by spending limits
- `guardrail_approved` - Transaction requires manual approval

### System Events
- `error_occurred` - Error during operation
- `wallet_created` - New wallet initialized
- `config_updated` - Configuration changed

---

## 3. Webhook Configuration

### Basic Setup

```bash
# Enable webhooks
paw events agent-alice --subscribe --format webhook --url https://myagent.com/webhook

# Check status
paw events agent-alice --show

# Disable webhooks
paw events agent-alice --unsubscribe
```

### Advanced Options

```bash
# Filter specific events
paw events agent-alice --subscribe \
  --format webhook \
  --url https://myagent.com/webhook \
  --events transaction_executed,error_occurred

# Custom headers (for auth)
paw events agent-alice --subscribe \
  --format webhook \
  --url https://myagent.com/webhook \
  --header "Authorization: Bearer token123"

# Retry configuration
paw events agent-alice --subscribe \
  --format webhook \
  --url https://myagent.com/webhook \
  --retry 3 \
  --timeout 5000
```

---

## 4. Implementation Plan

### Phase 1: Basic Webhooks (2-3 days)

**What to build:**
1. HTTP client (use fetch/axios)
2. Modify EventLogger to POST to webhook URL
3. Store webhook config in subscription
4. Send events to webhook URL

**Files to modify:**
- `src/core/events/logger.ts` - Add webhook delivery
- `src/types/events.ts` - Add webhook config types
- `src/cli/commands/events.ts` - Add webhook options

**Code structure:**
```typescript
// In EventLogger.log()
if (subscription.format === 'webhook') {
  await this.sendWebhook(subscription.url, event);
}

private static async sendWebhook(url: string, event: WalletEvent) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      console.error('Webhook failed:', response.status);
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
}
```

### Phase 2: Reliability (1-2 days)

**What to build:**
1. Retry logic (3 attempts with exponential backoff)
2. Timeout handling (5 second default)
3. Queue failed webhooks for later retry
4. Log webhook delivery status

**Retry logic:**
```typescript
private static async sendWebhookWithRetry(
  url: string, 
  event: WalletEvent, 
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.ok) {
        return; // Success!
      }
      
      // Retry on 5xx errors
      if (response.status >= 500 && attempt < maxRetries) {
        await this.sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
        continue;
      }
      
      throw new Error(`Webhook failed: ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('Webhook failed after retries:', error);
      }
    }
  }
}
```

### Phase 3: Security (Optional, 1 day)

**What to build:**
1. HMAC signature for webhook verification
2. Custom headers for auth tokens

**Signature:**
```typescript
// Generate signature
const signature = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(event))
  .digest('hex');

// Send with header
headers: {
  'Content-Type': 'application/json',
  'X-PAW-Signature': `sha256=${signature}`,
}
```

---

## 5. Agent Integration Examples

### OpenClaw Integration

```typescript
// OpenClaw receives PAW webhooks
server.post('/paw-webhook', async (req, res) => {
  const event = req.body;
  
  // Respond immediately
  res.status(200).json({ received: true });
  
  // Process event
  if (event.type === 'transaction_executed') {
    await openclaw.notify(`Trade completed: ${event.message}`);
  }
  
  if (event.type === 'error_occurred') {
    await openclaw.alert(`PAW error: ${event.message}`);
  }
});
```

### Discord Bot Integration

```javascript
// Discord bot receives PAW webhooks
app.post('/webhook', async (req, res) => {
  const event = req.body;
  
  res.status(200).send('OK');
  
  // Post to Discord
  if (event.type === 'transaction_executed') {
    await discord.send(`🎉 ${event.message}`);
  }
});
```

### Simple Node.js Agent

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  const event = req.body;
  
  console.log('PAW Event:', event.type);
  console.log('Message:', event.message);
  console.log('Payload:', event.payload);
  
  res.status(200).json({ ok: true });
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});

// Configure PAW:
// paw events my-agent --subscribe --format webhook --url http://localhost:3000/webhook
```

---

## 6. Testing Plan

### Manual Testing

```bash
# 1. Start test webhook server
node test-webhook-server.js  # Listens on localhost:3000

# 2. Configure PAW
paw events test-agent --subscribe --format webhook --url http://localhost:3000/webhook

# 3. Execute transaction
paw buy --agent-id test-agent --token BONK --budget 0.1

# 4. Check webhook server logs
# Should see POST with transaction_executed event
```

### Test Webhook Server

```javascript
// test-webhook-server.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('\n=== PAW Webhook Received ===');
  console.log('Event ID:', req.body.event_id);
  console.log('Type:', req.body.type);
  console.log('Message:', req.body.message);
  console.log('Payload:', JSON.stringify(req.body.payload, null, 2));
  console.log('===========================\n');
  
  res.status(200).json({ received: true });
});

app.listen(3000, () => {
  console.log('Test webhook server running on http://localhost:3000');
});
```

---

## 7. Success Metrics

A webhook implementation is successful when:

| Metric | Target |
|--------|--------|
| Setup time | ≤ 1 command |
| Delivery latency | ≤ 1 second |
| Delivery success rate | ≥ 99% (with retries) |
| Agent integration time | ≤ 10 minutes |
| Failed delivery handling | Automatic retry with backoff |

---

## 8. Documentation for Agents

### Quick Start

```bash
# 1. Start your webhook server (any language)
# Must respond with 200 OK to POST requests

# 2. Configure PAW
paw events my-agent --subscribe --format webhook --url https://myserver.com/webhook

# 3. Done! You'll receive events as JSON POSTs
```

### Event Structure

All webhooks send this structure:
```json
{
  "event_id": "unique-id",
  "timestamp": "ISO-8601",
  "agent_id": "your-agent-id",
  "type": "event-type",
  "severity": "info|warning|error|critical",
  "message": "human-readable message",
  "payload": { /* event-specific data */ }
}
```

### Best Practices

1. **Respond quickly** - Return 200 OK immediately, process async
2. **Handle retries** - PAW will retry failed deliveries
3. **Validate events** - Check event_id to avoid duplicates
4. **Log failures** - Monitor webhook delivery issues
5. **Use HTTPS** - Secure your webhook endpoint

---

## 9. Roadmap

### v1.0 (Week 1)
- Basic webhook delivery
- Retry logic
- Configuration commands

### v1.1 (Week 2)
- Custom headers
- Signature verification
- Delivery status logging

### v2.0 (Future)
- Webhook queue persistence
- Batch delivery
- Webhook testing tool

---

**Written for:** OpenClaw and all AI agents using PAW  
**Goal:** Make webhooks so easy, any agent can use them in 1 command  
**Status:** Ready to implement 🚀
