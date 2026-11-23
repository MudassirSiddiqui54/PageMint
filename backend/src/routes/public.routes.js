import { Router } from "express";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import BirthdayPage from "../models/BirthdayPage.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();
const wishLimiter = rateLimit({
	windowMs: 60_000,
	limit: 8,
	standardHeaders: "draft-7",
	legacyHeaders: false,
	message: { message: "Please slow down before sending another wish." },
});
router.get(
	"/profiles/:alias",
	asyncHandler(async (req, res) => {
		const alias = req.params.alias.toLowerCase();
		const user = await User.findOneAndUpdate(
			{ "profile.alias": alias, "profile.published": { $ne: false } },
			{ $inc: { "profile.stats.views": 1 } },
			{ new: true },
		).select("username profile");
		if (!user)
			throw new HttpError(
				404,
				"This page does not exist or is unpublished.",
			);
		const profile = user.profile.toObject
			? user.profile.toObject()
			: user.profile;
		res.set("Cache-Control", "no-store");
		res.json({
			profile: {
				...profile,
				links: profile.links.filter((link) => link.enabled),
				products: profile.products.filter((product) => product.enabled),
			},
		});
	}),
);
router.get(
	"/birthday/:alias",
	asyncHandler(async (req, res) => {
		const page = await BirthdayPage.findOne({
			alias: req.params.alias.toLowerCase(),
			published: true,
		}).select("-owner");
		if (!page)
			throw new HttpError(
				404,
				"This birthday page does not exist or is unpublished.",
			);
		const payload = page.toObject();
		const birthday = payload.dateOfBirth
			? new Date(payload.dateOfBirth)
			: null;
		delete payload.dateOfBirth; // Do not expose the recipient's birth year publicly.
		if (birthday && !Number.isNaN(birthday.getTime())) {
			payload.birthdayMonth = birthday.getUTCMonth() + 1;
			payload.birthdayDay = birthday.getUTCDate();
			payload.birthdayDateLabel = new Date(
				Date.UTC(2024, payload.birthdayMonth - 1, payload.birthdayDay),
			).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				timeZone: "UTC",
			});
		}
		res.set("Cache-Control", "no-store");
		res.json({ page: payload });
	}),
);
router.post(
	"/birthday/:alias/wishes",
	wishLimiter,
	asyncHandler(async (req, res) => {
		const name = String(req.body?.name || "A friend")
			.trim()
			.slice(0, 80);
		const message = String(req.body?.message || "")
			.trim()
			.slice(0, 500);
		if (message.length < 2)
			throw new HttpError(400, "Write a birthday wish first.");
		const page = await BirthdayPage.findOne({
			alias: req.params.alias.toLowerCase(),
			published: true,
		});
		if (!page) throw new HttpError(404, "Birthday page not found.");
		page.wishes.push({ name, message });
		if (page.wishes.length > 500)
			page.wishes.splice(0, page.wishes.length - 500);
		await page.save();
		const wish = page.wishes[page.wishes.length - 1];
		res.status(201).json({ message: "Your wish has been added.", wish });
	}),
);
export default router;
