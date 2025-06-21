'use client';
import { useLocalStorageState } from 'ahooks';
import { initTianjiTracker, reportEvent, identify } from 'tianji-client-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Code, TextField } from '@radix-ui/themes';
import { faker } from '@faker-js/faker';
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

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
  const [isInjecting, setIsInjecting] = useState(false);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const injectTracker = async () => {
    if (isInjecting) return;

    setIsInjecting(true);

    if (injectedEl) {
      injectedEl.remove();
      setInjectedEl(null);
      setEventCounts({});
    }

    if (!backendUrl || !websiteId) {
      toast.error(
        'Missing required fields! Please fill in both Backend URL and Website ID.',
        {
          description: 'Both fields are required to initialize the tracker.',
        }
      );
      setIsInjecting(false);
      return;
    }

    try {
      const scriptEl = await initTianjiTracker({
        url: backendUrl,
        websiteId,
      });

      console.log('scriptEl', scriptEl);
      setInjectedEl(scriptEl);
      toast.success('Tianji tracker injected successfully!', {
        description:
          'You can now start sending events to your analytics dashboard.',
      });
    } catch (error) {
      toast.error(
        'Failed to inject tracker. Please check your configuration.',
        {
          description: 'Make sure your backend URL is correct and accessible.',
        }
      );
      console.error('Tracker injection error:', error);
    } finally {
      setIsInjecting(false);
    }
  };

  const incrementEventCount = (eventType: string, count: number = 1) => {
    setEventCounts((prev) => ({
      ...prev,
      [eventType]: (prev[eventType] || 0) + count,
    }));
  };

  const batchSendEvents = async (eventType: string, eventTitle: string) => {
    if (isBatchSending) return;

    setIsBatchSending(true);
    setBatchProgress(0);

    const batchSize = 100;
    const chunkSize = 10; // Send 10 events at a time to avoid overwhelming

    try {
      for (let i = 0; i < batchSize; i += chunkSize) {
        const currentChunk = Math.min(chunkSize, batchSize - i);

        // Send a chunk of events
        for (let j = 0; j < currentChunk; j++) {
          switch (eventType) {
            case 'basic':
              reportEvent('Tianji Demo Event (Batch)');
              break;
            case 'string':
              reportEvent('Tianji String Event (Batch)', {
                string: `batch-${i + j}`,
              });
              break;
            case 'number':
              reportEvent('Tianji Number Event (Batch)', {
                number: Math.round(Math.random() * 1000),
              });
              break;
            case 'date':
              reportEvent('Tianji Date Event (Batch)', { date: new Date() });
              break;
            case 'object':
              reportEvent('Tianji Object Event (Batch)', {
                object: {
                  batchId: i + j,
                  timestamp: Date.now(),
                  data: 'batch-data',
                },
              });
              break;
            case 'array':
              reportEvent('Tianji Array Event (Batch)', {
                array: [i + j, 'batch', Math.random()],
              });
              break;
            case 'identify':
              identify({
                username: `BatchUser-${i + j}`,
                email: `batch${i + j}@example.com`,
                batchId: i + j,
              });
              break;
          }
        }

        // Update progress and count
        const newProgress = Math.round(((i + currentChunk) / batchSize) * 100);
        setBatchProgress(newProgress);
        incrementEventCount(eventType, currentChunk);

        // Small delay to prevent overwhelming the system
        if (i + chunkSize < batchSize) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      toast.success(`Successfully sent 100 ${eventTitle} events!`, {
        description: `All events have been processed and sent to your analytics dashboard.`,
      });
    } catch (error) {
      toast.error(`Failed to send batch events`, {
        description: 'Some events may not have been sent successfully.',
      });
      console.error('Batch send error:', error);
    } finally {
      setIsBatchSending(false);
      setBatchProgress(0);
    }
  };

  const eventButtons = [
    {
      title: 'Send Basic Event',
      description: 'Send a simple event without parameters',
      variant: 'secondary' as const,
      emoji: '🎯',
      eventType: 'basic',
      action: () => {
        reportEvent('Tianji Demo Event');
        incrementEventCount('basic');
        toast.success('Basic event sent successfully!');
      },
    },
    {
      title: 'Identify Session',
      description: 'Identify current session with user info',
      variant: 'accent' as const,
      emoji: '👤',
      eventType: 'identify',
      action: () => {
        const info = {
          username: faker.person.fullName(),
          email: faker.internet.email(),
          avatar: faker.image.avatar(),
        };
        identify(info);
        incrementEventCount('identify');
        toast.success(`Session identified as: ${info.username}`, {
          description: `Email: ${info.email}`,
        });
      },
    },
    {
      title: 'String Event',
      description: 'Send event with string parameter',
      variant: 'secondary' as const,
      emoji: '📝',
      eventType: 'string',
      action: () => {
        reportEvent('Tianji String Event', { string: 'bar' });
        incrementEventCount('string');
        toast.success('String event sent!');
      },
    },
    {
      title: 'Number Event',
      description: 'Send event with number parameter',
      variant: 'secondary' as const,
      emoji: '🔢',
      eventType: 'number',
      action: () => {
        const number = Math.round(Math.random() * 1000);
        reportEvent('Tianji Number Event', { number });
        incrementEventCount('number');
        toast.success(`Number event sent with value: ${number}`);
      },
    },
    {
      title: 'Date Event',
      description: 'Send event with date parameter',
      variant: 'secondary' as const,
      emoji: '📅',
      eventType: 'date',
      action: () => {
        const date = new Date();
        reportEvent('Tianji Date Event', { date });
        incrementEventCount('date');
        toast.success(`Date event sent: ${date.toLocaleString()}`);
      },
    },
    {
      title: 'Object Event',
      description: 'Send event with complex object',
      variant: 'secondary' as const,
      emoji: '🧩',
      eventType: 'object',
      action: () => {
        const obj = { a: 1, b: '2', c: { d: 3 } };
        reportEvent('Tianji Object Event', { object: obj });
        incrementEventCount('object');
        toast.success('Object event sent!', {
          description: 'Complex nested object with multiple data types',
        });
      },
    },
    {
      title: 'Array Event',
      description: 'Send event with array parameter',
      variant: 'secondary' as const,
      emoji: '📊',
      eventType: 'array',
      action: () => {
        const array = [1, 2, 3, 4, 5];
        reportEvent('Tianji Array Event', { array });
        incrementEventCount('array');
        toast.success(`Array event sent: [${array.join(', ')}]`);
      },
    },
  ];

  const totalEvents = Object.values(eventCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background shapes */}
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="animate-fade-in-up mb-12 text-center">
            <h1 className="mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-5xl font-bold text-transparent">
              🚀 Tianji Event Playground
            </h1>
            <p className="mb-2 text-xl text-white/80">
              Test and explore Tianji tracking capabilities
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/60">
              <span>Real-time event tracking made simple</span>
              <span className="h-1 w-1 rounded-full bg-white/40"></span>
              <span>Modern analytics platform</span>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="glass-card animate-fade-in-up animate-delay-100 mb-8 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                <span className="font-bold text-white">⚙️</span>
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Configuration
              </h2>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="form-field">
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Backend URL
                </label>
                <TextField.Root
                  size="3"
                  variant="surface"
                  placeholder="Enter your Tianji backend URL"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  className="w-full"
                  disabled={isInjecting}
                />
              </div>

              <div className="form-field">
                <label className="mb-2 block text-sm font-medium text-white/90">
                  Website ID
                </label>
                <TextField.Root
                  size="3"
                  variant="surface"
                  placeholder="Enter your website ID"
                  value={websiteId}
                  onChange={(e) => setWebsiteId(e.target.value)}
                  className="w-full"
                  disabled={isInjecting}
                />
              </div>
            </div>

            <Button
              size="4"
              className="btn-primary w-full cursor-pointer"
              onClick={injectTracker}
              disabled={isInjecting}
            >
              <span className="flex items-center justify-center gap-2">
                {isInjecting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Initializing Tracker...</span>
                  </>
                ) : (
                  <>
                    <span>🔌</span>
                    <span>
                      {injectedEl ? 'Reinitialize' : 'Initialize'} Tianji
                      Tracker
                    </span>
                  </>
                )}
              </span>
            </Button>
          </div>

          {/* Status Section */}
          {injectedEl && (
            <div className="glass-card animate-fade-in-up animate-delay-200 mb-8 p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span className="text-lg font-semibold text-white">
                      Tracker Active
                    </span>
                  </div>
                </div>

                {totalEvents > 0 && (
                  <div className="rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20 px-4 py-2">
                    <span className="font-semibold text-white">
                      {totalEvents} Events Sent
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6 rounded-lg bg-black/20 p-4">
                <p className="mb-2 text-white/80">Connected Website ID:</p>
                <Code size="3" className="bg-white/10 text-white">
                  {injectedEl.getAttribute('data-website-id')}
                </Code>
              </div>

              {/* Event Actions */}
              <div className="space-y-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-blue-500">
                    <span className="font-bold text-white">📊</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Event Actions
                  </h3>
                </div>

                {/* Batch Progress Bar */}
                {isBatchSending && (
                  <div className="mb-4 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-white">
                        Sending batch events...
                      </span>
                      <span className="text-sm text-white/80">
                        {batchProgress}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/20">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300 ease-out"
                        style={{ width: `${batchProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {eventButtons.map((button, index) => (
                    <div
                      key={button.title}
                      className="glass-card animate-fade-in-up p-6 transition-all duration-300 hover:scale-105"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="mb-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-2xl">{button.emoji}</span>
                          <h4 className="font-semibold text-white">
                            {button.title}
                          </h4>
                          {eventCounts[button.eventType] && (
                            <span className="ml-auto rounded-full bg-white/20 px-2 py-1 text-xs text-white">
                              {eventCounts[button.eventType]}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70">
                          {button.description}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="3"
                          variant="soft"
                          className={`!flex-1 cursor-pointer transition-all hover:scale-105 ${
                            button.variant === 'accent'
                              ? 'btn-accent'
                              : 'btn-secondary'
                          }`}
                          onClick={button.action}
                        >
                          Send 1x
                        </Button>
                        <Button
                          size="3"
                          variant="soft"
                          className="btn-accent cursor-pointer transition-all hover:scale-105"
                          onClick={() =>
                            batchSendEvents(button.eventType, button.title)
                          }
                          disabled={isBatchSending}
                        >
                          100x
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="animate-fade-in-up animate-delay-300 text-center text-white/60">
            <p className="mb-2">
              Built with ❤️ using Tianji Analytics Platform
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <span>Next.js</span>
              <span className="h-1 w-1 rounded-full bg-white/40"></span>
              <span>React</span>
              <span className="h-1 w-1 rounded-full bg-white/40"></span>
              <span>Tailwind CSS</span>
              <span className="h-1 w-1 rounded-full bg-white/40"></span>
              <span>Radix UI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
