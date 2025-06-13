import { describe, test, expect } from 'vitest';
import { timedFetch } from '../utils/fetch.js';

describe('timedFetch', () => {
  test('should make a basic GET request and measure timing', async () => {
    console.log('🔄 Testing basic GET request...');

    const result = await timedFetch('https://httpbin.org/get');

    console.log('📊 Response status:', result.status);
    console.log('📊 Response URL:', result.url);
    console.log('📊 Response method:', result.method);
    console.log('📊 Timing breakdown:');
    console.log('  - DNS lookup:', result.timings.dns.toFixed(2), 'ms');
    console.log('  - TCP connect:', result.timings.tcp.toFixed(2), 'ms');
    console.log('  - TLS handshake:', result.timings.tls.toFixed(2), 'ms');
    console.log(
      '  - Time to first byte:',
      result.timings.ttfb.toFixed(2),
      'ms'
    );
    console.log('  - Download time:', result.timings.download.toFixed(2), 'ms');
    console.log('  - Total time:', result.timings.total.toFixed(2), 'ms');
    console.log('📊 Response headers:', Object.keys(result.headers));
    console.log('📊 Response data type:', typeof result.data);

    // Basic assertions
    expect(result.status).toBe(200);
    expect(result.method).toBe('GET');
    expect(result.url).toContain('httpbin.org');
    expect(typeof result.data).toBe('object');

    // Timing assertions
    expect(result.timings.dns).toBeGreaterThanOrEqual(0);
    expect(result.timings.tcp).toBeGreaterThanOrEqual(0);
    expect(result.timings.tls).toBeGreaterThanOrEqual(0); // Should be > 0 for HTTPS
    expect(result.timings.ttfb).toBeGreaterThan(0);
    expect(result.timings.download).toBeGreaterThanOrEqual(0);
    expect(result.timings.total).toBeGreaterThan(0);

    // Logical timing relationships
    expect(result.timings.total).toBeGreaterThanOrEqual(result.timings.ttfb);
    expect(result.timings.total).toBeGreaterThanOrEqual(
      result.timings.download
    );

    console.log('✅ Basic GET request test passed!\n');
  }, 15000);

  test('should make a POST request with JSON data and measure timing', async () => {
    console.log('🔄 Testing POST request with JSON...');

    const postData = {
      name: 'Test User',
      email: 'test@example.com',
      timestamp: new Date().toISOString(),
    };

    const result = await timedFetch('https://httpbin.org/post', {
      method: 'POST',
      json: postData,
    });

    console.log('📊 Response status:', result.status);
    console.log('📊 Response method:', result.method);
    console.log('📊 Timing breakdown:');
    console.log('  - DNS lookup:', result.timings.dns.toFixed(2), 'ms');
    console.log('  - TCP connect:', result.timings.tcp.toFixed(2), 'ms');
    console.log('  - TLS handshake:', result.timings.tls.toFixed(2), 'ms');
    console.log(
      '  - Time to first byte:',
      result.timings.ttfb.toFixed(2),
      'ms'
    );
    console.log('  - Download time:', result.timings.download.toFixed(2), 'ms');
    console.log('  - Total time:', result.timings.total.toFixed(2), 'ms');
    console.log('📊 Request was sent with data:', postData);

    // Basic assertions
    expect(result.status).toBe(200);
    expect(result.method).toBe('POST');
    expect(typeof result.data).toBe('object');

    // Check if our posted data is echoed back (httpbin.org returns the data)
    const responseData = result.data as any;
    expect(responseData.json).toBeDefined();
    expect(responseData.json.name).toBe(postData.name);
    expect(responseData.json.email).toBe(postData.email);

    // Timing assertions
    expect(result.timings.total).toBeGreaterThan(0);
    expect(result.timings.ttfb).toBeGreaterThan(0);

    console.log('✅ POST request test passed!\n');
  }, 15000);

  test('should handle custom headers and measure timing', async () => {
    console.log('🔄 Testing request with custom headers...');

    const customHeaders = {
      'User-Agent': 'Tianji-Test-Client/1.0',
      'X-Test-Header': 'test-value',
      Accept: 'application/json',
    };

    const result = await timedFetch('https://httpbin.org/headers', {
      method: 'GET',
      headers: customHeaders,
    });

    console.log('📊 Response status:', result.status);
    console.log('📊 Custom headers sent:', customHeaders);
    console.log('📊 Timing breakdown:');
    console.log('  - DNS lookup:', result.timings.dns.toFixed(2), 'ms');
    console.log('  - TCP connect:', result.timings.tcp.toFixed(2), 'ms');
    console.log('  - TLS handshake:', result.timings.tls.toFixed(2), 'ms');
    console.log(
      '  - Time to first byte:',
      result.timings.ttfb.toFixed(2),
      'ms'
    );
    console.log('  - Download time:', result.timings.download.toFixed(2), 'ms');
    console.log('  - Total time:', result.timings.total.toFixed(2), 'ms');

    // Basic assertions
    expect(result.status).toBe(200);
    expect(typeof result.data).toBe('object');

    // Check if our custom headers are reflected in the response
    const responseData = result.data as any;
    expect(responseData.headers).toBeDefined();
    expect(responseData.headers['User-Agent']).toBe(
      customHeaders['User-Agent']
    );
    expect(responseData.headers['X-Test-Header']).toBe(
      customHeaders['X-Test-Header']
    );

    // Timing assertions
    expect(result.timings.total).toBeGreaterThan(0);
    expect(result.timings.ttfb).toBeGreaterThan(0);

    console.log('✅ Custom headers test passed!\n');
  }, 15000);

  test('should handle HTTP (non-HTTPS) requests', async () => {
    console.log('🔄 Testing HTTP (non-HTTPS) request...');

    const result = await timedFetch('http://httpbin.org/get');

    console.log('📊 Response status:', result.status);
    console.log('📊 Timing breakdown:');
    console.log('  - DNS lookup:', result.timings.dns.toFixed(2), 'ms');
    console.log('  - TCP connect:', result.timings.tcp.toFixed(2), 'ms');
    console.log(
      '  - TLS handshake:',
      result.timings.tls.toFixed(2),
      'ms (should be 0 for HTTP)'
    );
    console.log(
      '  - Time to first byte:',
      result.timings.ttfb.toFixed(2),
      'ms'
    );
    console.log('  - Download time:', result.timings.download.toFixed(2), 'ms');
    console.log('  - Total time:', result.timings.total.toFixed(2), 'ms');

    // Basic assertions
    expect(result.status).toBe(200);
    expect(typeof result.data).toBe('object');

    // For HTTP requests, TLS time should be 0
    expect(result.timings.tls).toBe(0);
    expect(result.timings.total).toBeGreaterThan(0);

    console.log('✅ HTTP request test passed!\n');
  }, 15000);

  test('should handle search parameters', async () => {
    console.log('🔄 Testing request with search parameters...');

    const searchParams = {
      param1: 'value1',
      param2: 'value2',
      number: 123,
      boolean: true,
    };

    const result = await timedFetch('https://httpbin.org/get', {
      method: 'GET',
      searchParams,
    });

    console.log('📊 Response status:', result.status);
    console.log('📊 Search params sent:', searchParams);
    console.log(
      '📊 Total request time:',
      result.timings.total.toFixed(2),
      'ms'
    );

    // Basic assertions
    expect(result.status).toBe(200);
    expect(typeof result.data).toBe('object');

    // Check if our search params are reflected in the response
    const responseData = result.data as any;
    expect(responseData.args).toBeDefined();
    expect(responseData.args.param1).toBe('value1');
    expect(responseData.args.param2).toBe('value2');
    expect(responseData.args.number).toBe('123'); // URL params are always strings
    expect(responseData.args.boolean).toBe('true');

    console.log('✅ Search parameters test passed!\n');
  }, 15000);
});
