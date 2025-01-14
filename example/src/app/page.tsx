'use client';
import Image from 'next/image';
import { useLocalStorageState } from 'ahooks';
import { initTianjiTracker, reportEvent } from 'tianji-client-react';
import { useState } from 'react';

export default function Home() {
  const [backendUrl, setBackendUrl] = useLocalStorageState(
    'tianji.backendUrl',
    {
      defaultValue: 'http://localhost:12345',
    }
  );
  const [websiteId, setWebsiteId] = useLocalStorageState('tianji.websiteId', {
    defaultValue: '',
  });
  const [injectedEl, setInjectedEl] = useState<HTMLScriptElement | null>(null);

  const injectTracker = async () => {
    if (injectedEl) {
      injectedEl.remove();
      setInjectedEl(null);
    }

    if (!backendUrl || !websiteId) {
      alert(
        'Not has required field!' + JSON.stringify({ backendUrl, websiteId })
      );
      return;
    }

    const scriptEl = await initTianjiTracker({
      url: backendUrl,
      websiteId,
    });

    console.log('scriptEl', scriptEl);

    setInjectedEl(scriptEl);
  };

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-2 sm:items-start">
        <div className="flex gap-2">
          <div>
            <div>Backend Url:</div>
            <input
              className="rounded-md border px-2 py-1"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
            />
          </div>

          <div>
            <div>Website ID:</div>
            <input
              className="rounded-md border px-2 py-1"
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
            />
          </div>
        </div>

        <button
          className="w-full rounded-lg bg-gray-200 px-2 py-1 text-lg transition-all hover:bg-blue-500 hover:text-white"
          onClick={injectTracker}
        >
          Inject
        </button>

        {injectedEl && (
          <div>
            <div>Injected!</div>
            <div>websiteId: {injectedEl.getAttribute('data-website-id')}</div>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div
                className="flex h-8 cursor-pointer items-center justify-center rounded-full border border-solid border-black/[.08] px-4 text-sm transition-colors hover:border-transparent hover:bg-[#f2f2f2] sm:h-12 sm:min-w-44 sm:px-5 sm:text-base dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
                onClick={() => {
                  reportEvent('Tianji Demo');

                  console.log('report event to website');
                }}
              >
                Send Tianji Event
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
