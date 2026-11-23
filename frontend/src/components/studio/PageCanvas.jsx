import { useEffect, useMemo, useRef } from "react";
import { ArrowUpRight, Globe, Plus, ShoppingBag } from "lucide-react";
import { pageBackgrounds, pageThemes, typefaces } from "../../lib/presets";
import { cardAppearanceStyles, gradientToCss } from "../../lib/backgrounds";
import { LinkIcon } from "./LinkIcon";
import { StickerArt } from "./StickerArt";
import TextCanvasItems from "./TextCanvasItems";

const defaultPositions = {
	avatar: { x: 50, y: 52, width: 136, unit: "px" },
	identity: { x: 50, y: 218, width: 88, unit: "%" },
	linksHeading: { x: 50, y: 356, width: 86, unit: "%" },
	products: { x: 50, y: 760, width: 90, unit: "%" },
};

function useGoogleFont(fontName) {
	useEffect(() => {
		if (!fontName || typeof document === "undefined") return;
		const id = `pagemint-font-${fontName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
		if (document.getElementById(id)) return;
		const link = document.createElement("link");
		link.id = id;
		link.rel = "stylesheet";
		link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
		document.head.appendChild(link);
	}, [fontName]);
}

function canvasLayout(profile) {
	const links = (profile.links || [])
		.filter((link) => link.enabled !== false)
		.sort((a, b) => a.position - b.position);
	const saved = profile.appearance?.layout || {};
	const layout = { ...defaultPositions, ...saved };
	const start = 405;
	links.forEach((link, index) => {
		const key = `link:${link._id}`;
		if (saved[key]) return;
		const grid = profile.appearance?.linkLayout === "grid";
		layout[key] = grid
			? {
					x: index % 2 === 0 ? 27 : 73,
					y: start + Math.floor(index / 2) * 150,
					width: 43,
					unit: "%",
				}
			: { x: 50, y: start + index * 78, width: 86, unit: "%" };
	});
	const startProducts = start + Math.max(links.length, 1) * 78 + 180;
	if (!saved.products)
		layout.products = { ...defaultPositions.products, y: startProducts };
	return layout;
}

function Node({
	id,
	position,
	flow = false,
	flowWidth = "100%",
	editable,
	selected,
	onSelect,
	onMove,
	children,
	className = "",
	style = {},
}) {
	const drag = useRef(null);
	const handlePointerDown = (event) => {
		if (
			!editable ||
			event.button !== 0 ||
			event.target.closest("[data-no-drag]")
		)
			return;
		const stage = event.currentTarget.closest(".pm-page-stage");
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
	const handlePointerMove = (event) => {
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
					7000,
					drag.current.y + event.clientY - drag.current.startY,
				),
			),
		});
	};
	const positionStyle = flow
		? {
				position: "relative",
				left: "auto",
				top: "auto",
				width: flowWidth,
				maxWidth: "100%",
				margin: "0 auto",
				transform: "none",
			}
		: {
				position: "absolute",
				left: `${position.x ?? 50}%`,
				top: `${position.y ?? 0}px`,
				width:
					position.unit === "px"
						? `${position.width}px`
						: `${position.width}%`,
				transform: `translateX(-50%) rotate(${position.rotation || 0}deg)`,
			};
	return (
		<div
			className={`pm-page-node ${flow ? "is-flow" : ""} ${editable ? "is-editable" : ""} ${selected ? "is-selected" : ""} ${className}`}
			style={{
				...positionStyle,
				boxSizing: "border-box",
				height: position.height ? `${position.height}px` : undefined,
				fontSize: position.fontSize
					? `${position.fontSize}px`
					: undefined,
				fontWeight: position.fontWeight || undefined,
				"--pm-node-font-size": position.fontSize
					? `${position.fontSize}px`
					: undefined,
				"--pm-node-font-weight": position.fontWeight || undefined,
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
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={() => {
				drag.current = null;
			}}
			onPointerCancel={() => {
				drag.current = null;
			}}
			onClick={() => editable && onSelect?.(id)}
		>
			{children}
			{editable && <span className="pm-node-drag-hint">Drag</span>}
		</div>
	);
}

export default function PageCanvas({
	profile,
	editable = false,
	selected = "",
	onSelect,
	onMove,
	onLinkAction,
}) {
	const appearance = profile.appearance || {};
	const bg =
		pageBackgrounds.find(
			(item) =>
				item.id ===
				Number(appearance.backgroundId ?? appearance.background ?? 0),
		) || pageBackgrounds[0];
	const theme =
		appearance.theme ||
		pageThemes.find(
			(item) => item.id === Number(appearance.themeId ?? 0),
		) ||
		pageThemes[0];
	const font =
		typefaces.find(
			(item) =>
				item.id === Number(appearance.typeface ?? appearance.font ?? 0),
		) || typefaces[0];
	const cardBackground =
		pageBackgrounds.find(
			(item) => item.id === Number(appearance.cardBackgroundId ?? 0),
		) || pageBackgrounds[0];
	useGoogleFont(font.name);
	const positions = useMemo(() => canvasLayout(profile), [profile]);
	const savedLayout = appearance.layout || {};
	const links = (profile.links || [])
		.filter((link) => link.enabled !== false)
		.sort((a, b) => a.position - b.position);
	const products = (profile.products || [])
		.filter((product) => product.enabled !== false)
		.sort((a, b) => a.position - b.position);
	const linkLayout = appearance.linkLayout || "list";
	const stickerItems = appearance.stickerItems || [];
	const textItems = appearance.textItems || [];

	// Normal content participates in document flow. Only nodes the user has
	// deliberately dragged are absolute; stale layoutHeight values are ignored.
	const activeLayoutIds = new Set([
		"avatar",
		"identity",
		...(products.length || editable ? ["products"] : []),
		...(links.length ? ["linksHeading"] : []),
		...links.map((link) => `link:${link._id}`),
	]);
	const layoutBottom = Object.entries(savedLayout).reduce(
		(bottom, [id, point]) => {
			if (!activeLayoutIds.has(id)) return bottom;
			const height = Number(
				point.height ||
					(id === "avatar"
						? 150
						: id === "identity"
							? 120
							: id === "products"
								? Math.max(260, products.length * 190)
								: id.startsWith("link:")
									? linkLayout === "grid"
										? 120
										: 90
									: 42),
			);
			return Math.max(bottom, Number(point.y || 0) + height);
		},
		0,
	);
	const stickerBottom = stickerItems.length
		? Math.max(
				...stickerItems.map(
					(item) => Number(item.y || 0) + (item.size || 72) + 60,
				),
			)
		: 0;
	const textBottom = textItems.length
		? Math.max(
				...textItems.map(
					(item) =>
						Number(item.y || 0) + (item.fontSize || 24) * 4 + 80,
				),
			)
		: 0;
	const pageHeight = Math.max(layoutBottom, stickerBottom, textBottom);
	const pageGradient = gradientToCss(appearance.backgroundGradient);
	const cardGradient = gradientToCss(appearance.cardBackgroundGradient);
	const pageStyle = {
		minHeight: `max(100vh, ${pageHeight + 80}px)`,
		color: theme.text,
		backgroundColor:
			appearance.backgroundColor || theme.background || bg.color,
		backgroundImage:
			pageGradient ||
			(appearance.backgroundImageUrl
				? `url(${appearance.backgroundImageUrl})`
				: bg.image),
		backgroundSize:
			pageGradient || appearance.backgroundImageUrl ? "cover" : bg.size,
		backgroundPosition: "center",
		fontFamily: font.value,
		"--pm-text": theme.text,
		"--pm-accent": theme.accent,
		"--pm-link-bg": appearance.linkBackground || theme.accent,
		"--pm-card-bg": appearance.cardBackgroundColor || cardBackground.color,
		"--pm-card-texture":
			appearance.cardBackgroundImage || cardBackground.image || "none",
		"--pm-link-text": appearance.linkText || "#FFFFFF",
	};

	return (
		<main
			className={`pm-page-shell pm-align-${appearance.alignment || "center"}`}
			style={pageStyle}
		>
			<div
				className="pm-page-stage pm-profile-card"
				style={{
					minHeight: pageHeight ? `${pageHeight + 40}px` : "auto",
					backgroundColor:
						appearance.cardBackgroundColor || cardBackground.color,
					backgroundImage:
						cardGradient ||
						appearance.cardBackgroundImage ||
						cardBackground.image ||
						"none",
					backgroundSize: cardGradient
						? "cover"
						: appearance.cardBackgroundSize ||
							cardBackground.size ||
							"cover",
					...cardAppearanceStyles(appearance),
				}}
			>
				<div className="pm-page-flow">
					<Node
						id="avatar"
						position={positions.avatar}
						flow={!savedLayout.avatar}
						flowWidth="136px"
						editable={editable}
						selected={selected === "avatar"}
						onSelect={onSelect}
						onMove={onMove}
						className="pm-avatar-node"
					>
						{profile.avatar?.url ? (
							<img
								src={profile.avatar.url}
								alt={`${profile.displayName || "Profile"} profile`}
								style={{
									borderRadius:
										appearance.avatarShape === "circle"
											? "50%"
											: appearance.avatarShape ===
												  "squircle"
												? "28%"
												: appearance.avatarShape ===
													  "rounded"
													? "16px"
													: appearance.avatarShape ===
														  "diamond"
														? "8px"
														: "0",
								}}
							/>
						) : (
							<div
								className="pm-avatar-fallback"
								style={{
									borderRadius:
										appearance.avatarShape === "circle"
											? "50%"
											: appearance.avatarShape ===
												  "squircle"
												? "28%"
												: appearance.avatarShape ===
													  "rounded"
													? "16px"
													: appearance.avatarShape ===
														  "diamond"
														? "8px"
														: "0",
								}}
							>
								{(profile.displayName || profile.alias || "P")
									.slice(0, 1)
									.toUpperCase()}
							</div>
						)}
					</Node>
					<Node
						id="identity"
						position={positions.identity}
						flow={!savedLayout.identity}
						editable={editable}
						selected={selected === "identity"}
						onSelect={onSelect}
						onMove={onMove}
						className="pm-identity-node"
					>
						<h1>{profile.displayName || "Your name"}</h1>
						{profile.bio && <p>{profile.bio}</p>}
						{!profile.bio && editable && (
							<p className="pm-hint-text">
								Add a short introduction
							</p>
						)}
					</Node>
					{links.length > 0 && (
						<>
							<Node
								id="linksHeading"
								position={positions.linksHeading}
								flow={!savedLayout.linksHeading}
								editable={editable}
								selected={
									selected === "linksHeading" ||
									selected === "links"
								}
								onSelect={onSelect}
								onMove={onMove}
								className="pm-links-heading"
							>
								<span>FIND ME ELSEWHERE</span>
							</Node>
							<div
								className={`pm-page-links-flow pm-page-links-${linkLayout}`}
							>
								{links.map((link) => {
									const key = `link:${link._id}`;
									const content = (
										<>
											<span className="pm-link-icon">
												<LinkIcon
													link={link}
													size={22}
												/>
											</span>
											<span className="pm-link-copy">
												<b>{link.label}</b>
												<small>
													{String(link.url || "")
														.replace(
															/^https?:\/\//,
															"",
														)
														.replace(/\/$/, "")}
												</small>
											</span>
											<ArrowUpRight
												size={17}
												className="pm-link-arrow"
											/>
										</>
									);
									return (
										<Node
											key={link._id}
											id={key}
											position={
												positions[key] || {
													x: 50,
													y: 405,
													width: 86,
													unit: "%",
												}
											}
											flow={!savedLayout[key]}
											editable={editable}
											selected={selected === key}
											onSelect={onSelect}
											onMove={onMove}
											className={`pm-link-node pm-link-${linkLayout}`}
										>
											{editable ? (
												<button
													type="button"
													onClick={() =>
														onSelect?.(key)
													}
												>
													{content}
												</button>
											) : (
												<a
													href={link.url}
													target="_blank"
													rel="noreferrer"
													onClick={() =>
														onLinkAction?.(link)
													}
												>
													{content}
												</a>
											)}
										</Node>
									);
								})}
							</div>
						</>
					)}
					{editable && !links.length && (
						<Node
							id="links"
							position={positions.linksHeading}
							flow
							flowWidth="100%"
							editable
							selected={selected === "links"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-empty-node"
						>
							<button
								type="button"
								data-no-drag
								onClick={() => onSelect?.("links")}
							>
								<Plus size={19} /> Add your first link
							</button>
						</Node>
					)}
					{products.length > 0 && (
						<Node
							id="products"
							position={positions.products}
							flow={!savedLayout.products}
							editable={editable}
							selected={selected === "products"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-products-node"
						>
							<div className="pm-section-title">
								<ShoppingBag size={16} />
								<span>MY PICKS & PROJECTS</span>
							</div>
							<div
								className={`pm-products-layout pm-products-${appearance.productLayout || "grid"}`}
							>
								{products.map((product) => (
									<a
										key={product._id}
										className="pm-product-item"
										href={
											editable ? undefined : product.url
										}
										target="_blank"
										rel="noreferrer"
										onClick={(event) =>
											editable &&
											(event.preventDefault(),
											onSelect?.("products"))
										}
									>
										{product.image?.url ? (
											<img
												src={product.image.url}
												alt={product.name}
											/>
										) : (
											<div className="pm-product-placeholder">
												<Globe size={24} />
											</div>
										)}
										<span>
											<b>{product.name}</b>
											{product.description && (
												<small>
													{product.description}
												</small>
											)}
											{product.price && (
												<strong>{product.price}</strong>
											)}
										</span>
									</a>
								))}
							</div>
						</Node>
					)}
					{editable && !products.length && (
						<Node
							id="products"
							position={{ ...positions.products, y: 440 }}
							flow={!savedLayout.products}
							editable
							selected={selected === "products"}
							onSelect={onSelect}
							onMove={onMove}
							className="pm-empty-node"
						>
							<button
								type="button"
								data-no-drag
								onClick={() => onSelect?.("products")}
							>
								<Plus size={18} /> Add a product section
							</button>
						</Node>
					)}
				</div>
				<TextCanvasItems
					items={textItems}
					editable={editable}
					selected={selected}
					onSelect={onSelect}
					onMove={(id, point) => onMove?.(`text:${id}`, point)}
				/>
				{stickerItems.map((sticker, index) => (
					<Node
						key={sticker.id || index}
						id={`sticker:${sticker.id}`}
						position={{
							x: sticker.x ?? 18 + (index % 4) * 20,
							y: sticker.y ?? 900 + Math.floor(index / 4) * 100,
							width: sticker.size || 72,
							unit: "px",
						}}
						editable={editable}
						selected={selected === `sticker:${sticker.id}`}
						onSelect={onSelect}
						onMove={onMove}
						className="pm-sticker-node"
						style={{
							transform: `translateX(-50%) rotate(${sticker.rotation || 0}deg)`,
						}}
					>
						<StickerArt
							stickerId={sticker.stickerId}
							customUrl={sticker.url}
							size={sticker.size || 72}
							selected={
								editable && selected === `sticker:${sticker.id}`
							}
						/>
					</Node>
				))}
				<div className="pm-page-credit">
					made with <b>pagemint</b>
				</div>
			</div>
		</main>
	);
}
