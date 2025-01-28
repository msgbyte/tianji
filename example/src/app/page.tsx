'use client';
import { useLocalStorageState } from 'ahooks';
import { initTianjiTracker, reportEvent } from 'tianji-client-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Code, TextField } from '@radix-ui/themes';

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
      <main className="row-start-2 flex w-[560px] flex-col items-center gap-2 sm:items-start">
        <h1 className="mb-6 w-full text-center text-2xl font-semibold">
          Tianji Event Playground
        </h1>

        <div className="flex w-full gap-2">
          <div className="flex-1">
            <div>Backend Url:</div>

            <TextField.Root
              variant="surface"
              placeholder="Input Backend Url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
            />
          </div>

          <div className="flex-1">
            <div>Website ID:</div>

            <TextField.Root
              variant="surface"
              placeholder="Input Website ID"
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
            />
          </div>
        </div>

        <Button
          className="!w-full !cursor-pointer"
          radius="full"
          onClick={injectTracker}
        >
          Inject
        </Button>

        {injectedEl && (
          <div>
            <div>Injected!</div>
            <div className="mb-4">
              websiteId:{' '}
              <Code>{injectedEl.getAttribute('data-website-id')}</Code>
            </div>

            <div className="flex flex-col flex-wrap items-center gap-4 sm:flex-row">
              <Button
                className="!cursor-pointer"
                variant="soft"
                onClick={() => {
                  reportEvent('Tianji Demo Event');

                  toast('report event to website');
                }}
              >
                Send Tianji Event
              </Button>
              <Button
                className="!cursor-pointer"
                variant="soft"
                onClick={() => {
                  reportEvent('Tianji String Event', {
                    string: 'bar',
                  });

                  toast('report event to website');
                }}
              >
                Send Tianji Event with String params
              </Button>
              <Button
                className="!cursor-pointer"
                variant="soft"
                onClick={() => {
                  reportEvent('Tianji Number Event', {
                    number: Math.round(Math.random() * 1000),
                  });

                  toast('report event to website');
                }}
              >
                Send Tianji Event with Number params
              </Button>
              <Button
                className="!cursor-pointer"
                variant="soft"
                onClick={() => {
                  reportEvent('Tianji Date Event', {
                    date: new Date(),
                  });

                  toast('report event to website');
                }}
              >
                Send Tianji Event with Date params
              </Button>
              <Button
                className="!cursor-pointer"
                variant="soft"
                onClick={() => {
                  reportEvent('Tianji Object Event', {
                    object: {
                      a: 1,
                      b: '2',
                      c: {
                        d: 3,
                      },
                    },
                  });

                  toast('report event to website');
                }}
              >
                Send Tianji Event with Object params
              </Button>
              <Button
                className="!cursor-pointer"
                variant="soft"
                onClick={() => {
                  reportEvent('Tianji Array Event', {
                    array: [1, 2, 3, 4, 5],
                  });

                  toast('report event to website');
                }}
              >
                Send Tianji Event with Array params
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
