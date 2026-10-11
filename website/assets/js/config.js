/* Pace Punks site settings. Edit this file only; no build step needed.
 *
 * signup.provider:
 *   "demo"               Nothing is sent. Signups stay in the visitor's browser. Use for previews.
 *   "formspree"          Free form inbox. Create a form at formspree.io and paste its URL, e.g. https://formspree.io/f/abcdwxyz
 *   "google-apps-script" Free Google Sheet. Deploy the script in README.md as a web app and paste its /exec URL.
 *   "json"               Your own backend. Receives a POST with a JSON body (see README.md for the fields).
 */
window.PACE_PUNKS_CONFIG = {
  signup: {
    provider: "demo",
    endpoint: ""
  },
  // Public URL of the live site, used for the share link after signup. Leave empty to use the current page URL.
  siteUrl: "",
  // Leave a link empty to show it as "coming soon".
  social: {
    x: "",
    discord: "",
    instagram: ""
  },
  // Corridor Run mini game (game/). provider: "demo" keeps scores in each visitor's browser.
  // "google-apps-script": free Google Sheet backend, paste its /exec URL. "json": your own server.
  // Setup for both: game/README.md
  leaderboard: {
    provider: "demo",
    endpoint: ""
  }
};
