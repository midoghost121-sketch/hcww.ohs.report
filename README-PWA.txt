# HCWW OHS Report - PWA

This package is prepared as an installable Progressive Web App (PWA).

## What was added
- `service-worker.js`
- Service Worker registration in `index.html`
- `id` and `scope` in `manifest.json`
- Removed the broken `logos.js` reference (the file is not present in the project)

## Important security note
The original `app.js` contains Nextcloud credentials directly in browser-side JavaScript.
Because this project is publicly hosted, those credentials can be extracted by anyone who can open the site.
Rotate/change the exposed Nextcloud password/app password before continuing to use public deployment.
For a secure production setup, Nextcloud uploads should be performed through a server-side endpoint or an authentication flow that does not expose reusable credentials in frontend JavaScript.
