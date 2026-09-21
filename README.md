# 9 Alley — From Static Page to Real Website

This zip has a working front end for 9 Alley and a starter backend. This guide
walks you — assuming you've never deployed a website before — through
everything else needed to make it a real, live site with accounts, a
newsletter, and a working shop. Follow it top to bottom; each step builds on
the last.

## What's in this folder

```
9alley-website/
├── frontend/
│   ├── index.html     ← the main site (shop, games, comics, etc.)
│   ├── login.html      ← log in page
│   └── signup.html     ← sign up page
├── backend/
│   ├── server.js        ← the API (signup, login, newsletter)
│   ├── package.json     ← list of backend dependencies
│   └── .env.example     ← template for your secret keys
└── README.md            ← you are here
```

`frontend/` is what visitors see. `backend/` is a private server that stores
data (accounts, newsletter emails) and the frontend talks to it. Right now
they're not connected to anything live — that's what this guide sets up.

## The big picture, in plain terms

A "full blown" website like this has three separate pieces:

1. **Frontend** — the HTML/CSS/JS pages people look at. You already have this.
2. **Backend** — a server that runs your code, checks passwords, and talks to
   the database. `backend/server.js` is a starting point.
3. **Database** — where accounts and newsletter emails actually get saved
   between visits. You'll use MongoDB Atlas (free tier).

These three pieces usually live in three different places once deployed:
frontend on a static host, backend on an app host, database on a database
host. That's normal — it's how most real sites work.

---

## Step 1 — Install the tools

You need two free things installed on your computer:

1. **Node.js** — lets you run JavaScript outside the browser (this is what
   runs your backend). Download the "LTS" version from nodejs.org and install
   it like any other program.
2. **A code editor** — [VS Code](https://code.visualstudio.com) is free and
   the standard choice.

To check Node installed correctly, open a terminal (on Mac: Terminal app; on
Windows: Command Prompt) and type:

```
node -v
```

If it prints a version number like `v20.11.0`, you're set.

---

## Step 2 — Set up your database (MongoDB Atlas)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and
   create a free account.
2. Create a free "M0" cluster (their free tier — no credit card needed).
3. Under **Database Access**, create a database user with a username and
   password. Save these somewhere.
4. Under **Network Access**, click "Allow access from anywhere" (fine for
   getting started; you can lock this down later).
5. Click **Connect** on your cluster → **Drivers** → copy the connection
   string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/
   ```
6. In `backend/`, copy `.env.example` to a new file named `.env`, and paste
   your connection string into `MONGODB_URI`, replacing `<username>` and
   `<password>` with your real values.

`.env` is where all your secret values live. It's already listed in
`.gitignore` so it never accidentally gets uploaded anywhere public.

---

## Step 3 — Run the backend on your computer

In your terminal:

```
cd backend
npm install
npm run dev
```

`npm install` downloads the packages listed in `package.json` (Express for
the server, bcrypt for password security, etc.). `npm run dev` starts the
server. You should see:

```
✅ Connected to MongoDB
🎲 9 Alley API listening on http://localhost:4000
```

Leave this running. Open `frontend/index.html` in your browser (just
double-click it, or use VS Code's "Live Server" extension for a nicer
experience) and try the newsletter form at the bottom of the page — it's
already wired up to call your local backend.

### How login/signup actually work (server.js walkthrough)

Open `backend/server.js` — it's heavily commented, but here's the shape:

- **Signup**: takes a name, email, password. It never stores the password as
  plain text — `bcrypt.hash()` scrambles it first. If anyone ever saw your
  database, they still couldn't read passwords.
- **Login**: looks up the user by email, and uses `bcrypt.compare()` to check
  the submitted password against the scrambled one. If it matches, the server
  hands back a **JWT** (a signed token) — think of it like a wristband from a
  concert that proves you're allowed in, without you having to show ID every
  time.
- The frontend (`login.html`) saves that token in the browser and can send it
  along with future requests to prove who's logged in — see the
  `requireLogin` example route in `server.js` for how a "my account" page
  would use it.

You don't need to write any of this from scratch — it's already done. Read it
once so you understand what's happening, then move on.

---

## Step 4 — Connect the shop's "Add to cart" to something real

Right now, clicking "Add to cart" on the shop page just changes a number on
the screen — nothing is saved. To make checkout actually work and take
payments:

1. Create a free account at [stripe.com](https://stripe.com) — this is the
   standard, beginner-friendly way to accept card payments online.
2. In the Stripe dashboard, grab your **test** API keys (Developers → API
   keys). Test keys let you simulate payments with fake card numbers before
   going live.
3. Add a `/api/checkout` route to `server.js` that creates a Stripe
   "Checkout Session" and redirects the customer to Stripe's hosted payment
   page. Stripe's own
   [Node.js Checkout quickstart](https://stripe.com/docs/checkout/quickstart)
   has copy-pasteable code for exactly this — it's the best next tutorial to
   follow once this backend is running.
4. Once it works with test keys, switch to your live keys when you're ready
   to accept real payments (Stripe will ask you for business details first).

This is the one piece that's genuinely safer to follow Stripe's official,
always-up-to-date guide for rather than a static example here — payment code
changes often for security reasons.

---

## Step 5 — Make the newsletter real (optional upgrade)

Right now, emails submitted through the newsletter form are saved in your own
database (`Subscriber` model in `server.js`) — that already works. If you'd
rather manage subscribers through a proper email tool (so you can actually
send newsletters, not just collect emails):

1. Create a free account at [mailchimp.com](https://mailchimp.com) (or
   [convertkit.com](https://convertkit.com) — both have generous free tiers).
2. Create an "audience" and grab your API key and Audience ID from account
   settings.
3. Paste them into `backend/.env` (`MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID`).
4. In `server.js`, inside the `/api/newsletter` route, there's a comment
   marking exactly where to add a `fetch()` call to Mailchimp's API to also
   register the subscriber there. Mailchimp's
   [API quick start](https://mailchimp.com/developer/marketing/guides/quick-start/)
   shows the exact request shape.

---

## Step 6 — Put it online (deployment)

Deploying means putting your code on servers other people can reach, instead
of just `localhost` on your machine. Recommended combo for a first project —
all have free tiers:

**Frontend → Netlify**
1. Push this whole folder to a GitHub repository (GitHub Desktop app is the
   easiest way if you're new to Git).
2. Go to [netlify.com](https://netlify.com), sign up, click "Add new site" →
   "Import an existing project" → connect your GitHub repo.
3. Set the "publish directory" to `frontend`.
4. Deploy. Netlify gives you a live URL immediately (e.g.
   `nine-alley.netlify.app`), and redeploys automatically every time you push
   changes to GitHub.

**Backend → Render**
1. Go to [render.com](https://render.com), sign up, click "New" → "Web
   Service" → connect the same GitHub repo.
2. Set the root directory to `backend`, build command to `npm install`, start
   command to `npm start`.
3. Under "Environment", add the same variables from your `.env` file
   (`MONGODB_URI`, `JWT_SECRET`, etc.) — Render needs them entered there
   directly, since your real `.env` file was never uploaded to GitHub.
4. Deploy. Render gives you a live backend URL (e.g.
   `nine-alley-api.onrender.com`).
5. Back in your frontend files (`index.html`, `login.html`, `signup.html`),
   change every `API_BASE = 'http://localhost:4000'` to your new Render URL,
   then push to GitHub again so Netlify redeploys with the fix.

**A custom domain (optional)**
Buy a domain (e.g. `9alley.com`) from Namecheap or Google Domains, then follow
Netlify's "Add custom domain" instructions — it's a guided process of adding
a couple of DNS records.

---

## Step 7 — Basic security checklist before you call it launched

- [ ] `.env` is never committed to GitHub (already handled by `.gitignore`)
- [ ] `JWT_SECRET` is a long random string, not the placeholder text
- [ ] Passwords are never logged or stored in plain text (already handled)
- [ ] Stripe is in **live mode** only once you're actually ready to take
      real payments
- [ ] Your MongoDB Atlas Network Access isn't left wide open forever — once
      you know your Render backend's IP range, restrict it
- [ ] Form inputs are validated on the backend too, not just the frontend
      (already partly handled in `server.js` — extend as you add features)

---

## Glossary (plain-English)

- **API** — a set of URLs your frontend can send requests to, to read or save
  data (e.g. `POST /api/login`).
- **Backend / server** — the program that runs your API and talks to the
  database.
- **Database** — where information is permanently stored (accounts, emails,
  orders).
- **Environment variable (`.env`)** — a secret setting (like a password or
  API key) kept out of your code so it's never accidentally shared.
- **Hashing** — one-way scrambling of a password so even you can't see the
  original.
- **JWT (JSON Web Token)** — a signed piece of text proving a user is logged
  in, without the server needing to remember every session.
- **Deploy** — putting your code on a server the public can reach.
- **Repository (repo)** — a project's code, tracked with Git and hosted on
  GitHub.

## Suggested order to actually do this in

1. Get the backend running locally (Steps 1–3) — confirm signup/login work
   on your machine first.
2. Deploy frontend + backend (Step 6) so you have a real live link to share.
3. Add Stripe checkout (Step 4).
4. Upgrade the newsletter to Mailchimp if you want (Step 5) — this one's
   optional; your own database list works fine to start.

Take it one step at a time — a working local version before a deployed one,
and a deployed one before payments. Each step here is a normal, well-trodden
path; if you get stuck, searching the exact error message you see is almost
always the fastest way to a fix.
