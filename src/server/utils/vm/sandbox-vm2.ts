import { Worker } from 'worker_threads';
import { env } from '../env.js';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import os from 'os';

// Function to create a temporary worker file
async function createTempWorkerFile(
  code: string,
  memoryLimitMB: number
): Promise<string> {
  const tempDir = os.tmpdir();
  const id = nanoid();
  const filePath = path.join(tempDir, `worker-${id}.js`);

  // The worker script that will use VM2 to execute the code
  const workerScript = `
    const { parentPort } = require('worker_threads');
    const { VM } = require('vm2');

    // Set up memory limit
    const memoryLimitBytes = ${memoryLimitMB} * 1024 * 1024;

    // Create a sandbox with console logging
    const logger = [];

    (async () => {
      try {
        const vm = new VM({
          timeout: 5000, // 5 seconds timeout
          sandbox: {
            console: {
              log: (...args) => {
                logger.push(['log', Date.now(), ...args]);
              },
              warn: (...args) => {
                logger.push(['warn', Date.now(), ...args]);
              },
              error: (...args) => {
                logger.push(['error', Date.now(), ...args]);
              }
            },
            request: async (config) => {
              // This is a simplified version of the request function
              // In a real implementation, you would use axios or another HTTP client
              const axios = require('axios');
              try {
                const result = await axios.request(config);
                return {
                  headers: { ...result.headers },
                  data: result.data,
                  status: result.status
                };
              } catch (error) {
                throw new Error(error.message);
              }
            }
          },
          compiler: 'javascript',
          eval: false,
          wasm: false
        });

        // Execute the code
        const start = Date.now();
        const result = await vm.run(${JSON.stringify(code)});
        const usage = Date.now() - start;

        // Send the result back to the parent
        parentPort.postMessage({ success: true, result, logger, usage });
      } catch (error) {
        // Send the error back to the parent
        parentPort.postMessage({
          success: false,
          error: error.message,
          logger
        });
      }
    })();
  `;

  await fs.promises.writeFile(filePath, workerScript);
  return filePath;
}

// Function to run code in VM2 via worker threads
export async function runCodeInVM2(
  code: string,
  memoryLimitMB = env.sandbox.memoryLimit
): Promise<{ logger: any[][]; result: any; usage: number }> {
  const start = Date.now();

  // Create a temporary worker file
  const workerFilePath = await createTempWorkerFile(code, memoryLimitMB);

  return new Promise((resolve, reject) => {
    // Create a worker
    const worker = new Worker(workerFilePath);

    // Set a timeout to kill the worker if it takes too long
    const timeout = setTimeout(() => {
      worker.terminate();
      fs.unlinkSync(workerFilePath);
      reject(new Error('Execution timed out'));
    }, 10000); // 10 seconds timeout

    // Listen for messages from the worker
    worker.on('message', (message) => {
      clearTimeout(timeout);

      // Clean up the temporary worker file
      fs.unlinkSync(workerFilePath);

      if (message.success) {
        resolve({
          logger: message.logger || [],
          result: message.result,
          usage: message.usage || Date.now() - start,
        });
      } else {
        const error = new Error(message.error || 'Unknown error');
        // error.logger = message.logger || [];
        reject(error);
      }
    });

    // Handle worker errors
    worker.on('error', (error) => {
      clearTimeout(timeout);
      fs.unlinkSync(workerFilePath);
      reject(error);
    });

    // Handle worker exit
    worker.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        fs.unlinkSync(workerFilePath);
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
