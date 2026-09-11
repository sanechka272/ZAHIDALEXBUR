# ZAHIDALEXBUR Landing Redesign — Design Spec

## Goal
Rebuild the existing ZAHIDALEXBUR website as a conversion-focused one-page Next.js landing page for paid traffic while preserving the useful factual content, pricing and contacts from the current site.

## Visual direction
- Premium industrial/editorial aesthetic rather than a generic blue “water company” look.
- Palette: near-black, warm off-white, graphite and restrained brown/bronze accents.
- Large condensed uppercase headings, compact body copy, strong grid and generous spacing.
- Cinematic drilling imagery from the existing ZAHIDALEXBUR site.
- Minimal controls and CTAs; every section should move the user toward a cost estimate or consultation.

## Core sections
1. Sticky transparent header with brand, anchors, phone and primary CTA.
2. Full-screen hero with drilling imagery, service positioning and primary conversion CTA.
3. Service type cards: безфільтрова, фільтрова, промислова with current price ranges.
4. Five-step process from consultation to equipment connection.
5. Key trust metrics and proof points.
6. Location estimator for popular settlements around Lviv with an editable settlement field.
7. Benefits strip focused on equipment, transparent pricing, warranty and support.
8. Real project gallery using the existing six gallery images.
9. Compact FAQ based on the legacy site’s common questions.
10. Final lead form and contact/footer details.
11. Non-aggressive lead-capture modal triggered after meaningful engagement, with an easy close action and no repeated harassment during the same session.

## Content rules
- Reuse verified information from the current site; modernize wording for scanability.
- Current public prices remain: безфільтрова 1800–2100 грн/м, фільтрова 2000–2300 грн/м, промислова 2300–2500 грн/м.
- Contact data: +380997837644, zahidalexbur@gmail.com, Львів, с. Наварія, вул. Львівська 154.
- Do not invent certifications, years in business, project counts or guarantees that are not explicitly supported by the current public site. Metrics shown in the visual concept that are not verified must be omitted or replaced by factual claims.

## Conversion behaviour
- Primary CTA text: “Розрахувати вартість”.
- Secondary CTA: “Отримати консультацію”.
- Forms collect name, phone and settlement; no email is required for lead capture.
- Form submission in this implementation is front-end only and shows a success state; backend integration is intentionally left as a clearly isolated next step.
- The location estimator provides an indicative range only and clearly states that geological conditions affect final depth and price.

## Technical constraints
- Next.js 16 App Router, React 19, TypeScript.
- No UI framework dependency; styling is custom CSS for fidelity and small bundle size.
- Existing image URLs are used directly from zahidalexbur.com.ua in the first implementation because the GitHub connector cannot directly persist binary image files. Asset paths are centralized so they can later be copied into `/public` without redesign work.
- Responsive layouts for mobile, tablet and desktop.
- Accessible labels, keyboard-reachable controls, reduced-motion support and meaningful alt text.
