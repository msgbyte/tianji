import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CodeExample } from '@/components/CodeExample';
import { CopyableText } from '@/components/CopyableText';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCodeXml, LuExternalLink } from 'react-icons/lu';

const DOCS_URL = 'https://tianji.dev/docs/application/tracking';

export const ApplicationUsageBtn: React.FC<{ applicationId: string }> =
  React.memo(({ applicationId }) => {
    const { t } = useTranslation();
    const serverUrl = window.location.origin;

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" Icon={LuCodeXml}>
            {t('Usage')}
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Usage')}</DialogTitle>
            <DialogDescription>
              {t(
                'Copy the AI prompt into your coding agent (Claude Code, Cursor, Codex, etc.) to integrate this application automatically, or set it up manually with the SDK.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
            <div>
              <strong>{t('Server URL')}:</strong>{' '}
              <CopyableText className="break-all font-mono" text={serverUrl} />
            </div>
            <div>
              <strong>{t('Application ID')}:</strong>{' '}
              <CopyableText
                className="break-all font-mono"
                text={applicationId}
              />
            </div>
          </div>

          <CodeExample
            className="min-w-0 shrink-0"
            example={buildApplicationUsageExamples({
              serverUrl,
              applicationId,
              labels: {
                prompt: t('AI Prompt'),
                reactNative: t('React Native'),
                http: t('HTTP API'),
              },
            })}
          />

          <a
            className="flex items-center gap-1 self-end text-sm text-blue-500 hover:underline"
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t('View full documentation')}
            <LuExternalLink />
          </a>
        </DialogContent>
      </Dialog>
    );
  });
ApplicationUsageBtn.displayName = 'ApplicationUsageBtn';

function buildApplicationUsageExamples(args: {
  serverUrl: string;
  applicationId: string;
  labels: { prompt: string; reactNative: string; http: string };
}) {
  const { serverUrl, applicationId } = args;

  return {
    prompt: {
      label: args.labels.prompt,
      code: `Integrate Tianji application tracking into this project.

Tianji server URL: ${serverUrl}
Application ID: ${applicationId}
Documentation: ${DOCS_URL}

Steps:
1. Detect the project's platform, framework, and package manager.
   - React Native (bare, or Expo with a development build / prebuild): install \`tianji-react-native\` and its peer dependency \`react-native-device-info\`, then run \`pod install\` and rebuild the native app.
   - Expo Go, or other JavaScript runtimes: install \`tianji-client-sdk\` (same API), and after initialization call \`identifyApplicationUser({ os, version })\` with the platform and app version. \`react-native-device-info\` is a native module that crashes Expo Go on import.
   - Other platforms (Flutter, native iOS/Android, etc.): call the HTTP API described in the documentation.
2. Call \`initApplication({ serverUrl, applicationId })\` once at app startup, before any other tracking call. Put both values in the project's existing config or env mechanism if it has one. If the server URL above is \`localhost\`, a private address, or plain HTTP that the app does not allow, ask me for a URL that real devices can reach.
3. Report a screen view whenever the focused screen changes with \`reportApplicationScreenView(name, params)\`. Use the route pattern (e.g. \`/product/[id]\`) as the name, and pass only the non-sensitive params you need (search params can contain tokens).
   - expo-router: use \`useSegments()\` and \`useGlobalSearchParams()\` in the root layout.
   - React Navigation: use the \`onReady\` and \`onStateChange\` callbacks of \`NavigationContainer\`, and report only when the current route key changes.
4. After the user signs in, call \`identifyApplicationUser({ id, ...profile })\`. Include the same stable string id on every profile update. To count group membership, send \`{ id, joinedGroup: true }\` on joining and \`{ id, joinedGroup: false }\` on leaving; enable Alpha Mode in Settings > General, then filter joinedGroup = true in the User properties tab. Omitted fields keep their previous values.
5. Report API requests from the app's own API client (fetch wrapper or axios interceptors) as an \`API Request\` event with uppercase method, path without query string, status, and duration. Skip cancelled requests. Do not patch the global \`fetch\`: the SDK uses it to send events.
6. Report uncaught errors as an \`App Error\` event (React Native: \`ErrorUtils.setGlobalHandler\`). Wrap the tracking code in try/finally so the default handler always runs.
7. Call \`flushApplicationBatchQueue()\` when the app moves to the background.
8. Propose a short list of key business events to me, then track the approved ones with \`reportApplicationEvent(name, data)\`.

Rules:
- Use fixed event names (max 50 characters) and put variable values in the event data.
- The server rejects event data string values longer than 500 characters; truncate values such as error messages and paths.
- Never send passwords, tokens, request bodies, or other secrets.
- Tracking must never crash or block the app.

When done, list the changed files and explain how to verify that events appear in the Tianji dashboard.`,
    },
    reactNative: {
      label: args.labels.reactNative,
      code: `// npm install tianji-react-native react-native-device-info
import {
  initApplication,
  reportApplicationScreenView,
  reportApplicationEvent,
  identifyApplicationUser,
} from 'tianji-react-native';

initApplication({
  serverUrl: '${serverUrl}',
  applicationId: '${applicationId}',
});

// Screen view
reportApplicationScreenView('Home');

// Custom event
reportApplicationEvent('Button Clicked', { button: 'signup' });

// Identify user after sign in
identifyApplicationUser({ id: 'user-123', name: 'John Doe' });

// Enable Alpha Mode in Settings > General, then count membership in Application > User properties
identifyApplicationUser({ id: 'user-123', joinedGroup: true });

// Leaving the group updates this user's current state
identifyApplicationUser({ id: 'user-123', joinedGroup: false });`,
    },
    http: {
      label: args.labels.http,
      code: `curl -X POST '${serverUrl}/api/application/send' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "type": "event",
  "payload": {
    "application": "${applicationId}",
    "name": "Button Clicked",
    "data": { "button": "signup" },
    "screen": "Home",
    "os": "ios",
    "language": "en-US"
  }
}'`,
    },
  };
}
