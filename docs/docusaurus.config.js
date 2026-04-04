import { themes as prismThemes } from "prism-react-renderer";

// This config styles and structures the docs site. Product logic belongs in the app.
/** @type {import('@docusaurus/types').Config} */
const config = {
	title: "Instagram Archive Viewer Docs",
	tagline: "Run it locally, export it cleanly, or plan the hosted platform properly.",
	favicon: "img/favicon.ico",
	future: {
		v4: true,
	},
	url: "https://archive-docs.aveson.co.uk",
	baseUrl: "/",
	organizationName: "AvesonThyBot",
	projectName: "instagram-archive-viewer",
	onBrokenLinks: "throw",
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},
	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.js",
					routeBasePath: "/",
				},
				blog: false,
				theme: {
					customCss: "./src/css/custom.css",
				},
			},
		],
	],
	themeConfig: {
		image: "img/docusaurus-social-card.jpg",
		colorMode: {
			defaultMode: "dark",
			disableSwitch: false,
			respectPrefersColorScheme: false,
		},
		navbar: {
			title: "IAV",
			logo: {
				alt: "IAV logo",
				src: "img/iav-logo.svg",
			},
			items: [
				{
					to: "/intro",
					position: "left",
					label: "Overview",
					activeBaseRegex: "^/$|^/intro/?$",
				},
				{
					to: "/installation/downloading-data",
					label: "Setup",
					position: "left",
					activeBaseRegex: "^/installation/",
				},
				{
					to: "/deployment/self-hosting",
					label: "Deploy",
					position: "left",
					activeBaseRegex: "^/deployment/",
				},
				{
					to: "/platform/hosted-service",
					label: "Hosted Platform",
					position: "left",
					activeBaseRegex: "^/platform/",
				},
				{
					href: "https://github.com/avesonthybot",
					position: "right",
					className: "header-github-link",
					"aria-label": "GitHub repository",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Product",
					items: [
						{ label: "Overview", to: "/" },
						{ label: "Viewer Guide", to: "/instagram-archive-viewer/usage" },
						{ label: "Hosted Platform", to: "/platform/hosted-service" },
					],
				},
				{
					title: "Deployment",
					items: [
						{ label: "Self-hosting", to: "/deployment/self-hosting" },
						{ label: "Cloudflare Pages", to: "/deployment/cloudflare-pages" },
						{ label: "Bundle Format", to: "/deployment/data-bundle-format" },
					],
				},
				{
					title: "Links",
					items: [
						{ label: "Main site", href: "https://archive.aveson.co.uk" },
						{
							label: "Repository",
							href: "https://github.com/avesonthybot",
						},
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Instagram Archive Viewer.`,
		},
		prism: {
			theme: prismThemes.vsDark,
			darkTheme: prismThemes.oneDark,
		},
	},
};

export default config;
