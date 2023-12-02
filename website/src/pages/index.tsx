import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import LogoSvg from '@site/static/img/logo.svg';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="container">
      <div className="text-center mt-10">
        <LogoSvg className="w-40 h-40" />
        <h1 className="text-5xl">
          <span className="text-gradient font-bold">{siteConfig.title}</span>
        </h1>
        <p className="opacity-60 text-2xl">{siteConfig.tagline}</p>
        <p className="opacity-60">
          Tianji brings all your commonly used tools together in one place
        </p>
        <div className="text-xl">
          <span className="underline font-semibold">Website analytics</span> +{' '}
          <span className="underline font-semibold">Uptime Monitor</span> +{' '}
          <span className="underline font-semibold">Server Status</span> ={' '}
          <span className="text-gradient font-bold">Tianji</span>
        </div>
      </div>

      <div className="text-center my-6">
        {/* <Link
          className="button button--primary button--lg"
          to="mailto:moonrailgun@gmail.com?subject=I want to apply for Tianji early access account&body=Here is my account: <Here place your username>"
        >
          Early Access
        </Link> */}
        <Link
          className="button button--primary button--lg"
          to="https://demo.tianji.msgbyte.com"
        >
          Visit Demo
        </Link>
      </div>
    </header>
  );
}

function HomepageMain() {
  return (
    <main className="container pb-8">
      <div className="flex flex-wrap gap-2 justify-around mt-4 mb-8">
        <div className="px-4 py-2 border rounded border-solid border-gray-300 checked-item">
          ✔ No cookies
        </div>
        <div className="px-4 py-2 border rounded border-solid border-gray-300 checked-item">
          ✔ GDPR & CCPA compliant
        </div>
        <div className="px-4 py-2 border rounded border-solid border-gray-300 checked-item">
          ✔ Open API
        </div>
        <div className="px-4 py-2 border rounded border-solid border-gray-300 checked-item">
          ✔ Open Source
        </div>
      </div>

      <div className="text-center">
        <div className="border-8 border-solid border-gray-200 rounded-lg shadow-lg">
          <Carousel
            className="cursor-move"
            showThumbs={false}
            showStatus={false}
            showIndicators={true}
            autoPlay={true}
            swipeable={true}
            interval={5000}
            stopOnHover={true}
            emulateTouch={true}
            infiniteLoop={true}
          >
            <img src="/img/preview1.png" />
            <img src="/img/preview2.png" />
            <img src="/img/preview3.png" />
          </Carousel>
        </div>
      </div>
    </main>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <HomepageHeader />

      <HomepageMain />
    </Layout>
  );
}
