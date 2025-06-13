import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

/**
 * Timing information for HTTP requests
 */
export interface RequestTimings {
  /** DNS lookup time in milliseconds */
  dns: number;
  /** TCP connection time in milliseconds */
  tcp: number;
  /** TLS handshake time in milliseconds */
  tls: number;
  /** Time to first byte (TTFB) in milliseconds */
  ttfb: number;
  /** Download time in milliseconds */
  download: number;
  /** Total request time in milliseconds */
  total: number;
}

/**
 * Response with timing information
 */
export interface TimedResponse<T = unknown> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string | string[]>;
  /** Detailed timing information */
  timings: RequestTimings;
  /** Request URL */
  url: string;
  /** HTTP method used */
  method: string;
}

/**
 * Options for timed fetch requests
 */
export interface TimedFetchOptions {
  /** Whether to parse JSON response automatically (default: true) */
  parseJson?: boolean;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Request body as JSON */
  json?: Record<string, unknown>;
  /** Raw request body */
  body?: string | Buffer;
  /** Query parameters */
  searchParams?: Record<string, string | number | boolean>;
  /** Follow redirects (default: true) */
  followRedirect?: boolean;
  /** Maximum number of redirects (default: 10) */
  maxRedirects?: number;
  /** HTTP Agent for connection pooling and proxy support */
  httpAgent?: http.Agent;
  /** HTTPS Agent for connection pooling and proxy support */
  httpsAgent?: https.Agent;
  /** Retry configuration */
  retry?: {
    limit?: number;
    methods?: string[];
    statusCodes?: number[];
  };
}

/**
 * Make an HTTP request with detailed timing information using native Node.js modules
 *
 * @param url - The URL to request
 * @param options - Request options
 * @returns Promise resolving to response with timing data
 *
 * @example
 * ```typescript
 * // Basic GET request
 * const result = await timedFetch('https://api.example.com/data');
 * console.log('Response:', result.data);
 * console.log('Total time:', result.timings.total, 'ms');
 *
 * // POST request with data
 * const postResult = await timedFetch('https://api.example.com/users', {
 *   method: 'POST',
 *   json: { name: 'John', email: 'john@example.com' }
 * });
 *
 * // Custom configuration with HTTPS agent
 * const httpsCustomAgent = new https.Agent({ keepAlive: true });
 * const customResult = await timedFetch('https://api.example.com/data', {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer token' },
 *   timeout: 5000,
 *   httpsAgent: httpsCustomAgent,
 *   parseJson: true,
 *   retry: { limit: 3 }
 * });
 *
 * // Custom configuration with HTTP agent
 * const httpCustomAgent = new http.Agent({ keepAlive: true });
 * const httpResult = await timedFetch('http://api.example.com/data', {
 *   method: 'GET',
 *   httpAgent: httpCustomAgent,
 *   timeout: 5000
 * });
 * ```
 */
export async function timedFetch<T = unknown>(
  requestUrl: string,
  options: TimedFetchOptions = {}
): Promise<TimedResponse<T>> {
  const {
    parseJson = true,
    method = 'GET',
    headers = {},
    timeout = 30000,
    json,
    body,
    searchParams,
    followRedirect = true,
    maxRedirects = 10,
    httpAgent,
    httpsAgent,
    retry = { limit: 0 },
  } = options;

  let attempts = 0;
  const maxAttempts = (retry.limit || 0) + 1;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      return await makeRequest<T>(
        requestUrl,
        method,
        headers,
        timeout,
        json,
        body,
        searchParams,
        parseJson,
        followRedirect,
        maxRedirects,
        httpAgent,
        httpsAgent
      );
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw error;
      }
      // Simple retry delay
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
    }
  }

  throw new Error('Max retry attempts reached');
}

async function makeRequest<T>(
  requestUrl: string,
  method: string,
  headers: Record<string, string>,
  timeout: number,
  json?: Record<string, unknown>,
  body?: string | Buffer,
  searchParams?: Record<string, string | number | boolean>,
  parseJson: boolean = true,
  followRedirect: boolean = true,
  maxRedirects: number = 10,
  httpAgent?: http.Agent,
  httpsAgent?: https.Agent,
  redirectCount: number = 0
): Promise<TimedResponse<T>> {
  return new Promise((resolve, reject) => {
    // Parse URL
    let parsedUrl: url.URL;
    try {
      parsedUrl = new url.URL(requestUrl);
    } catch (error) {
      reject(new Error(`Invalid URL: ${requestUrl}`));
      return;
    }

    // Add search params to URL
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        parsedUrl.searchParams.set(key, String(value));
      });
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    // Prepare request body
    let requestBody: string | Buffer | undefined;
    const requestHeaders = { ...headers };

    if (json) {
      requestBody = JSON.stringify(json);
      requestHeaders['Content-Type'] = 'application/json';
      requestHeaders['Content-Length'] =
        Buffer.byteLength(requestBody).toString();
    } else if (body) {
      requestBody = body;
      if (typeof body === 'string') {
        requestHeaders['Content-Length'] = Buffer.byteLength(body).toString();
      } else {
        requestHeaders['Content-Length'] = body.length.toString();
      }
    }

    // Timing measurements
    const timings = {
      start: performance.now(),
      dnsLookup: 0,
      tcpConnect: 0,
      tlsConnect: 0,
      requestSent: 0,
      firstByte: 0,
      end: 0,
    };

    // Request options
    const requestOptions: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method.toUpperCase(),
      headers: requestHeaders,
      timeout,
    };

    // Add agent if provided
    if (isHttps && httpsAgent !== undefined) {
      requestOptions.agent = httpsAgent;
    } else if (!isHttps && httpAgent !== undefined) {
      requestOptions.agent = httpAgent;
    }

    const req = httpModule.request(requestOptions, (res) => {
      timings.firstByte = performance.now();

      // Handle redirects
      if (
        followRedirect &&
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        if (redirectCount >= maxRedirects) {
          reject(new Error(`Too many redirects (${redirectCount})`));
          return;
        }

        const redirectUrl = url.resolve(requestUrl, res.headers.location);
        makeRequest<T>(
          redirectUrl,
          method,
          headers,
          timeout,
          json,
          body,
          searchParams,
          parseJson,
          followRedirect,
          maxRedirects,
          httpAgent,
          httpsAgent,
          redirectCount + 1
        )
          .then(resolve)
          .catch(reject);
        return;
      }

      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        timings.end = performance.now();

        const rawData = Buffer.concat(chunks);
        let responseData: T;

        try {
          if (
            parseJson &&
            res.headers['content-type']?.includes('application/json')
          ) {
            responseData = JSON.parse(rawData.toString('utf8')) as T;
          } else {
            responseData = rawData.toString('utf8') as T;
          }
        } catch (error) {
          responseData = rawData.toString('utf8') as T;
        }

        // Calculate timing differences
        // Handle cases where events didn't fire (e.g., connection reuse)
        const dnsTime =
          timings.dnsLookup > timings.start
            ? timings.dnsLookup - timings.start
            : 0;

        const tcpTime =
          timings.tcpConnect > timings.dnsLookup
            ? timings.tcpConnect - timings.dnsLookup
            : 0;

        const tlsTime =
          isHttps && timings.tlsConnect > timings.tcpConnect
            ? timings.tlsConnect - timings.tcpConnect
            : 0;

        const calculatedTimings: RequestTimings = {
          dns: dnsTime,
          tcp: tcpTime,
          tls: tlsTime,
          ttfb: Math.max(0, timings.firstByte - timings.start),
          download: Math.max(0, timings.end - timings.firstByte),
          total: Math.max(0, timings.end - timings.start),
        };

        // Convert headers to the expected format
        const responseHeaders: Record<string, string | string[]> = {};
        Object.entries(res.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            responseHeaders[key] = value;
          }
        });

        const response: TimedResponse<T> = {
          data: responseData,
          status: res.statusCode || 0,
          headers: responseHeaders,
          timings: calculatedTimings,
          url: requestUrl,
          method: method.toUpperCase(),
        };

        resolve(response);
      });

      res.on('error', (error) => {
        reject(new Error(`Response error: ${error.message}`));
      });
    });

    // Set up timing event listeners
    req.on('lookup', () => {
      timings.dnsLookup = performance.now();
    });

    req.on('connect', () => {
      timings.tcpConnect = performance.now();
    });

    req.on('secureConnect', () => {
      timings.tlsConnect = performance.now();
    });

    req.on('finish', () => {
      timings.requestSent = performance.now();
    });

    // Additional socket event listeners for better timing
    req.on('socket', (socket) => {
      if (socket.connecting) {
        socket.on('lookup', () => {
          if (timings.dnsLookup === 0) {
            timings.dnsLookup = performance.now();
          }
        });

        socket.on('connect', () => {
          if (timings.tcpConnect === 0) {
            timings.tcpConnect = performance.now();
          }
        });

        if (isHttps) {
          socket.on('secureConnect', () => {
            if (timings.tlsConnect === 0) {
              timings.tlsConnect = performance.now();
            }
          });
        }
      } else {
        // If socket is already connected, set timing values to start time
        // to indicate reused connection
        timings.dnsLookup = timings.start;
        timings.tcpConnect = timings.start;
        if (isHttps) {
          timings.tlsConnect = timings.start;
        }
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    // Write request body if present
    if (requestBody) {
      req.write(requestBody);
    }

    req.end();
  });
}
