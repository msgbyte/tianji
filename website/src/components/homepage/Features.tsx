import Link from '@docusaurus/Link';
import React from 'react';
import {
  LuCode2,
  LuCookie,
  LuFileArchive,
  LuFilePieChart,
  LuGithub,
  LuMonitor,
  LuNetwork,
  LuServer,
  LuSiren,
  LuUsers2,
  LuWifi,
} from 'react-icons/lu';
import { FaDocker } from 'react-icons/fa';
import { RiSurveyLine } from 'react-icons/ri';
import { HomepageFlags } from './Flags';

export const HomepageFeatures: React.FC = React.memo(() => {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* Col1 */}
      <div className="flex flex-1 flex-col gap-4">
        <div
          className="flex-1 rounded-2xl p-8"
          style={{
            backgroundImage:
              'linear-gradient(177deg, #273B60 0%, #0F1114 100%)',
          }}
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="rounded-lg bg-white bg-opacity-20 p-1">
              <LuCode2 className="block" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">OpenAPI</div>
          </div>
          <div className="text-zinc-300">
            Tianji offers a comprehensive OpenAPI interface, providing seamless
            integration and extensive functionality for developers. With
            Tianji's OpenAPI, you can easily access and utilize a wide range of
            services and features, ensuring a smooth and efficient development
            process. Experience the power and flexibility of Tianji's complete
            OpenAPI interface today.
          </div>

          <div className="mt-4 flex">
            <Link
              to="/api"
              className="cursor-pointer rounded-lg bg-white px-4 py-2 font-bold text-zinc-900 hover:bg-zinc-200 hover:text-zinc-800 hover:no-underline"
              data-tianji-event="homepage-features-api"
            >
              Click here to view all api
            </Link>
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl p-8"
          style={{
            backgroundImage:
              'linear-gradient(329deg, rgba(0, 16, 71, 0.40) 0%, rgba(77, 77, 77, 0.00) 100%), linear-gradient(123deg, rgba(97, 85, 42, 0.60) 0%, rgba(15, 24, 86, 0.00) 100%)',
          }}
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="rounded-lg bg-white bg-opacity-20 p-1">
              <LuFileArchive className="block" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              GDPR & CCPA compliant
            </div>
          </div>

          <div className="text-zinc-300">
            At Tianji, we prioritize user's privacy and data protection. Our
            services fully support and comply with the stringent standards set
            by the General Data Protection Regulation (GDPR) and the California
            Consumer Privacy Act (CCPA). We ensure that your personal
            information is handled with the utmost care and security, providing
            you with transparency, control, and peace of mind.
          </div>
          <div>
            <img src="/img/gdpr-ccpa.svg" />
          </div>
        </div>
      </div>

      {/* Col2 */}
      <div className="flex flex-1 flex-col gap-4">
        <div
          className="flex-1 rounded-2xl p-8"
          style={{
            backgroundImage:
              'linear-gradient(329deg, rgba(0, 16, 71, 0.40) 0%, rgba(77, 77, 77, 0.00) 100%), linear-gradient(123deg, rgba(25, 44, 171, 0.60) 0%, rgba(15, 24, 86, 0.00) 100%)',
          }}
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="rounded-lg bg-white bg-opacity-20 p-1">
              <LuSiren className="block" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              Defining Features by Needs
            </div>
          </div>

          <div className="text-zinc-300">
            At Tianji, we develop lightweight features for independent
            developers and small teams, focusing on their specific needs. We
            create cost-effective, valuable features without the unnecessary
            complexities of heavy, mature products. Our user-centric approach
            ensures we deliver meaningful solutions and build trust within our
            community.
          </div>

          <div className="mt-4 flex flex-col gap-2 pl-2">
            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-white bg-opacity-20 p-1">
                <LuNetwork className="block" size={18} />
              </div>
              <div className="text-md font-bold text-white">
                Website Analytics
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-white bg-opacity-20 p-1">
                <LuMonitor className="block" size={18} />
              </div>
              <div className="text-md font-bold text-white">Uptime Monitor</div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-white bg-opacity-20 p-1">
                <LuServer className="block" size={18} />
              </div>
              <div className="text-md font-bold text-white">Server Status</div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-white bg-opacity-20 p-1">
                <FaDocker className="block" size={18} />
              </div>
              <div className="text-md font-bold text-white">Docker Status</div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-white bg-opacity-20 p-1">
                <LuFilePieChart className="block" size={18} />
              </div>
              <div className="text-md font-bold text-white">Status Page</div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-white bg-opacity-20 p-1">
                <LuWifi className="block" size={18} />
              </div>
              <div className="text-md font-bold text-white">Telemetry</div>
            </div>

            <div className="flex items-start gap-2">
              <div className="rounded-lg bg-white bg-opacity-20 p-1">
                <RiSurveyLine className="block" size={18} />
              </div>
              <div className="text-md font-bold text-white">Survey</div>
            </div>
          </div>
        </div>
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(62,72,91,0.20)',
          }}
        >
          <div className="mb-3 flex items-start gap-2 border border-zinc-300">
            <div className="rounded-lg bg-white bg-opacity-20 p-1">
              <LuGithub className="block" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">Open Source</div>
          </div>

          <div className="text-zinc-300">
            Tianji is an open-source project dedicated to providing robust and
            efficient solutions for data integration and management. By
            leveraging community contributions, Tianji continually evolves to
            meet the dynamic needs of users across various industries. Its
            open-source nature ensures transparency, flexibility, and the
            ability to customize functionalities according to specific
            requirements. Join the Tianji community today to collaborate,
            innovate, and contribute to a growing ecosystem of cutting-edge data
            solutions.
          </div>
        </div>
      </div>

      {/* Col3 */}
      <div className="flex flex-1 flex-col gap-4">
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundImage:
              'linear-gradient(178.16deg, #2D2960 1.56%, #0F1114 105.08%)',
          }}
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="rounded-lg bg-white bg-opacity-20 p-1">
              <LuCookie className="block" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">No Cookie Track</div>
          </div>

          <div className="text-zinc-300">
            At Tianji, user's privacy is our priority. We do not track user's
            activity with cookies. This means you won't need to request user
            consent for cookie tracking, simplifying the user experience and
            increasing retention rates.
          </div>

          <div>
            <img src="/img/no-cookie-track.svg" />
          </div>
        </div>
        <div
          className="flex-1 rounded-2xl p-8"
          style={{
            background:
              'linear-gradient(104deg, rgba(3.15, 189.13, 153.13, 0.40) 1%, rgba(26.50, 155.13, 147.27, 0.13) 46%, rgba(14.80, 30.63, 80.75, 0.28) 86%)',
          }}
        >
          <div className="mb-3 flex items-start gap-2">
            <div className="rounded-lg bg-white bg-opacity-20 p-1">
              <LuUsers2 className="block" size={24} />
            </div>
            <div className="text-2xl font-bold text-white">
              Community Driven
            </div>
          </div>

          <div className="text-zinc-300">
            Tianji is a community-driven project dedicated to fostering
            collaboration, innovation, and shared learning. Our vibrant
            community is at the heart of everything we do, empowering members to
            connect, share knowledge, and contribute to a collective vision.
            Join us and be a part of a dynamic network where every voice matters
            and together, we build the future.
          </div>

          <div className="my-2">
            <HomepageFlags />
          </div>

          <div className="mt-4 flex">
            <Link
              to="#join-community"
              className="cursor-pointer rounded-lg bg-white px-8 py-2 font-bold text-zinc-900 hover:bg-zinc-200 hover:text-zinc-800 hover:no-underline"
              data-tianji-event="homepage-features-join"
            >
              Join
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});
HomepageFeatures.displayName = 'HomepageFeatures';
