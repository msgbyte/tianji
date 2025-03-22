import ivm from 'isolated-vm';
import { performance } from 'perf_hooks';

/**
 * This file demonstrates the usage of isolated-vm module for creating secure sandboxed environments
 * to execute untrusted JavaScript code with memory limits and resource isolation.
 */

// Demo 1: Basic Isolate and Script Execution
async function basicIsolateDemo() {
  console.log('\n=== Demo 1: Basic Isolate and Script Execution ===');

  // Create a new isolate with a memory limit (in MB)
  const isolate = new ivm.Isolate({ memoryLimit: 128 });

  // Create a new context within the isolate
  const context = await isolate.createContext();

  // Compile a simple script
  const script = await isolate.compileScript('1 + 2');

  // Run the script in the context
  const result = await script.run(context);

  console.log('Script result:', result);

  // Clean up resources
  context.release();
  script.release();
  isolate.dispose();
}

// Demo 2: Passing Values Between Isolate and Host
async function valuePassingDemo() {
  console.log('\n=== Demo 2: Passing Values Between Isolate and Host ===');

  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();

  // Get a reference to the global object in the context
  const global = context.global;

  // Set a value in the isolate
  global.setSync('hostValue', 42);

  // Create a function in the isolate that uses the value
  const script = await isolate.compileScript('hostValue + 100');
  const result = await script.run(context);

  console.log('Result using host value:', result);

  // Get a value from the isolate
  const getValueScript = await isolate.compileScript(
    '({ data: "Hello from isolate", number: 123 })'
  );
  const isolateValue = await getValueScript.run(context);

  console.log('Value from isolate:', isolateValue);

  // Clean up
  context.release();
  script.release();
  getValueScript.release();
  isolate.dispose();
}

// Demo 3: Exposing Host Functions to the Isolate
async function exposeFunctionsDemo() {
  console.log('\n=== Demo 3: Exposing Host Functions to the Isolate ===');

  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();
  const global = context.global;

  // Create a function in the host that we'll expose to the isolate
  const logCallback = new ivm.Reference(function (...args: any[]) {
    console.log('Isolate logged:', ...args);
  });

  // Expose the function to the isolate
  global.setSync('hostLog', logCallback);

  // Create a script that uses the host function
  const script = await isolate.compileScript(`
    hostLog('Hello from the isolate!');
    hostLog('Multiple', 'arguments', 'work too');
    'Function called successfully';
  `);

  const result = await script.run(context);
  console.log('Script result:', result);

  // Clean up
  context.release();
  script.release();
  logCallback.release();
  isolate.dispose();
}

// Demo 4: Memory Limits and Resource Constraints
async function memoryLimitsDemo() {
  console.log('\n=== Demo 4: Memory Limits and Resource Constraints ===');

  // Create an isolate with a very small memory limit
  const isolate = new ivm.Isolate({ memoryLimit: 8 }); // 8MB limit
  const context = await isolate.createContext();

  try {
    // Try to allocate a large array that should exceed the memory limit
    const script = await isolate.compileScript(`
      const arr = new Array(10000000).fill('memory hog');
      'Created large array';
    `);

    console.log('Attempting to run memory-intensive script...');
    const result = await script.run(context, { timeout: 1000 }); // 1 second timeout
    console.log('Result:', result);

    script.release();
  } catch (error) {
    console.log('Error caught (expected):', (error as any).message);
  } finally {
    context.release();
    isolate.dispose();
  }
}

// Demo 5: Transferable Objects and References
async function transferableDemo() {
  console.log('\n=== Demo 5: Transferable Objects and References ===');

  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();
  const global = context.global;

  // Create a complex object
  const complexObject = {
    name: 'Test Object',
    values: [1, 2, 3, 4, 5],
    nested: {
      prop: 'nested property',
    },
  };

  // Transfer the object to the isolate using an external copy
  const copy = new ivm.ExternalCopy(complexObject).copyInto();
  global.setSync('hostObject', copy);

  // Create a script that modifies the object
  const script = await isolate.compileScript(`
    // Access the object
    const obj = hostObject;

    // Modify it
    obj.values.push(6);
    obj.newProp = 'added in isolate';

    // Return the modified object
    obj;
  `);

  const result = await script.run(context);
  console.log('Modified object from isolate:', result);

  // Clean up
  context.release();
  script.release();
  isolate.dispose();
}

// Demo 6: Error Handling and Timeouts
async function errorHandlingDemo() {
  console.log('\n=== Demo 6: Error Handling and Timeouts ===');

  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();

  // Script with a syntax error
  try {
    const scriptWithSyntaxError = await isolate.compileScript(
      'function() { invalid syntax }'
    );
  } catch (error) {
    console.log(
      'Caught syntax error during compilation:',
      (error as any).message
    );
  }

  // Script with a runtime error
  try {
    const scriptWithRuntimeError = await isolate.compileScript(
      'undefinedVariable.method()'
    );
    await scriptWithRuntimeError.run(context);
  } catch (error) {
    console.log(
      'Caught runtime error during execution:',
      (error as any).message
    );
  }

  // Script with an infinite loop (timeout)
  try {
    const infiniteLoopScript = await isolate.compileScript('while(true) {}');
    console.log('Running infinite loop with timeout...');
    await infiniteLoopScript.run(context, { timeout: 500 }); // 500ms timeout
  } catch (error) {
    console.log('Caught timeout error:', (error as any).message);
  } finally {
    context.release();
    isolate.dispose();
  }
}

// Demo 7: Performance Measurement
async function performanceDemo() {
  console.log('\n=== Demo 7: Performance Measurement ===');

  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();

  // Create a compute-intensive script
  const computeScript = await isolate.compileScript(`
    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }

    fibonacci(20); // Compute-intensive calculation
  `);

  // Measure execution time
  const start = performance.now();
  const result = await computeScript.run(context, { timeout: 5000 });
  const end = performance.now();

  console.log(`Fibonacci result: ${result}`);
  console.log(`Execution time: ${(end - start).toFixed(2)}ms`);

  // Clean up
  context.release();
  computeScript.release();
  isolate.dispose();
}

// Demo 8: Building a Sandbox Environment
async function sandboxDemo() {
  console.log('\n=== Demo 8: Building a Sandbox Environment ===');

  const isolate = new ivm.Isolate({ memoryLimit: 128 });
  const context = await isolate.createContext();
  const global = context.global;

  // Set up a minimal console implementation
  const consoleMock = {
    log: new ivm.Reference(function (...args: any[]) {
      console.log('[Sandbox]', ...args);
    }),
    error: new ivm.Reference(function (...args: any[]) {
      console.error('[Sandbox Error]', ...args);
    }),
  };

  // Create a safe setTimeout implementation
  const setTimeoutMock = new ivm.Reference(function (
    callback: ivm.Reference,
    ms: number
  ) {
    // Limit the timeout to prevent abuse
    const limitedMs = Math.min(ms, 2000);

    setTimeout(() => {
      try {
        // Call the callback from the isolate
        callback.apply(undefined, [], { timeout: 500 });
      } catch (error) {
        console.error('Error in sandbox setTimeout callback:', error);
      } finally {
        callback.release();
      }
    }, limitedMs);

    return limitedMs;
  });

  // Set up the sandbox environment
  global.setSync('global', global.derefInto());
  global.setSync('console', consoleMock);
  global.setSync('setTimeout', setTimeoutMock);

  // Run a script in the sandbox
  const sandboxScript = await isolate.compileScript(`
    console.log('Hello from the sandbox!');

    // Test setTimeout
    setTimeout(() => {
      console.log('Timeout executed in sandbox');
    }, 1000);

    // Return a value
    'Sandbox initialized';
  `);

  const result = await sandboxScript.run(context, { timeout: 1000 });
  console.log('Script result:', result);

  // Wait for the setTimeout to complete
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Clean up
  context.release();
  sandboxScript.release();
  consoleMock.log.release();
  consoleMock.error.release();
  setTimeoutMock.release();
  isolate.dispose();
}

// Main function to run all demos
async function runIsolatedVMDemos() {
  console.log('Starting isolated-vm demos...');

  try {
    await basicIsolateDemo();
    await valuePassingDemo();
    await exposeFunctionsDemo();
    await memoryLimitsDemo();
    await transferableDemo();
    await errorHandlingDemo();
    await performanceDemo();
    await sandboxDemo();

    console.log('\nAll demos completed successfully!');
  } catch (error) {
    console.error('Demo failed with error:', error);
  }
}

// Run the demos
runIsolatedVMDemos().catch(console.error);
