# ZAHIDALEXBUR

Conversion-focused redesign of the ZAHIDALEXBUR well-drilling website built with Next.js App Router.

## Stack
- Next.js 16
- React 19
- TypeScript
- Custom responsive CSS
- Node test runner for the location estimator

## Run locally
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks
```bash
npm test
npm run build
```

## Content and assets
Verified service pricing and contact data were carried over from the current public ZAHIDALEXBUR site. Existing website images are centralized in `lib/site-data.ts` and referenced remotely in this first implementation.

## Lead forms
The UI currently uses a front-end success state only. Connect form submission to your CRM, Telegram/Viber flow, email endpoint, or another lead backend before production advertising.
