import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import LogoSvg from '@site/static/img/logo.svg';
import { Carousel } from 'react-responsive-carousel';
import { Popover } from 'antd';
import { RiDiscordFill, RiTwitterXFill, RiWechatFill } from 'react-icons/ri';
import { BlockCard } from '../components/BlockCard';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="container">
      <div className="text-center mt-10">
        <LogoSvg className="w-40 h-40" />
        <h1 className="text-5xl">
          <span className="text-gradient font-bold">Tianji</span>
        </h1>
        <p className="opacity-60 text-2xl">All-in-One Insight Hub</p>
        <div className="text-xl">
          <span className="text-gradient font-bold">Tianji</span> ={' '}
          <span className="underline font-semibold">Website Analytics</span> +{' '}
          <span className="underline font-semibold">Uptime Monitor</span> +{' '}
          <span className="underline font-semibold">Server Status</span>
        </div>
      </div>

      <div className="text-center my-6">
        {/* <Link
          className="button button--primary button--lg"
          to="mailto:moonrailgun@gmail.com?subject=I want to apply for Tianji early access account&body=Here is my account: <Here place your username>"
        >
          Early Access
        </Link> */}
        {/* <Link
          className="button button--primary button--lg"
          to="https://demo.tianji.msgbyte.com"
        >
          Visit Demo
        </Link> */}

        <div className="w-min m-auto text-left bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg overflow-auto max-w-full">
          <div className="whitespace-nowrap">
            <span className="select-none opacity-50 mr-1">$</span>wget
            https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
          </div>
          <div>
            <span className="select-none opacity-50 mr-1">$</span>docker compose
            up -d
          </div>
        </div>
        <small className="opacity-50">
          Default account is <b>admin</b>/<b>admin</b>, please change password
          ASAP.
        </small>
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

function HomepageFooter() {
  return (
    <div className="text-center py-8">
      <div className="text-2xl font-bold mb-8">Join Our Community</div>

      <div className="flex justify-center gap-4">
        <Popover
          content={<img width={300} src="/img/wechat.jpg" />}
          trigger={'click'}
        >
          <BlockCard
            icon={<RiWechatFill className="text-green-500" />}
            title="Wechat"
            data-tianji-event="community-wechat"
          />
        </Popover>

        <BlockCard
          icon={<RiDiscordFill className="text-indigo-600" />}
          title="Discord"
          data-tianji-event="community-discord"
          onClick={() => window.open('https://discord.gg/8Vv47wAEej')}
        />

        <BlockCard
          icon={<RiTwitterXFill />}
          title="Twitter"
          data-tianji-event="community-twitter"
          onClick={() => window.open('https://twitter.com/moonrailgun')}
        />
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Tianji = Website Analytics + Uptime Monitor + Server Status`}
      description={siteConfig.tagline}
    >
      <HomepageHeader />

      <HomepageMain />

      <HomepageFooter />
    </Layout>
  );
}
