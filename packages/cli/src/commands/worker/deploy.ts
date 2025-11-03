import * as fs from 'fs-extra';
import * as path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
import type { Arguments, CommandBuilder } from 'yargs';
import {
  loadGlobalConfig,
  loadProjectConfig,
  saveProjectConfig,
  isLoggedIn,
} from '../../utils/config.js';
import { createAPIClient } from '../../utils/api.js';

interface DeployOptions {}

export const command = 'deploy';
export const desc = 'Build and deploy worker to Tianji';

export const builder: CommandBuilder<DeployOptions, DeployOptions> = (
  yargs
) => {
  return yargs;
};

export const handler = async (
  argv: Arguments<DeployOptions>
): Promise<void> => {
  console.log(chalk.cyan('\n📦 Deploying Tianji Worker...\n'));

  try {
    // Check if user is logged in
    if (!(await isLoggedIn())) {
      console.error(
        chalk.red(
          'Error: Not logged in. Please run "tianji worker login" first.\n'
        )
      );
      process.exit(1);
    }

    // Load global config
    const globalConfig = await loadGlobalConfig();
    if (!globalConfig) {
      console.error(
        chalk.red(
          'Error: Configuration not found. Please run "tianji worker login" first.\n'
        )
      );
      process.exit(1);
    }

    // Load project config
    const projectConfig = await loadProjectConfig();
    if (!projectConfig) {
      console.error(
        chalk.red(
          'Error: .tianjirc not found. Make sure you are in a Tianji Worker project directory.\n'
        )
      );
      process.exit(1);
    }

    const projectName = projectConfig.name || 'tianji-worker';
    const workerId = projectConfig.workerId;

    // Check if package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!(await fs.pathExists(packageJsonPath))) {
      console.error(
        chalk.red(
          'Error: package.json not found. Are you in the project root directory?\n'
        )
      );
      process.exit(1);
    }

    // Check if node_modules exists
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!(await fs.pathExists(nodeModulesPath))) {
      console.error(
        chalk.red(
          'Error: node_modules not found. Please run "npm install" first.\n'
        )
      );
      process.exit(1);
    }

    // Build the project
    const buildSpinner = ora('Building project...').start();
    try {
      execSync('npm run build', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      buildSpinner.succeed(chalk.green('Build completed'));
    } catch (error) {
      buildSpinner.fail(chalk.red('Build failed'));
      console.error(chalk.red(`\n${error}\n`));
      process.exit(1);
    }

    // Read the built code
    const distPath = path.join(process.cwd(), 'dist', 'index.js');
    if (!(await fs.pathExists(distPath))) {
      console.error(
        chalk.red(
          `Error: Built file not found at ${distPath}. Please check your build configuration.\n`
        )
      );
      process.exit(1);
    }

    const code = await fs.readFile(distPath, 'utf-8');

    // Deploy to Tianji
    const deploySpinner = ora('Deploying to Tianji...').start();
    try {
      const apiClient = createAPIClient(globalConfig);

      const worker = await apiClient.upsertWorker({
        id: workerId,
        name: projectName,
        code: code,
        active: true,
      });

      // Save worker ID if it's a new worker
      if (!workerId && worker.id) {
        projectConfig.workerId = worker.id;
        await saveProjectConfig(projectConfig);
      }

      deploySpinner.succeed(chalk.green('Deployment successful!'));

      console.log(chalk.cyan('\n✨ Worker deployed successfully!\n'));
      console.log(chalk.white(`  Worker ID: ${worker.id}`));
      console.log(chalk.white(`  Name: ${worker.name}`));
      console.log(
        chalk.white(
          `  URL: ${globalConfig.serverUrl}/api/worker/${globalConfig.workspaceId}/${worker.id}`
        )
      );
      console.log();
    } catch (error) {
      deploySpinner.fail(chalk.red('Deployment failed'));
      console.error(chalk.red(`\nError: ${error}\n`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`\nError: ${error}\n`));
    process.exit(1);
  }
};
