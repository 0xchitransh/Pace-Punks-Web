# Pace Punks early access website

A self-contained static site. No build step, no framework. Open `index.html` in a browser or upload the whole folder to any static host.

```
index.html              the page
privacy.html            draft privacy notice for the signup list
assets/css/site.css     all styles (brand tokens at the top)
assets/js/config.js     the ONLY file you need to edit: signup endpoint, social links, site URL
assets/js/main.js       gallery, score calculator, hero animation, signup logic
assets/js/punks-data.js trait data for the 100 previews (generated from metadata/*.json)
assets/punks/           627px art (true 2px pixel grid) + thumb/ 320px
assets/img/             logo, favicon, og-image.jpg (social share card)
```

## Go live (pick one, all free)
- **Netlify Drop**: drag this folder onto https://app.netlify.com/drop.
- **Vercel**: `npx vercel` inside this folder.
- **GitHub Pages**: push the folder to a repo, Settings > Pages > deploy from branch.
- **Cloudflare Pages**: upload the folder as a direct upload project.

Then set `siteUrl` in `assets/js/config.js` to your domain, and point your domain's DNS at the host.

## Collect real signups
Out of the box the form runs in `"demo"` mode: it works, but signups stay in the visitor's browser. Choose one:

### Option A: Formspree (fastest)
1. Create a form at https://formspree.io (free tier covers 50 submissions/month; paid plans go higher).
2. In `config.js`: `provider: "formspree"`, `endpoint: "https://formspree.io/f/XXXXXXX"`.

### Option B: Google Sheet (free, unlimited for this scale)
1. Make a new Google Sheet. Extensions > Apps Script. Paste:
```js
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var cols = ["submitted_at","email","x_handle","platform","activity","invite_code","playtest","consent","ref","utm_source","utm_medium","utm_campaign","page"];
  if (sheet.getLastRow() === 0) sheet.appendRow(cols);
  sheet.appendRow(cols.map(function (c) { return e.parameter[c] || ""; }));
  return ContentService.createTextOutput("ok");
}
```
2. Deploy > New deployment > Web app, execute as Me, access Anyone. Copy the `/exec` URL.
3. In `config.js`: `provider: "google-apps-script"`, `endpoint: "<that URL>"`.

### Option C: your own backend / email tool
`provider: "json"` sends `POST endpoint` with `Content-Type: application/json` and this body:
```json
{ "email": "", "x_handle": "@name", "platform": "ios|android|both|", "activity": "walk|run|hike|adaptive|mixed",
  "invite_code": "", "playtest": "yes|no", "consent": "yes", "submitted_at": "ISO date", "page": "early-access",
  "ref": "optional", "utm_source": "optional", "utm_medium": "optional", "utm_campaign": "optional" }
```
Return any 2xx. This also works with Mailchimp/ConvertKit/Loops via a small serverless function, or a Supabase edge function.

Spam: the form has a hidden honeypot field (`company`); filled-in submissions are dropped.
Referrals: every signup gets a share link with `?ref=<code>`; new signups arriving through it carry that `ref` value so you can count who brought whom (recognition only, per the plan: no token rewards for referrals).

## Content sources
All numbers come from `Pace Punks Final/plan.md`: Movement Score rules (5.1), release schedule and prices (5.2), 85/15 split (6), levels (7), attributes (8), battery/durability (9), Pace Box odds (11), pilot stages (20).
Deliberately left off the public page: mint-receipt dividends, PP supply and GP→PP rates. The plan marks these as TBA and warns against selling an earnings promise; add them only after legal review.

Brand kit: `../brand/BRAND.md`.
