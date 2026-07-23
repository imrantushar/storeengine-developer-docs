import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    icon: '🧩',
    title: 'Build Addons',
    to: '/addons/architecture',
    description: (
      <>
        Extend StoreEngine with the same addon framework the core uses. One base
        class, automatic registration, settings and schema management out of the
        box.
      </>
    ),
  },
  {
    icon: '🔌',
    title: 'REST API',
    to: '/rest-api/overview',
    description: (
      <>
        A complete <code>storeengine/v1</code> REST API for cart, checkout,
        orders, products, subscriptions and payments — for headless and
        integration use.
      </>
    ),
  },
  {
    icon: '🪝',
    title: 'Hooks & Filters',
    to: '/reference/hooks/actions',
    description: (
      <>
        Hundreds of <code>storeengine/</code> actions and filters across the
        order lifecycle, checkout, cart, pricing and email.
      </>
    ),
  },
  {
    icon: '🗄️',
    title: 'Data & Objects',
    to: '/data/orders',
    description: (
      <>
        Work with Orders, Products, the Cart, Customers, Coupons and
        Subscriptions through clean, table-backed domain classes.
      </>
    ),
  },
  {
    icon: '🎨',
    title: 'Templates & Blocks',
    to: '/reference/templates',
    description: (
      <>
        Override any storefront template from your theme, or render StoreEngine
        shortcodes as native Gutenberg blocks.
      </>
    ),
  },
  {
    icon: '💳',
    title: 'Payment Gateways',
    to: '/reference/payment-gateways',
    description: (
      <>
        Register your own payment gateway on top of the abstract gateway class
        and plug it into checkout.
      </>
    ),
  },
];

function Feature({ icon, title, description, to }) {
  return (
    <div className={clsx('col col--4')}>
      <Link to={to} className={styles.featureCard}>
        <div className={styles.featureIcon} aria-hidden="true">
          {icon}
        </div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </Link>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
