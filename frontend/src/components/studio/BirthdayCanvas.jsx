import { useEffect, useRef } from "react";
import { Cake, Heart, ImagePlus, Sparkles, Gift } from "lucide-react";
import { pageBackgrounds, pageThemes, typefaces } from "../../lib/presets";
import { cardAppearanceStyles, gradientToCss } from "../../lib/backgrounds";
import { StickerArt } from "./StickerArt";
import TextCanvasItems from "./TextCanvasItems";

const defaults = {
	headline: { x: 50, y: 90, width: 88 },
	recipientName: { x: 50, y: 160, width: 88 },
	birthdayDate: { x: 50, y: 245, width: 88 },
	countdown: { x: 50, y: 300, width: 88 },
	birthdayMessage: { x: 50, y: 360, width: 88 },
	cover: { x: 50, y: 500, width: 88 },
	gallery: { x: 50, y: 920, width: 90 },
	wishes: { x: 50, y: 1420, width: 88 },
};

function useBirthdayFont(names) {
	const fontNames = Array.isArray(names) ? names : [names];
	const key = fontNames.join("|");
	useEffect(() => {
		if (typeof document === "undefined") return;
		fontNames.forEach((rawName) => {
			const match = String(rawName || "").match(/[\"']([^\"']+)[\"']/);
			const name = match?.[1] || String(rawName || "");
			if (
				!name ||
				[
					"inherit",
					"Georgia",
					"Arial",
					"monospace",
					"cursive",
				].includes(name)
			)
				return;
			const id = `pagemint-birthday-font-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
			if (document.getElementById(id)) return;
			const link = document.createElement("link");
			link.id = id;
			link.rel = "stylesheet";
			link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;500;600;700;800&display=swap`;
			document.head.appendChild(link);
		});
	}, [key]);
}

function CanvasNode({
	id,
	position = {},
	flow = false,
	editable,
	selected,
	onSelect,
	onMove,
	className = "",
	style = {},
	children,
}) {
	const drag = useRef(null);
	const onPointerDown = (event) => {
		if (
			!editable ||
			event.button !== 0 ||
			event.target.closest("[data-no-drag]")
		)
			return;
		const stage = event.currentTarget.closest(".pm-bday-stage");
		const stageBounds = stage?.getBoundingClientRect();
		const nodeBounds = event.currentTarget.getBoundingClientRect();
		if (!stageBounds) return;
		drag.current = {
			x:
				((nodeBounds.left + nodeBounds.width / 2 - stageBounds.left) /
					stageBounds.width) *
				100,
			y: nodeBounds.top - stageBounds.top,
			startX: event.clientX,
			startY: event.clientY,
			width: stageBounds.width,
		};
		event.currentTarget.setPointerCapture?.(event.pointerId);
		onSelect?.(id);
	};
	const onPointerMove = (event) => {
		if (!drag.current) return;
		onMove?.(id, {
			x: Math.max(
				3,
				Math.min(
					97,
					drag.current.x +
						((event.clientX - drag.current.startX) /
							drag.current.width) *
							100,
				),
			),
			y: Math.max(
				0,
				Math.min(
					9000,
					drag.current.y + event.clientY - drag.current.startY,
				),
			),
		});
	};
	const positionedStyle = flow
		? {
				position: "relative",
				left: "auto",
				top: "auto",
				width: "100%",
				transform: "none",
			}
		: {
				position: "absolute",
				left: `${position.x ?? 50}%`,
				top: `${position.y ?? 0}px`,
				width: `${position.width ?? 88}%`,
				transform: `translateX(-50%) rotate(${position.rotation || 0}deg)`,
			};
	return (
		<div
			className={`pm-bday-node ${flow ? "is-flow" : ""} ${editable ? "is-editable" : ""} ${selected ? "is-selected" : ""} ${className}`}
			style={{
				...positionedStyle,
				boxSizing: "border-box",
				height: position.height ? `${position.height}px` : undefined,
				fontSize: position.fontSize
					? `${position.fontSize}px`
					: undefined,
				fontWeight: position.fontWeight || undefined,
				letterSpacing: position.letterSpacing
					? `${position.letterSpacing}px`
					: undefined,
				padding:
					position.padding !== undefined
						? `${position.padding}px`
						: undefined,
				borderRadius:
					position.borderRadius !== undefined
						? `${position.borderRadius}px`
						: undefined,
				background: position.nodeBackground || undefined,
				color: position.nodeColor || undefined,
				boxShadow: position.boxShadow || undefined,
				textShadow: position.textShadow || undefined,
				border: position.borderWidth
					? `${position.borderWidth}px solid ${position.borderColor || "currentColor"}`
					: undefined,
				...style,
			}}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={() => {
				drag.current = null;
			}}
			onPointerCancel={() => {
				drag.current = null;
			}}
			onClick={() => editable && onSelect?.(id)}
		>
			{children}
			{editable && <span className="pm-bday-drag-label">DRAG</span>}
		</div>
	);
}

function birthdayDateLabel(value) {
	if (!value) return "The special day";
	if (!/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value);
	const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
	if (Number.isNaN(date.getTime())) return "The special day";
	return date.toLocaleDateString(undefined, {
		month: "long",
		day: "numeric",
	});
}

function styleFor(styles, key, fallback = {}) {
	return { ...fallback, ...(styles?.[key] || {}) };
}

function textStyle(style, defaults = {}) {
	return {
		fontFamily: style.fontFamily || defaults.fontFamily,
		fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
		fontWeight: style.fontWeight || undefined,
		fontStyle: style.fontStyle || undefined,
		lineHeight: style.lineHeight || undefined,
		letterSpacing: style.letterSpacing
			? `${style.letterSpacing}px`
			: undefined,
		color: style.color || undefined,
		textAlign: style.textAlign || undefined,
		textShadow: style.textShadow || undefined,
		opacity: style.opacity ?? 1,
	};
}

function CelebrationEffects({ effects = [], settings = {} }) {
	const count = (key, fallback, min, max) =>
		Math.max(min, Math.min(max, Number(settings[key] ?? fallback)));
	const particles = (amount, type) =>
		Array.from({ length: amount }, (_, i) => (
			<i
				key={`${type}-${i}`}
				style={{
					"--x": `${((i * 7919) % 997) / 10}%`,
					"--delay": `${-((i * 37) % 170) / 10}s`,
					"--duration": `${type === "rain" ? 0.65 + (i % 8) * 0.09 : 6 + (i % 11) * 1.1}s`,
					"--size": `${type === "snow" ? 2 + (i % 7) * 0.8 : 1 + (i % 3) * 0.35}px`,
					"--drift": `${((i * 19) % 90) - 45}px`,
					"--top": `${type === "sparkle" ? (i * 23) % 100 : -((i * 23) % 100)}%`,
				}}
			/>
		));
	return (
		<div className="pm-bday-page-effects" aria-hidden="true">
			{effects.includes("snow") && (
				<div className="pm-bday-weather pm-weather-snow">
					{particles(count("snowAmount", 42, 8, 120), "snow")}
				</div>
			)}
			{effects.includes("rain") && (
				<div className="pm-bday-weather pm-weather-rain">
					{particles(count("rainAmount", 48, 8, 120), "rain")}
				</div>
			)}
			{effects.includes("wind") && (
				<div className="pm-bday-weather pm-weather-wind">
					{particles(count("windAmount", 4, 1, 10), "wind")}
				</div>
			)}
			{effects.includes("confetti") && (
				<div className="pm-bday-confetti">
					{Array.from({ length: 72 }, (_, i) => (
						<i
							key={i}
							style={{
								"--i": i,
								"--x": `${(i * 37) % 100}%`,
								"--delay": `${-((i * 13) % 90) / 10}s`,
								"--hue": `${(i * 47) % 360}deg`,
							}}
						/>
					))}
				</div>
			)}
			{effects.includes("fireworks") && (
				<div className="pm-bday-fireworks">
					<i />
					<i />
					<i />
					<i />
					<i />
				</div>
			)}
			{effects.includes("balloons") && (
				<div className="pm-bday-floating-balloons">
					<i />
					<i />
					<i />
					<i />
					<i />
				</div>
			)}
			{effects.includes("sparkles") && (
				<div className="pm-bday-sparkle-layer">
					{particles(count("sparklesAmount", 18, 4, 60), "sparkle")}
				</div>
			)}
			{effects.includes("sparklers") && (
				<div className="pm-bday-sparklers">
					<i />
					<i />
					<i />
					<i />
				</div>
			)}
		</div>
	);
}

export default function BirthdayCanvas({
	page,
	editable = false,
	selected = "",
	onSelect,
	onMove,
	onAddMemory,
	onCelebrate,
	wishContent,
}) {
	const appearance = page.appearance || {};
	const bg =
		pageBackgrounds.find(
			(item) => item.id === Number(appearance.backgroundId ?? 0),
		) || pageBackgrounds[0];
	const theme = appearance.theme || pageThemes[4];
	const font =
		typefaces.find(
			(item) => item.id === Number(appearance.typeface ?? 6),
		) || typefaces[6];
	const styles = appearance.elementStyles || {};
	useBirthdayFont([
		font.name,
		...Object.values(styles)
			.map((item) => item?.fontFamily)
			.filter(Boolean),
	]);
	const savedLayout = appearance.layout || {};
	const visibility = appearance.visibility || {};
	const isVisible = (key) => visibility[key] !== false;
	const nodePosition = (id) => ({
		...defaults[id],
		...(savedLayout[id] || {}),
	});
	const isFlow = (id) =>
		!Object.prototype.hasOwnProperty.call(savedLayout, id);
	const gallery = page.gallery || [];
	const stickerItems = appearance.stickerItems || [];
	const textItems = appearance.textItems || [];
	const galleryLayout = appearance.galleryLayout || "collage";
	const effectSettings = appearance.effectSettings || {};
	const cardBackground =
		pageBackgrounds.find(
			(item) => item.id === Number(appearance.cardBackgroundId ?? 0),
		) || pageBackgrounds[0];
	const activeCelebration = (appearance.effects || []).some((effect) =>
		["confetti", "fireworks"].includes(effect),
	);
	const birthdayMonth =
		page.birthdayMonth ||
		(page.dateOfBirth
			? Number(String(page.dateOfBirth).slice(5, 7))
			: null);
	const birthdayDay =
		page.birthdayDay ||
		(page.dateOfBirth
			? Number(String(page.dateOfBirth).slice(8, 10))
			: null);
	let countdownLabel = page.countdownLabel || "";
	if (!countdownLabel && birthdayMonth && birthdayDay) {
		const now = new Date();
		let next = new Date(now.getFullYear(), birthdayMonth - 1, birthdayDay);
		if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate()))
			next = new Date(
				now.getFullYear() + 1,
				birthdayMonth - 1,
				birthdayDay,
			);
		const days = Math.round(
			(new Date(next.getFullYear(), next.getMonth(), next.getDate()) -
				new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
				86400000,
		);
		countdownLabel =
			days === 0
				? "Today is the day — let the celebration begin!"
				: `${days} days until the celebration`;
	}

	const sectionHeights = {
		headline: 72,
		recipientName: 86,
		birthdayDate: 54,
		countdown: 38,
		birthdayMessage: 190,
		cover: appearance.coverHeight || 300,
		gallery: Math.max(260, 260 + Math.ceil(gallery.length / 3) * 220),
		wishes: 340,
	};
	const positionedBottom = Object.entries(savedLayout).reduce(
		(bottom, [id, position]) => {
			if (visibility[id] === false) return bottom;
			return Math.max(
				bottom,
				Number(position.y || 0) + (sectionHeights[id] || 120),
			);
		},
		0,
	);
	const extrasBottom = Math.max(
		positionedBottom,
		0,
		...stickerItems.map((item) => (item.y || 0) + (item.size || 72) + 70),
		...textItems.map(
			(item) => (item.y || 0) + (item.fontSize || 24) * 4 + 80,
		),
	);
	const pageGradient = gradientToCss(appearance.backgroundGradient);
	const cardGradient = gradientToCss(appearance.cardBackgroundGradient);
	const pageStyle = {
		minHeight: `max(100vh, ${extrasBottom + 220}px)`,
		color: theme.text || "#30243a",
		backgroundColor:
			appearance.backgroundColor || theme.background || bg.color,
		backgroundImage:
			pageGradient ||
			(appearance.backgroundImageUrl
				? `url(${appearance.backgroundImageUrl})`
				: bg.image || "none"),
		backgroundSize:
			pageGradient || appearance.backgroundImageUrl
				? "cover"
				: bg.size || "cover",
		backgroundPosition: "center",
		fontFamily: font.value,
		textAlign: appearance.alignment || "center",
		"--pm-bday-accent": theme.accent || "#d46b91",
		"--pm-bday-text": theme.text || "#30243a",
		"--pm-card-bg": appearance.cardBackgroundColor || cardBackground.color,
	};
	const cardMinHeight = extrasBottom ? `${extrasBottom + 100}px` : "auto";
	const cardStyle = {
		minHeight: cardMinHeight,
		color: theme.text || "#30243a",
		fontFamily: font.value,
		textAlign: appearance.alignment || "center",
		backgroundColor: appearance.cardBackgroundColor || cardBackground.color,
		backgroundImage:
			cardGradient ||
			appearance.cardBackgroundImage ||
			cardBackground.image ||
			"none",
		backgroundSize: cardGradient
			? "cover"
			: appearance.cardBackgroundSize || cardBackground.size || "cover",
		"--pm-bday-accent": theme.accent || "#d46b91",
		...cardAppearanceStyles(appearance),
	};
	const effectList = appearance.effects || [];

	return (
		<main
			className={`pm-bday-page pm-bday-gallery-${galleryLayout} ${editable ? "is-studio" : ""}`}
			style={pageStyle}
		>
			<CelebrationEffects
				effects={effectList}
				settings={effectSettings}
			/>
			<div
				className="pm-bday-stage pm-profile-card"
				data-card-background={appearance.cardBackgroundId ?? 0}
				style={cardStyle}
			>
				<div className="pm-bday-flow">
					{isVisible("eyebrow") && (
						<div className="pm-bday-eyebrow">
							<Sparkles size={14} /> A PAGE MADE JUST FOR YOU
						</div>
					)}
					{isVisible("headline") && (
						<CanvasNode
							id="headline"
							position={nodePosition("headline")}
							flow={isFlow("headline")}
							editable={editable}
							selected={selected === "headline"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-bday-headline-node"
						>
							<p
								className="pm-bday-overline"
								style={textStyle(
									styleFor(styles, "headline", {
										fontSize: 24,
										fontWeight: 500,
									}),
								)}
							>
								{page.headline ||
									"A little celebration, made just for you"}
							</p>
						</CanvasNode>
					)}
					{isVisible("recipientName") && (
						<CanvasNode
							id="recipientName"
							position={nodePosition("recipientName")}
							flow={isFlow("recipientName")}
							editable={editable}
							selected={selected === "recipientName"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-bday-recipient-node"
						>
							<h1
								style={textStyle(
									styleFor(styles, "recipientName", {
										fontSize: 36,
										fontWeight: 800,
									}),
								)}
							>
								{page.recipientName || "Someone wonderful"}
							</h1>
						</CanvasNode>
					)}
					{isVisible("birthdayDate") && (
						<CanvasNode
							id="birthdayDate"
							position={nodePosition("birthdayDate")}
							flow={isFlow("birthdayDate")}
							editable={editable}
							selected={selected === "birthdayDate"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-bday-date-node"
						>
							<div
								className="pm-bday-date"
								style={textStyle(
									styleFor(styles, "birthdayDate", {
										fontSize: 14,
										fontWeight: 700,
									}),
								)}
							>
								<Cake size={16} />
								<span>
									{birthdayDateLabel(
										page.dateOfBirth ||
											page.birthdayDateLabel,
									)}
								</span>
							</div>
						</CanvasNode>
					)}
					{isVisible("countdown") && countdownLabel && (
						<CanvasNode
							id="countdown"
							position={nodePosition("countdown")}
							flow={isFlow("countdown")}
							editable={editable}
							selected={selected === "countdown"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-bday-countdown-node"
						>
							<div
								className="pm-bday-countdown"
								style={textStyle(
									styleFor(styles, "countdown", {
										fontSize: 13,
										fontWeight: 700,
									}),
								)}
							>
								{countdownLabel}
							</div>
						</CanvasNode>
					)}
					{isVisible("birthdayMessage") && (
						<CanvasNode
							id="birthdayMessage"
							position={nodePosition("birthdayMessage")}
							flow={isFlow("birthdayMessage")}
							editable={editable}
							selected={selected === "birthdayMessage"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-bday-message-node"
						>
							<p
								className="pm-bday-message"
								style={textStyle(
									styleFor(styles, "birthdayMessage", {
										fontSize: 23,
										fontWeight: 400,
										lineHeight: 1.55,
									}),
								)}
							>
								{page.message}
							</p>
						</CanvasNode>
					)}

					{editable && (
						<small className="pm-bday-hint">
							Select individual text elements to style or drag
							them
						</small>
					)}
				</div>
				{!editable && activeCelebration && (
					<button
						type="button"
						className="pm-bday-celebrate"
						onClick={onCelebrate}
					>
						<Sparkles size={16} /> Make a little noise
					</button>
				)}
				{isVisible("cover") && (
					<CanvasNode
						id="cover"
						position={nodePosition("cover")}
						flow={isFlow("cover")}
						editable={editable}
						selected={selected === "cover"}
						onSelect={onSelect}
						onMove={onMove}
						className="pm-bday-cover-node"
						style={{
							"--pm-cover-radius": `${appearance.coverRadius ?? 16}px`,
							height: `${appearance.coverHeight || 300}px`,
						}}
					>
						{page.cover?.url ? (
							<img
								src={page.cover.url}
								alt="Birthday cover"
								style={{
									objectFit: appearance.coverFit || "cover",
								}}
							/>
						) : (
							<div className="pm-bday-cover-empty">
								<Gift size={46} />
								<span>A little surprise is waiting</span>
							</div>
						)}
						{editable && (
							<button
								data-no-drag
								type="button"
								className="pm-bday-image-action"
								onClick={() => onSelect?.("cover")}
							>
								<ImagePlus size={15} /> Change cover
							</button>
						)}
					</CanvasNode>
				)}

				{isVisible("gallery") &&
					(gallery.length > 0 ? (
						<CanvasNode
							id="gallery"
							position={nodePosition("gallery")}
							flow={isFlow("gallery")}
							editable={editable}
							selected={selected === "gallery"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-bday-gallery-node"
						>
							<div className="pm-bday-section-heading">
								<span>THE LITTLE MOMENTS</span>
								<h2>Memories worth keeping</h2>
								<p>
									A collection of moments that make life
									brighter.
								</p>
							</div>
							<div
								className={`pm-bday-gallery-grid layout-${galleryLayout}`}
							>
								{gallery.map((item, index) => (
									<figure
										key={`${item.fileId || item.url}-${index}`}
										className={`memory-${index % 7}`}
									>
										<img
											src={item.url}
											alt={
												item.caption ||
												`Memory ${index + 1}`
											}
										/>
										{item.caption && (
											<figcaption>
												{item.caption}
											</figcaption>
										)}
									</figure>
								))}
							</div>
							{editable && (
								<button
									data-no-drag
									className="pm-bday-add-memory"
									type="button"
									onClick={onAddMemory}
								>
									<ImagePlus size={15} /> Add more memories
								</button>
							)}
						</CanvasNode>
					) : editable ? (
						<CanvasNode
							id="gallery"
							position={nodePosition("gallery")}
							flow={isFlow("gallery")}
							editable
							selected={selected === "gallery"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-bday-empty-gallery"
						>
							<button
								data-no-drag
								type="button"
								onClick={onAddMemory}
							>
								<ImagePlus size={18} /> Add a memory gallery
							</button>
						</CanvasNode>
					) : null)}

				{isVisible("wishes") && (
					<CanvasNode
						id="wishes"
						position={nodePosition("wishes")}
						flow={isFlow("wishes")}
						editable={editable}
						selected={selected === "wishes"}
						onSelect={onSelect}
						onMove={onMove}
						className="pm-bday-wishes-node"
					>
						<div className="pm-bday-wish-mark">
							<Heart size={19} />
						</div>
						<p className="pm-bday-overline">
							A NOTE FROM THE HEART
						</p>
						<h2>You're loved more than you know.</h2>
						<p>
							Today is a reminder of how much joy you bring to the
							people around you.
						</p>
						{!editable && (
							<>
								{wishContent}
								<div className="pm-bday-wishes-wall">
									{(page.wishes || [])
										.slice(-4)
										.reverse()
										.map((wish, index) => (
											<article key={wish._id || index}>
												<b>{wish.name}</b>
												<p>{wish.message}</p>
											</article>
										))}
								</div>
							</>
						)}
					</CanvasNode>
				)}

				<TextCanvasItems
					items={textItems}
					editable={editable}
					selected={selected}
					onSelect={onSelect}
					onMove={(id, point) => onMove?.(`text:${id}`, point)}
				/>
				{stickerItems.map((sticker, index) => (
					<CanvasNode
						key={sticker.id}
						id={`sticker:${sticker.id}`}
						position={{
							x: sticker.x ?? 14 + (index % 5) * 18,
							y: sticker.y ?? 250 + index * 85,
							width: Math.max(5, (sticker.size || 72) / 7),
							rotation: sticker.rotation || 0,
						}}
						editable={editable}
						selected={selected === `sticker:${sticker.id}`}
						onSelect={onSelect}
						onMove={onMove}
						className="pm-bday-sticker-node"
					>
						<StickerArt
							stickerId={sticker.stickerId}
							customUrl={sticker.url}
							size={sticker.size || 72}
							selected={
								editable && selected === `sticker:${sticker.id}`
							}
						/>
					</CanvasNode>
				))}
				<footer className="pm-bday-footer">
					MADE WITH LOVE · PAGEMINT
				</footer>
			</div>
		</main>
	);
}
