import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const featureList = [
	{
		title: "Local-first viewer",
		description:
			"Understand the current app architecture, SQLite pipeline, selective exports, and the local privacy model before you host anything.",
	},
	{
		title: "Self-hosted packages",
		description:
			"Follow the deployment guides for static builds, Cloudflare Pages, Wrangler, and a cleaner hosted copy that only includes the chosen DMs.",
	},
	{
		title: "Hosted roadmap",
		description:
			"Document the future service at archive.aveson.co.uk, including OAuth, Supabase metadata, encrypted storage links, and user-owned archive bundles.",
	},
];

function Feature({ title, description }) {
	return (
		<article className={styles.featureCard}>
			<div className={styles.featureBadge} />
			<Heading as="h3">{title}</Heading>
			<p>{description}</p>
		</article>
	);
}

export default function HomepageFeatures() {
	return (
		<section className={styles.features}>
			<div className="container">
				<div className={styles.header}>
					<p className={styles.kicker}>What this docs site covers</p>
					<Heading as="h2">A practical manual for the viewer today and the platform later.</Heading>
				</div>
				<div className={styles.grid}>
					{featureList.map((feature) => (
						<Feature key={feature.title} {...feature} />
					))}
				</div>
			</div>
		</section>
	);
}
