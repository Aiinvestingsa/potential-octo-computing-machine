# PHUZA AUCTION — Supabase shared database starter

This package is a shared-data starter for GitHub Pages. It includes:
- Email registration and login through Supabase Auth
- Server-created profiles and referral codes
- Referral attribution from a `?ref=CODE` link
- Public auction listings shared across visitors
- Live auction/bid refresh using Supabase Realtime
- Transactionally validated bids via a Postgres RPC function
- Public referral leaderboard
- Per-user, read-only wallet ledger
- Row Level Security (RLS) and limited database grants

**This is not a real-money-ready auction platform.** It does not process deposits, payments, cash-outs, referral rewards, identity checks, or alcohol age verification. Do not accept money or promise returns until the platform has legal review, secure payment integration, fraud controls, admin tooling, monitoring, and independent security testing.

## Files
- `index.html` — frontend
- `app.js` — Supabase-connected app logic
- `config.js` — put your Project URL and Publishable key here
- `supabase/schema.sql` — database tables, RLS policies, signup trigger, bid RPC and realtime setup

## A. Create Supabase project
1. Create a project at https://supabase.com/.
2. In the dashboard, open SQL Editor → New query.
3. Copy all of `supabase/schema.sql`, paste it in the editor and run it.
4. Open Authentication → Sign In / Providers and enable Email.
5. Open Authentication → URL Configuration.
6. Set Site URL to the actual published GitHub Pages URL, e.g. `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.
7. Add that same URL to Redirect URLs. Replace the placeholders with your real username/repository.

## B. Put the connection values in the exact place
Open `config.js`. Replace these two lines:

```js
export const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";
export const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";
```

with your values, keeping the quotation marks, for example:

```js
export const SUPABASE_URL = "https://abcdefgh.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_your_actual_key";
```

Get the Project URL and Publishable key from the Supabase project Connect dialog or Settings → API Keys. Use only a **publishable** key in this browser app. Never use the database password, secret key, or service-role key.

The Project URL is public configuration, but database access must still be protected by RLS. Do not disable RLS to fix an error.

## C. Upload to GitHub Pages
1. Open the repository that currently hosts PHUZA AUCTION.
2. Back up or download the existing files first.
3. Upload `index.html`, `app.js`, and `config.js` to the repository's published root. Upload the `supabase` folder too, so `supabase/schema.sql` stays available for reference.
4. If GitHub asks whether to replace `index.html`, confirm only if you intend to replace the current local-demo interface with this connected starter.
5. In the repository, open Settings → Pages and confirm the correct branch/folder is being published.
6. Wait for the GitHub Pages deployment to finish, then open the published URL.

GitHub Pages serves static files only; Supabase provides the shared backend.

## D. Test with two accounts
1. Register with Account A. Confirm the email if confirmation is enabled.
2. Log in, create an auction listing.
3. Open the site in another browser/private window or another device.
4. Register Account B and verify that Account A's listing appears.
5. Place a bid from Account B. The current price should update for both users.
6. Copy Account A's referral link and register Account B using that link. Check the leaderboard after profile creation.
7. Confirm each account can see only its own wallet ledger records. New wallet records won't appear until a trusted backend/admin process creates them.

## Referral behavior
- Signup with a URL like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/?ref=ABC123CODE` fills the referral code field.
- The database signup trigger resolves the code and stores the referrer's profile ID.
- The leaderboard counts registered referrals. It does not issue rewards.
- The trigger ignores invalid referral codes and self-referrals.

## Security notes and known limitations
- Direct `profiles` table reads are restricted to the signed-in owner. Public display names are exposed only through the `public_profiles` view, and referral codes/referrer relationships are not exposed through that view. Do not add email, phone, ID numbers, or private details to `profiles`.
- This starter grants public read access to auction listings and bid history. If bids or seller identity need to be private, adjust the schema and frontend.
- This starter does not include an admin dashboard or trusted wallet mutation endpoint. Do not give users direct write access to `wallet_ledger`.
- A secure production wallet needs a server-side ledger workflow, immutable transactions, idempotency, audit logs, rate limits, payment-provider webhooks and admin authorization.
- To set an administrator role, use trusted server-side tooling or Supabase Auth app metadata. Never add a role field that users can edit.
- For a real auction, add auction closing logic and winner selection on the server, audit it, and consider race conditions/anti-sniping rules.
- If auction listings involve alcohol or other regulated goods in South Africa, obtain legal advice on licensing, age verification, consumer protection, tax, and payments before launch.

## Troubleshooting
- `Invalid API key`: ensure the key is the project's publishable key and is copied completely.
- `Failed to fetch`: verify the Project URL, project status, internet connection and allowed auth URLs.
- `relation does not exist`: run `supabase/schema.sql` in the correct project.
- Registration succeeds but no session: check email confirmation and the Auth redirect URL.
- Listing/bid permission errors: check the SQL ran successfully and do not disable RLS.
- Realtime not updating: confirm auctions and bids are in the `supabase_realtime` publication and test after a hard refresh.

Official docs:
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/reference/javascript/initializing
- https://docs.github.com/pages
