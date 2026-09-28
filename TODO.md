# TODO

What's left after the September 2026 overhaul, roughly in the order I want to
do it. Tick things off here as they get done.

## First

- [ ] **Faster Kasi.** It works on the existing OpenRouter key (free models,
      ~10 s an answer). Add a free `CEREBRAS_API_KEY` (cloud.cerebras.ai) and/or
      `GEMINI_API_KEY` (aistudio.google.com/apikey) in Vercel → Settings →
      Environment Variables, then redeploy. Cerebras answers in a second or two.
      Order is set by `KASI_PROVIDERS` (default `cerebras,groq,gemini,openrouter`).
- [ ] After the deploy, click through once: home (hero, globe at the bottom),
      `/activities`, one activity page, `/publications`, `/skills`, `/contact`
      (map, popups, satellite toggle), Kasi, and the search (`Ctrl K` or `/`).
- [ ] Turn on Speed Insights in the Vercel dashboard if it isn't already (the
      code is in now). The old `vercel/install-vercel-speed-insights-…` branch
      can then be deleted.

## Content only I can fix

- [ ] **NRSC Offline Coding Challenge** (`activities.json`): dated
      `2026-01-28`, but the text says 03 June – 06 July 2025. Which is right?
- [ ] **IN-SPACe Industry Connect 2026** has no "With:" line.
- [ ] Activity write-ups switch between "I", "We" and no subject (16 / 11 / 6
      of 33). Pick one voice and go through them.
- [ ] iGIS isn't in `skills.json`, so it doesn't show on the skills page or in
      Kasi's answers. Add it if it should.
- [ ] Resume PDF and the profiles (LinkedIn, ORCID, Scholar, ResearchGate):
      use "Dr. Akash Kumar" like the site.
- [ ] 166 photos in `public/` are bigger than they need to be (~91 MB).
      `node scripts/optimize-images.mjs --dry-run` lists them; without the
      flag it re-encodes them (lossy, so look at a few before committing).

## Check by hand in a browser

The Playwright tests (`npm run test:e2e`) cover the basics on desktop and
phone sizes; these need eyes:

- [x] Deep links: `/activities#nasa-space-apps-2024` and the old style
      `/activities#activity-12` land on the card and highlight it, including
      on a phone and with filters active.
- [x] Map: Tab in from the contact form: the "Skip the map" link shows up and
      jumps past the pins. Theme and imagery toggles while tiles are still
      loading. "Locate me" draws the line.
- [x] Map deep links from the globe: `/contact?city=vienna#map`,
      `/contact?place=iit-roorkee#map` open at the right place with the popup.
- [ ] Globe on a real phone: a sideways swipe turns it, an up/down swipe still
      scrolls the page, tapping a dot selects that city, and it stays smooth on
      a mid-range phone.
- [x] Search palette on a Mac shows ⌘K; try a paper title, a tool alias
      (e.g. "UAV"), a city.
- [ ] Kasi on a phone: keyboard doesn't cover the input, Hindi typing works,
      "Clear chat" works, answers link to the right pages.

## Code

- [ ] Prettier pass: `npx prettier --write .` touches ~76 files (class order,
      line breaks). Do it as its own "Format" commit so it doesn't bury real
      changes.
- [ ] The home page `<h1>` is the greeting ("hi, akash here"); the name is
      in the title and the structured data. That's on purpose; revisit only if
      name searches suffer.
- [ ] Content-Security-Policy: only the parts that can't block anything are
      set (`base-uri`, `form-action`, `frame-ancestors`, `object-src`). A full
      policy needs per-request nonces, which would make the static pages
      dynamic.
- [ ] MapLibre 6 downloads its shared module twice on `/contact` (page +
      worker). Revisit when Turbopack can bundle the worker.
- [ ] `npx tsc` got slow (~3 min) since `@types/three`. Live with it or look
      at project references.
- [ ] The free model list in `src/lib/chat-providers.ts` goes stale every few
      weeks. `openrouter/free` covers it, but check
      `https://openrouter.ai/api/v1/models` (price 0) now and then.
- [ ] Globe: markers around Roorkee/Delhi overlap; maybe smaller dots or a
      closer camera on India. The land mask stops at ±84°, so Antarctica is
      patchy (not visible in normal use).
- [ ] View Transitions from activity cards into activity pages, once Next's
      `viewTransition` flag is stable.
- [ ] Go through the security/admin and code-health parts of the old audit
      once more (sections H and I); everything else is done apart from the
      content items above.

## SEO

- [ ] Google Search Console: verify the domain, submit `/sitemap.xml`, and
      after a few days look at the Breadcrumbs, Events and Profile page
      reports. Import the site into Bing Webmaster Tools from there.
- [ ] Rich Results Test on `/`, one activity and one publication page.
- [ ] Papers that are published or accepted now carry Google Scholar
      `citation_*` tags. Check in a few weeks that Scholar lists the site as a
      version.
- [ ] Put https://www.akashpandey.com in the website field on ORCID, Google
      Scholar, ResearchGate, LinkedIn and GitHub.
- [ ] Some activities are field visits rather than events; maybe `Article`
      instead of `Event` in the structured data for those.

## Settings in Vercel

- [ ] `ADMIN_SESSION_SECRET`: 32+ random characters. Changing
      `ADMIN_SESSION_VERSION` signs every admin session out.
- [ ] Update the Apps Script for the chat log sheet to the version in
      `docs/chat-logging.md` (read/reset over POST with the token, formula
      guard, retention). The admin page still falls back to the old read.
- [ ] Optional: Upstash (`UPSTASH_REDIS_REST_URL` / `_TOKEN`) so rate limits
      hold across serverless instances; Turnstile keys for the contact form.
- [ ] If the chat logs ever move to Supabase Postgres, add
      `?sslmode=no-verify` to the URL (TLS is verified by default; Neon is
      fine as is).

## Done recently

- Activities: permanent URLs (`/activities/<slug>`) with their own pages;
  old `#activity-N` links still work; filters live in the URL.
- Photos: pre-sized WebP with blur previews; only the hero photo is preloaded.
- Map: clustered pins, one popup per place, working toggles, deep links from
  the globe, MapLibre 6, and its styles actually apply now.
- Kasi: whole profile plus generated facts, streaming, free providers with
  fallback (Cerebras, Groq, Gemini, OpenRouter).
- Home: "hi, akash here" heading, "Dr. Akash Kumar" line, 3D globe of the
  22 cities with a step-through tour.
- Search palette (`Ctrl K`, `⌘K` or `/`) over pages, activities, papers,
  tools and roles.
- SEO: preview images, structured data, Scholar tags, RSS
  (`/activities/feed.xml`), `/llms.txt`, image sitemap.
- Security: Next 16.3.6, sharp 0.35.5, MapLibre 6.11.2 (npm audit clean);
  extra headers; Speed Insights (cookieless).
- Accessibility: axe scans clean on the main pages; focus ring, selection and
  scrollbar colours; underlined map credits.
- Tests: 52 unit tests (`npm test`), 20 end-to-end tests on desktop and
  phone sizes (`npm run test:e2e`).
