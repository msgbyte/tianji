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
      <div className="mt-10 text-center">
        <LogoSvg className="h-40 w-40" />
        <h1 className="text-5xl">
          <span className="text-gradient font-bold">Tianji</span>
        </h1>
        <p className="text-2xl opacity-60">All-in-One Insight Hub</p>
        <div className="text-xl">
          <span className="text-gradient font-bold">Tianji</span> ={' '}
          <span className="font-semibold underline">Website Analytics</span> +{' '}
          <span className="font-semibold underline">Uptime Monitor</span> +{' '}
          <span className="font-semibold underline">Server Status</span>
        </div>
      </div>

      <div className="my-6 text-center">
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

        <div className="m-auto w-min max-w-full overflow-auto rounded-lg bg-neutral-100 p-2 text-left dark:bg-neutral-800">
          <div className="whitespace-nowrap">
            <span className="mr-1 select-none opacity-50">$</span>wget
            https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
          </div>
          <div>
            <span className="mr-1 select-none opacity-50">$</span>docker compose
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
      <div className="mb-8 mt-4 flex flex-wrap justify-around gap-2">
        <div className="checked-item rounded border border-solid border-gray-300 px-4 py-2">
          ✔ No cookies
        </div>
        <div className="checked-item rounded border border-solid border-gray-300 px-4 py-2">
          ✔ International support
        </div>
        <div className="checked-item rounded border border-solid border-gray-300 px-4 py-2">
          ✔ GDPR & CCPA compliant
        </div>
        <div className="checked-item rounded border border-solid border-gray-300 px-4 py-2">
          ✔ Open API
        </div>
        <div className="checked-item rounded border border-solid border-gray-300 px-4 py-2">
          ✔ Open Source
        </div>
      </div>

      <div className="text-center">
        <div className="rounded-lg border-8 border-solid border-gray-200 shadow-lg">
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
            <img src="/img/preview/1.png" />
            <img src="/img/preview/2.png" />
            <img src="/img/preview/3.png" />
            <img src="/img/preview/4.png" />
            <img src="/img/preview/5.png" />
            <img src="/img/preview/6.png" />
          </Carousel>
        </div>
      </div>
    </main>
  );
}

function HomepageFooter() {
  return (
    <div className="py-8 text-center">
      <div className="mb-8 text-2xl font-bold">Join Our Community</div>

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
