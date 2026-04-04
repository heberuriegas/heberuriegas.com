# heberuriegas.com - Website Spec

## 1) Project Overview

Personal website for Heber Uriegas that presents a clear mission, leadership story, values, and work.

Core narrative:

- Why: create impact through software.
- Who: father, CTO, and co-founder.
- How: passion, curiosity, ingenuity, hard work, integrity.

## 2) Goals

- Communicate identity and mission in under 10 seconds.
- Showcase leadership credibility (Seals AI YC S24, Orchata YC S20, Prysmex).
- Present current and future projects in a structured way.
- Make contact simple and direct.

## 3) Non-Goals (v1)

- No CMS integration.
- No blog engine.
- No authentication/private areas.
- No heavy animations or complex JS frameworks.

## 4) Audience

- Founders and operators.
- Engineers and potential collaborators.
- Investors and ecosystem peers.
- Recruiters and strategic partners.

## 5) Information Architecture

Single-page structure with anchored sections:

1. Hero
2. About
3. Experience
4. Values
5. Featured Work
6. Future Projects
7. Contact

## 6) Content Requirements

### Hero

- Headline: "Building software that creates real impact."
- Subheadline with identity and values.
- CTAs:
  - Primary: Explore My Work (anchor to Projects)
  - Secondary: LinkedIn profile

### About

- Brief founder/leadership story.
- Mention fatherhood perspective as leadership lens.

### Experience

- Seals AI (CTO & Co-founder, YC S24)
- Orchata (Head of Engineering, YC S20)
- Prysmex (CTO)
- Each entry should emphasize outcomes, not only titles.

### Values

- Passion
- Curiosity
- Ingenuity
- Hard Work
- Integrity

Each value has a one-line behavioral statement.

### Featured Work

- 3 core cards in v1.
- Each card includes:
  - project/context name
  - what it does
  - impact statement

### Future Projects

- Start with placeholders and iterate.
- Recommended fields:
  - Name
  - Why it matters
  - Stage (Idea/Research/Building)

### Contact

- GitHub link
- LinkedIn link
- Email: `mail@heberuriegas.com`

## 7) Voice and Tone

- Mission-driven, concise, grounded.
- Confident without hype.
- Human and personal, with technical credibility.

## 8) Visual Direction

- Warm editorial feel with modern product clarity.
- Distinct typography pairing (serif for headings, sans for body).
- Custom palette (earth/warm + teal accent), not generic default UI look.
- Subtle motion only (section reveal).

Hybrid console guidance:

- Use command-style labels as accents (for example: `/about`, `/projects`, `> mission`).
- Keep long-form body copy in standard readable typography.
- Avoid full terminal themes that reduce readability for non-technical audiences.

## 9) UX and Accessibility

- Mobile-first responsive layout.
- Sticky top nav with semantic anchors.
- Color contrast must remain readable.
- Keyboard-accessible links and controls.
- Respect reduced-motion preference in future enhancement.

## 10) Technical Scope (v1)

- Stack: static HTML/CSS/JS.
- Files:
  - `index.html`
  - `styles.css`
  - `script.js`
- No build step required.

## 11) SEO and Metadata

- Title and meta description present.
- Open Graph title/description present.
- Future additions:
  - custom OG image
  - favicon set
  - canonical URL

## 12) Performance Targets

- Fast first load on mobile.
- Keep JS minimal and non-blocking.
- Avoid large assets in v1.

## 13) Deployment

- Domain: `heberuriegas.com`
- Any static host is acceptable for v1 (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

## 14) Open Items

- Replace placeholder social links with real URLs.
- Replace project placeholders with real project details.
- Confirm preferred contact copy and optional secondary CTA.

Chat feature options:

- "Ask Heber" via Gemini free tier behind a Vercel serverless function.
- Add rate limiting and a fallback response for quota limits.

## 15) v1 Done Criteria

- Site deploys and renders correctly on desktop and mobile.
- All sections populated with approved copy.
- Contact email visible as `mail@heberuriegas.com`.
- No broken links.
- Smooth section reveal and anchor navigation working.
