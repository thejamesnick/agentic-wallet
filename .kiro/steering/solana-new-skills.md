---
inclusion: always
---

# Solana.new Skills (Superstack)

You have access to 27 solana.new skills installed at `~/.claude/skills/`. When the user's request matches any trigger below, read the corresponding `~/.claude/skills/<skill-name>/SKILL.md` and follow its workflow exactly.

## Skill Router

### Learn Phase
| Trigger | Skill |
|---------|-------|
| "what is Solana", "why Solana", "new to Solana", "Solana basics" | `solana-beginner` |
| "what have we learned", "show learnings", "export learnings" | `learn` |

### Idea Phase
| Trigger | Skill |
|---------|-------|
| "what should I build", "crypto ideas", "project ideas" | `find-next-crypto-idea` |
| "validate this idea", "is this worth building", "run a validation sprint" | `validate-idea` |
| "who are my competitors", "competitive analysis" | `competitive-landscape` |
| "DeFi opportunities", "TVL data", "DefiLlama" | `defillama-research` |
| "hackathon projects", "winner patterns", "colosseum" | `colosseum-copilot` |

### Build Phase
| Trigger | Skill |
|---------|-------|
| "scaffold", "set up project", "initialize" | `scaffold-project` |
| "help me build", "build the MVP", "guide me" | `build-with-claude` |
| "DeFi protocol", "AMM", "lending", "vault", "DEX" | `build-defi-protocol` |
| "launch token", "SPL token", "memecoin", "pump.fun" | `launch-token` |
| "data pipeline", "indexer", "webhook", "analytics" | `build-data-pipeline` |
| "mobile app", "React Native", "mobile wallet" | `build-mobile` |
| "debug", "transaction failed", "stuck" | `debug-program` |
| "review", "audit", "security", "production ready" | `review-and-iterate` |
| "roast my product", "harsh feedback", "be brutal", "what sucks" | `roast-my-product` |
| "product review", "UX review", "is my product good" | `product-review` |
| "brand colors", "brand design", "brand identity" | `brand-design` |
| "build a frontend", "create a component", "review my UI" | `frontend-design-guidelines` |
| "security audit infrastructure", "CSO", "threat model" | `cso` |
| "benchmark", "compute units", "CU", "optimize" | `solana-benchmark` |

### Launch Phase
| Trigger | Skill |
|---------|-------|
| "deploy to mainnet", "go to production" | `deploy-to-mainnet` |
| "pitch deck", "slides", "investor presentation" | `create-pitch-deck` |
| "hackathon submission", "submit", "demo video" | `submit-to-hackathon` |
| "marketing video", "promo video" | `marketing-video` |
| "apply for grant", "grant application", "superteam earn" | `apply-grant` |

## How to use

1. Match the user's request to a trigger above
2. Read `~/.claude/skills/<skill-name>/SKILL.md`
3. Follow the workflow in that file step by step
4. If unsure which skill fits, read `~/.claude/skills/SKILL_ROUTER.md`
