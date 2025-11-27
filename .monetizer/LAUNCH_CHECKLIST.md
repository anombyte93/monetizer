# Monetizer Launch Checklist

## Status: In Progress

**Site URL**: https://monetizer-ui-production.up.railway.app
**GitHub**: https://github.com/anombyte93/monetizer
**Target MRR**: $100 (9 Pro subscribers @ $12/mo)

---

## 1. Deployment ✅ DONE

- [x] Railway project created: `monetizer-saas`
- [x] Service deployed from GitHub repo
- [x] nixpacks.toml configured for pnpm monorepo
- [x] Environment variables set (ANTHROPIC_API_KEY, PERPLEXITY_API_KEY)
- [x] Domain live: monetizer-ui-production.up.railway.app
- [x] Marketing landing page with pricing tiers

---

## 2. Monetization - LemonSqueezy Setup 🔄 IN PROGRESS

### Step-by-step:

1. **Create LemonSqueezy Account**
   - Go to https://lemonsqueezy.com
   - Sign up (use your business email)
   - Complete onboarding (takes ~5 mins)

2. **Create Store**
   - Store name: "Monetizer"
   - Store URL: monetizer.lemonsqueezy.com

3. **Create Products**

   **Pro Plan (Monthly)**
   - Name: "Monetizer Pro"
   - Price: $12/month (recurring)
   - Description: "Unlimited analyses, market research, GTM plans"

   **Pro Plan (Yearly)**
   - Name: "Monetizer Pro (Annual)"
   - Price: $96/year (recurring) - 2 months free!
   - Description: "Same as monthly, billed annually"

   **Team Plan**
   - Name: "Monetizer Team"
   - Price: $25/seat/month
   - Description: "Everything in Pro + seat management, SSO"

4. **Get Checkout Links**
   - Copy the checkout link for Pro Monthly
   - Format: `https://monetizer.lemonsqueezy.com/checkout/buy/xxx`

5. **Update Landing Page**
   - Replace placeholder link in `packages/ui/src/app/page.tsx` line 123:
   ```tsx
   href="https://monetizer.lemonsqueezy.com/checkout/buy/YOUR_PRODUCT_ID"
   ```

6. **Set Up Webhooks (Optional)**
   - Webhook URL: `https://monetizer-ui-production.up.railway.app/api/webhooks/lemonsqueezy`
   - Events: `order_created`, `subscription_created`, `subscription_cancelled`

---

## 3. npm Publishing 🔜 PENDING

### Prerequisites:
- npm account (https://npmjs.com)
- Logged in: `npm login`

### Publish Steps:

```bash
# From monetizer root
cd /home/anombyte/Projects/in-progress/monetizer

# Build all packages
pnpm build

# Publish packages in order (workspace deps first)
cd packages/shared && pnpm publish --access public
cd ../analyzer && pnpm publish --access public
cd ../strategy && pnpm publish --access public
cd ../orchestrator && pnpm publish --access public
cd ../cli && pnpm publish --access public
```

### Alternative: Use Changesets (recommended for versioning)

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
pnpm changeset  # Create a changeset
pnpm changeset version  # Update versions
pnpm changeset publish  # Publish all
```

---

## 4. Launch Day Checklist 🔜 PENDING

### Pre-Launch (Do Now)
- [ ] Create demo GIF (60-90s showing analyze→strategy flow)
- [ ] Prepare Product Hunt assets:
  - Tagline (60 chars): "Turn your side project into revenue with AI"
  - Description (260 chars)
  - Gallery images (1270x760px)
  - Maker comment template
- [ ] Draft Show HN post
- [ ] Test CLI locally: `npx @monetizer/cli analyze`

### Launch Day (Tue-Thu, 12:01am PT)
- [ ] Post to Product Hunt at 12:01am PT
- [ ] Post Show HN at 6-10am PT (weekday morning)
- [ ] Tweet announcement thread
- [ ] Post to r/SideProject, r/startups
- [ ] Monitor and respond to comments ALL DAY

### Post-Launch
- [ ] Reply to all PH/HN comments
- [ ] Ship quick fixes based on feedback
- [ ] Submit to awesome-lists
- [ ] Track conversions and MRR

---

## 5. Marketing Copy

### Product Hunt Tagline
"Turn your side project into revenue with AI"

### Product Hunt Description
"Monetizer analyzes your codebase and generates a complete monetization strategy using Claude AI. Get pricing tiers, implementation phases, market research, and go-to-market plans in minutes. From open source to SaaS, hassle-free."

### Show HN Post Title
"Show HN: Monetizer – AI tool that analyzes your project and generates a monetization strategy"

### Show HN Body
```
Hey HN! I built Monetizer, a CLI tool that scans your codebase and generates a complete monetization strategy using Claude.

Run `npx @monetizer/cli analyze` in your project and get:
- Monetization potential score
- Recommended pricing tiers
- Implementation roadmap
- Go-to-market launch plan

It uses Claude for strategy generation and optionally Perplexity for market research.

Tech stack: TypeScript, Commander.js, Next.js, Railway, LemonSqueezy

Try it: https://monetizer-ui-production.up.railway.app
GitHub: https://github.com/anombyte93/monetizer

Would love feedback on the analysis accuracy and strategy quality!
```

---

## Quick Reference

| Item | Link |
|------|------|
| Live Site | https://monetizer-ui-production.up.railway.app |
| GitHub | https://github.com/anombyte93/monetizer |
| Railway Dashboard | https://railway.app/project/6ee7ae70-4cd0-480c-b58a-ccb5ef97c5fe |
| LemonSqueezy | https://lemonsqueezy.com |
| Product Hunt | https://producthunt.com |

---

*Last updated: 2025-11-27*
