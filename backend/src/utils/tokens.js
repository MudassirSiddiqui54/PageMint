import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import RefreshSession from "../models/RefreshSession.js";

const accessCookie = "pm_access";
const refreshCookie = "pm_refresh";
const commonCookieOptions = {
	httpOnly: true,
	secure: env.nodeEnv === "production",
	sameSite: env.nodeEnv === "production" ? "none" : "lax",
};

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export async function issueTokenPair(userId, res) {
	const jti = randomUUID();
	const refreshToken = jwt.sign(
		{ sub: String(userId), jti, typ: "refresh" },
		env.refreshSecret,
		{
			expiresIn: `${env.refreshDays}d`,
		},
	);
	const accessToken = jwt.sign(
		{ sub: String(userId), typ: "access" },
		env.accessSecret,
		{
			expiresIn: env.accessTtl,
		},
	);
	const expiresAt = new Date(Date.now() + env.refreshDays * 86400000);

	await RefreshSession.create({
		user: userId,
		tokenHash: hashToken(refreshToken),
		jti,
		expiresAt,
	});
	res.cookie(accessCookie, accessToken, {
		...commonCookieOptions,
		path: "/",
		maxAge: env.accessTtlMs,
	});
	res.cookie(refreshCookie, refreshToken, {
		...commonCookieOptions,
		path: "/api/auth",
		maxAge: env.refreshDays * 86400000,
	});
}

export function clearTokenCookies(res) {
	res.clearCookie(accessCookie, { ...commonCookieOptions, path: "/" });
	res.clearCookie(refreshCookie, {
		...commonCookieOptions,
		path: "/api/auth",
	});
}

export function verifyAccessToken(token) {
	const payload = jwt.verify(token, env.accessSecret);
	if (payload.typ !== "access") throw new Error("Invalid token type");
	return payload;
}

export async function rotateRefreshToken(token, res) {
	const payload = jwt.verify(token, env.refreshSecret);
	if (payload.typ !== "refresh" || !payload.sub || !payload.jti)
		throw new Error("Invalid refresh token");
	const tokenHash = hashToken(token);
	const session = await RefreshSession.findOne({
		tokenHash,
		jti: payload.jti,
		user: payload.sub,
		expiresAt: { $gt: new Date() },
	});
	if (!session) {
		await RefreshSession.deleteMany({ user: payload.sub });
		throw new Error("Refresh token expired or already used");
	}

	// Consume the old refresh token before issuing the replacement.
	await RefreshSession.deleteOne({ _id: session._id });
	await issueTokenPair(payload.sub, res);
	return payload.sub;
}

export async function revokeRefreshToken(token) {
	try {
		const payload = jwt.verify(token, env.refreshSecret);
		if (payload.typ === "refresh")
			await RefreshSession.deleteOne({
				tokenHash: hashToken(token),
				jti: payload.jti,
			});
	} catch {
		// Expired or invalid tokens are already unusable; logout remains idempotent.
	}
}
