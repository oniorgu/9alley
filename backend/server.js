/**
 * 9 ALLEY — Backend Starter
 * ---------------------------------------------------------
 * This is a beginner-friendly Express server. It gives you three
 * working endpoints your frontend can already talk to:
 *
 *   POST /api/signup      — create an account (name, email, password)
 *   POST /api/login       — log in (email, password) -> returns a token
 *   POST /api/newsletter  — save an email address to the newsletter list
 *
 * Read README.md first — it explains every concept used in this file
 * (what an API is, what MongoDB is, what a JWT is, etc.) step by step.
 * This file is intentionally kept in ONE file so it's easy to read
 * top to bottom as a beginner. Once you're comfortable, you'd normally
 * split this into routes/, models/, controllers/ folders.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-your-.env-file';

// ---------------------------------------------------------------
// MIDDLEWARE — things that run on every request before your routes
// ---------------------------------------------------------------
app.use(cors());          // lets your frontend (a different URL) call this API
app.use(express.json());  // lets the server read JSON sent from the frontend

// ---------------------------------------------------------------
// DATABASE — connect to MongoDB (see README for how to get a free one)
// ---------------------------------------------------------------
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// A "schema" describes the shape of the data you're storing.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  subscribedAt: { type: Date, default: Date.now }
});
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

// ---------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------

// Health check — visit http://localhost:4000/ to confirm the server is running
app.get('/', (req, res) => {
  res.send('9 Alley API is running.');
});

// --- SIGN UP -----------------------------------------------------
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are all required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }

    // NEVER store plain-text passwords. bcrypt turns the password into
    // a scrambled "hash" that can be checked later but not reversed.
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

    res.status(201).json({ message: 'Account created.', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong creating your account.' });
  }
});

// --- LOG IN --------------------------------------------------------
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    // A JWT ("JSON Web Token") is a signed string that proves who the
    // user is on future requests, without the server having to store
    // sessions in memory. The frontend saves this and sends it back
    // with requests that need to know who's logged in.
    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ message: 'Logged in.', token, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong logging you in.' });
  }
});

// --- NEWSLETTER ------------------------------------------------------
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'An email address is required.' });
    }

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.json({ message: "You're already on the list." });
    }

    await Subscriber.create({ email: email.toLowerCase() });

    // OPTIONAL UPGRADE: instead of (or in addition to) storing the email
    // yourself, you can send it straight to a service like Mailchimp or
    // ConvertKit so you get unsubscribe handling, email templates and
    // analytics for free. README.md shows exactly where that API call
    // would go here.

    res.status(201).json({ message: "You're on the list." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong signing you up.' });
  }
});

// --- EXAMPLE: A ROUTE THAT REQUIRES LOGIN --------------------------
// This shows the pattern for "protected" routes — pages/actions only
// a logged-in user should reach, like "view my orders" or "my account".
function requireLogin(req, res, next) {
  const authHeader = req.headers.authorization; // expected: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'You must be logged in.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}

app.get('/api/account', requireLogin, async (req, res) => {
  const user = await User.findById(req.user.userId).select('name email createdAt');
  res.json(user);
});

// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🎲 9 Alley API listening on http://localhost:${PORT}`);
});
