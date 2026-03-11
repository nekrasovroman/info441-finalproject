import crypto from "crypto";
import User from "../models/User.js";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString();
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }
  return secret;
}

export function createAuthToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export function verifyAuthToken(token) {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) {
    throw new Error("Invalid token");
  }

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (signature !== expected) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(base64UrlDecode(body));
  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error("Token expired");
  }

  return payload;
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = header.slice("Bearer ".length);
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = {
      userId: String(user._id),
      accountId: String(user.accountId),
      role: user.role,
      fullName: user.fullName,
      email: user.email
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireManager(req, res, next) {
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

export async function hashPassword(password) {
  return await new Promise((resolve, reject) => {
    crypto.scrypt(password, "crm-salt", 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

export async function comparePassword(password, passwordHash) {
  const candidate = await hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(passwordHash));
}
