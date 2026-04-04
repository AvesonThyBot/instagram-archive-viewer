import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import styles from "./index.module.css";

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext();

	return (
		<header className={styles.heroBanner}>
			<div className="container">
				<div className={styles.heroShell}>
					<div className={styles.heroCopy}>
						<p className={styles.eyebrow}>Instagram Archive Viewer</p>
						<Heading as="h1" className={styles.title}>
							Docs for running, exporting, and hosting your archive safely.
						</Heading>
						<p className={styles.subtitle}>{siteConfig.tagline}</p>
						<div className={styles.buttons}>
							<Link className="button button--primary button--lg" to="/intro">
								Start with the overview
							</Link>
							<Link className="button button--secondary button--lg" to="/deployment/self-hosting">
								Self-host the viewer
							</Link>
						</div>
					</div>

					<div className={styles.heroCard}>
						<div className={styles.heroCardHeader}>
							<span className={styles.heroDot} />
							<span className={styles.heroDot} />
							<span className={styles.heroDot} />
						</div>
						<div className={styles.heroCardBody}>
							<div className={styles.chatHeader}>
								<div className={styles.avatar} />
								<div>
									<strong>Aveson</strong>
									<span>@_aveson</span>
								</div>
							</div>
							<div className={styles.bubbleRowRight}>
								<div className={styles.sentBubble}>Export keeps only the conversations you pick.</div>
							</div>
							<div className={styles.bubbleRowLeft}>
								<div className={styles.receivedBubble}>
									These docs cover local use, self-hosting, Cloudflare deployment, and the hosted service roadmap.
								</div>
							</div>
							<div className={styles.metaStrip}>
								<span>SQLite search</span>
								<span>Selective export</span>
								<span>Privacy-first hosting</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}

export default function Home() {
	return (
		<Layout
			title="Documentation"
			description="Detailed product, export, hosting, and privacy documentation for Instagram Archive Viewer."
		>
			<HomepageHeader />
			<main>
				<HomepageFeatures />
			</main>
		</Layout>
	);
}
