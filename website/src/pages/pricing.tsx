import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import React, { useState } from 'react';
import { LuCheck } from 'react-icons/lu';
import { Button, Input, message } from 'antd';
import Link from '@docusaurus/Link';
import { submitSurvey, initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://tianji.moonrailgun.com/');

export default function Pricing(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={'Pricing'}
      description="Pricing of Tianji | Insight into everything"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl dark:text-gray-100">
              Pricing
            </h2>
            <p className="mt-3 text-lg text-gray-500 sm:mt-4">
              Choose the plan that's right for your business.
            </p>
          </div>
          <div className="mt-10 lg:col-start-2 lg:mt-0">
            <PlanBlock
              title="Self-Hosting"
              price={
                <>
                  $0
                  <span className="ml-1 text-2xl font-medium text-gray-500">
                    / month
                  </span>
                </>
              }
              desc="Perfect for personal and enterprises with higher requirements for information control."
              features={[
                'Unlimited users',
                'Unlimited storage',
                'Secure data hosting',
                'Community support',
              ]}
              button={
                <Link to="/">
                  <Button className="w-full" size="large">
                    Install with Docker Compose
                  </Button>
                </Link>
              }
            />
          </div>
        </div>
        <div className="mt-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
          <div className="order-2 lg:order-1 lg:col-start-2">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl dark:text-gray-100">
              Cloud Hosting
            </h2>
            <p className="mt-3 text-lg text-gray-500 sm:mt-4">
              Join the waitlist for our cloud hosting solution.
            </p>
            <Waitlist />
          </div>
          <div className="mt-10 lg:col-start-1 lg:mt-0">
            <PlanBlock
              title="Cloud Hosting"
              price={
                <>
                  <span className="mr-1 text-2xl font-medium text-gray-500">
                    From
                  </span>
                  $-
                  <span className="ml-1 text-2xl font-medium text-gray-500">
                    / month
                  </span>
                </>
              }
              desc="Perfect for small to medium-sized businesses which help your business quick start and grow."
              features={[
                'Pay as you need',
                'One click to online',
                'Secure cloud hosting',
                'Email support',
              ]}
              button={
                <Button
                  className="w-full dark:text-gray-400"
                  size="large"
                  disabled
                >
                  Coming Soon...
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

const emailRegex =
  /^[A-Za-z0-9]+([_\.][A-Za-z0-9]+)*@([A-Za-z0-9\-]+\.)+[A-Za-z]{2,6}$/;

export const Waitlist: React.FC = React.memo(() => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    if (!emailRegex.test(email)) {
      message.warning('Is not a valid email');
      return;
    }

    try {
      await submitSurvey(
        'clnzoxcy10001vy2ohi4obbi0',
        'clvs1lt2e00dloc4fkg8abb0q',
        {
          email,
        }
      );
      message.success(
        'Success, we will contact to you if we publish cloud version'
      );
      setEmail('');
    } catch (err) {
      message.error(String(err));
    }
    setLoading(false);
  };

  return (
    <div className="mt-6 sm:flex sm:w-full sm:max-w-md">
      <div className="sr-only">Email address</div>
      <Input
        className="w-full min-w-0 flex-auto rounded-md bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
        placeholder="Enter your email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        className="mt-3 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:mt-0 sm:w-auto"
        size="large"
        loading={loading}
        onClick={handleSubmit}
      >
        Join Waitlist
      </Button>
    </div>
  );
});
Waitlist.displayName = 'Waitlist';

export const PlanBlock: React.FC<{
  title: string;
  price: React.ReactNode;
  desc: string;
  features: string[];
  button: React.ReactNode;
}> = React.memo((props) => {
  return (
    <div className="overflow-hidden rounded-lg shadow-md ring-1 ring-black ring-opacity-5">
      <div className="bg-white px-6 py-8 sm:p-10 sm:pb-6 dark:bg-gray-800">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 sm:-mx-6 dark:text-white">
            {props.title}
          </h3>
          <div className="flex items-baseline text-6xl font-extrabold text-gray-900 dark:text-white">
            {props.price}
          </div>
        </div>
        <p className="mt-4 text-lg text-gray-500">{props.desc}</p>
        <ul
          className="mt-8 space-y-3 text-base text-gray-500 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5 sm:space-y-0"
          role="list"
        >
          {props.features.map((feature, i) => (
            <li className="flex items-start" key={i}>
              <div className="flex-shrink-0">
                <LuCheck className="h-6 w-6 text-green-500" />
              </div>
              <p className="ml-3">{feature}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-gray-50 px-6 pb-8 pt-6 sm:p-10 sm:pt-6 dark:bg-gray-700">
        {props.button}
      </div>
    </div>
  );
});
PlanBlock.displayName = 'PlanBlock';
