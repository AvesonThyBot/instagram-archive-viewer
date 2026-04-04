/**
 * Explicit sidebar structure keeps the docs grouped like a product manual
 * instead of relying on generated folder order.
 */
const sidebars = {
	docsSidebar: [
		"intro",
		{
			type: "category",
			label: "Installation",
			link: {
				type: "generated-index",
				title: "Installation",
				description:
					"Get your export, prepare the viewer locally, and understand the data pipeline.",
			},
			items: [
				"installation/downloading-data",
				"installation/running-project",
				"installation/using-install-script",
			],
		},
		{
			type: "category",
			label: "Viewer Guide",
			link: {
				type: "generated-index",
				title: "Viewer Guide",
				description:
					"Learn how the inbox, chat view, search, favourites, themes, and exports work.",
			},
			items: [
				"instagram-archive-viewer/usage/index",
				"instagram-archive-viewer/configuration/index",
				"instagram-archive-viewer/troubleshooting/index",
			],
		},
		{
			type: "category",
			label: "Deployment",
			link: {
				type: "generated-index",
				title: "Deployment",
				description:
					"Ship a private self-hosted copy or prepare for a hosted future platform.",
			},
			items: [
				"deployment/self-hosting",
				"deployment/cloudflare-pages",
				"deployment/data-bundle-format",
			],
		},
		{
			type: "category",
			label: "Hosted Platform",
			link: {
				type: "generated-index",
				title: "Hosted Platform",
				description:
					"Document the roadmap for archive.aveson.co.uk, storage links, auth, and privacy.",
			},
			items: [
				"platform/hosted-service",
				"platform/privacy-and-security",
				"platform/roadmap",
			],
		},
		{
			type: "category",
			label: "Community",
			link: {
				type: "generated-index",
				title: "Community",
				description: "Contributor notes, FAQ answers, and development conventions.",
			},
			items: [
				"community/faq",
				"community/dev-notes",
				"community/contributions",
			],
		},
	],
};

export default sidebars;
