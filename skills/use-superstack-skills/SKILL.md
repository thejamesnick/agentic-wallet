---
name: use-superstack-skills
description: Meta-skill for any AI agent to discover and use solana.new superstack skills. Activate when the user asks about anything Solana — building, ideas, DeFi, tokens, launching, pitching, or crypto in general.
---

# Use Superstack Skills

> **For AI agents**: Do NOT answer Solana-related questions from memory alone. Always find and read the matching skill file first, then follow its workflow.

You have 27 solana.new skills installed locally. This skill tells you how to find and use them.

## Step 1 — Find the right skill

Match the user's request to a skill using the router below. If nothing matches clearly, read `~/.claude/skills/SKILL_ROUTER.md` for the full routing table.

## Step 2 — Read the skill

Read the full `SKILL.md` from the matching skill folder:

```bash
cat ~/.claude/skills/<skill-name>/SKILL.md
```

## Step 3 — Follow the workflow

Execute every step in that skill file exactly as written. Do not skip steps.

## Step 4 — Handle missing skills

If the skill folder doesn't exist, tell the user to reinstall:
```bash
curl -fsSL https://www.solana.new/setup.sh | bash -s -- --update
```

---

## Skill Router

### Learn Phase
| User says something like... | Use skill |
|-----------------------------|-----------|
| "what is Solana", "why Solana", "new to Solana", "Solana basics", "coming from EVM" | `solana-beginner` |
| "what have we learned", "show learnings", "export learnings", "prune learnings" | `learn` |

### Idea Phase
| User says something like... | Use skill |
|-----------------------------|-----------|
| "what should I build", "give me crypto ideas", "project ideas", "I don't know what to build" | `find-next-crypto-idea` |
| "validate this idea", "is this worth building", "should I build this", "stress test my idea", "run a validation sprint" | `validate-idea` |
| "who are my competitors", "competitive analysis", "who's already doing this" | `competitive-landscape` |
| "DeFi opportunities", "TVL data", "DefiLlama", "what's trending in DeFi" | `defillama-research` |
| "hackathon projects", "winner patterns", "colosseum", "gap analysis" | `colosseum-copilot` |

### Build Phase
| User says something like... | Use skill |
|-----------------------------|-----------|
| "scaffold", "set up project", "initialize", "start from scratch", "Anchor workspace" | `scaffold-project` |
| "help me build", "build the MVP", "guide me through building", "step by step" | `build-with-claude` |
| "DeFi protocol", "AMM", "lending protocol", "vault", "DEX", "liquidity pool" | `build-defi-protocol` |
| "launch a token", "SPL token", "create a memecoin", "pump.fun", "token distribution" | `launch-token` |
| "data pipeline", "indexer", "webhook", "on-chain analytics", "event tracking" | `build-data-pipeline` |
| "mobile app", "React Native", "mobile wallet", "mobile dApp" | `build-mobile` |
| "debug", "transaction failed", "error in program", "stuck", "something broke" | `debug-program` |
| "code review", "audit my code", "security review", "is this production ready" | `review-and-iterate` |
| "roast my product", "harsh feedback", "be brutal", "what sucks about this" | `roast-my-product` |
| "product review", "UX review", "is my product good", "review my onboarding" | `product-review` |
| "brand colors", "brand design", "brand identity", "pick a palette", "theme this" | `brand-design` |
| "build a frontend", "create a component", "review my UI", "style this", "polish this" | `frontend-design-guidelines` |
| "security audit infrastructure", "CSO", "threat model", "OWASP" | `cso` |
| "benchmark", "compute units", "CU optimization", "optimize my program" | `solana-benchmark` |

### Launch Phase
| User says something like... | Use skill |
|-----------------------------|-----------|
| "deploy to mainnet", "go to production", "mainnet checklist" | `deploy-to-mainnet` |
| "pitch deck", "investor slides", "I need to pitch", "raise money" | `create-pitch-deck` |
| "hackathon submission", "submit my project", "demo video for hackathon" | `submit-to-hackathon` |
| "marketing video", "promo video", "product video" | `marketing-video` |
| "apply for grant", "grant application", "superteam earn", "agentic engineering grant" | `apply-grant` |

---

## Where skills are installed

| Agent | Path |
|-------|------|
| Claude Code | `~/.claude/skills/` |
| Codex | `~/.codex/skills/` |
| Any agent | `~/.agents/skills/` |

## List all available skills

```bash
ls ~/.claude/skills/
```
