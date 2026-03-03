// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: "IAV",
	tagline: "Instagram Archive Viewer",
	favicon: "img/favicon.ico",

	// Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
	future: {
		v4: true, // Improve compatibility with the upcoming Docusaurus v4
	},

	// Set the production url of your site here
	url: "https://your-docusaurus-site.example.com",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "facebook", // Usually your GitHub org/user name.
	projectName: "docusaurus", // Usually your repo name.

	onBrokenLinks: "throw",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	presets: [
		[
			"classic",
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					sidebarPath: "./sidebars.js",
					// removed edit links for minimalism
				},
				blog: false, // disable blog to strip default template content
				theme: {
					customCss: "./src/css/custom.css",
				},
			}),
		],
	],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		({
			// Replace with your project's social card
			image: "img/docusaurus-social-card.jpg",
			colorMode: {
				respectPrefersColorScheme: false,
			},
			navbar: {
				title: "Instagram Archive Viewer",
				logo: {
					alt: "IAV Logo",
					src: "img/logo.svg",
				},
				items: [
					{
						type: "docSidebar",
						sidebarId: "tutorialSidebar",
						position: "left",
						label: "Docs",
					},
					{
						to: "/docs/tutorial-basics/downloading-data",
						label: "Install",
						position: "left",
					},
					{
						to: "/docs/instagram-archive-viewer/usage",
						label: "IAV",
						position: "left",
					},
					{
						href: "https://github.com/AvesonThyBot/instagram-archive-viewer",
						position: "right",
						className: "header-github-link",
						"aria-label": "GitHub repository",
					},
				],
			},

			footer: {
				style: "dark",
				links: [],
				copyright: `Copyright © ${new Date().getFullYear()} Instagram Archive Viewer.`,
			},
			prism: {
				theme: prismThemes.github,
				darkTheme: prismThemes.dracula,
			},
		}),
};

export default config;
