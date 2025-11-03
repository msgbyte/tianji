import * as fs from 'fs-extra';
import * as path from 'path';
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

interface PullOptions {
  workerId?: string;
  overwrite?: boolean;
}

export const command = 'pull [worker-id]';
export const desc = 'Pull worker code from remote Tianji server';

export const builder: CommandBuilder<PullOptions, PullOptions> = (yargs) => {
  return yargs
    .positional('worker-id', {
      type: 'string',
      describe: 'Worker ID to pull (optional if .tianjirc exists)',
    })
    .option('overwrite', {
      type: 'boolean',
      describe: 'Overwrite existing src/index.ts file',
      default: false,
    });
};

export const handler = async (argv: Arguments<PullOptions>): Promise<void> => {
  console.log(chalk.cyan('\n📥 Pulling Tianji Worker from remote...\n'));

  try {
    // Check if user is logged in
    if (!(await isLoggedIn())) {
      console.error(
        chalk.red('Error: Not logged in. Please run "tianji login" first.\n')
      );
      process.exit(1);
    }

    // Load global config
    const globalConfig = await loadGlobalConfig();
    if (!globalConfig) {
      console.error(
        chalk.red(
          'Error: Configuration not found. Please run "tianji login" first.\n'
        )
      );
      process.exit(1);
    }

    const currentDir = process.cwd();
    const projectConfig = await loadProjectConfig(currentDir);
    const hasTianjirc = projectConfig !== null;

    // Determine worker ID
    let workerId: string | undefined;
    if (argv.workerId) {
      // Command line argument takes priority
      workerId = argv.workerId;
    } else if (hasTianjirc && projectConfig.workerId) {
      // Use worker ID from .tianjirc
      workerId = projectConfig.workerId;
    }

    if (!workerId) {
      console.error(
        chalk.red(
          'Error: Worker ID is required. Please provide it as an argument or ensure .tianjirc contains a workerId.\n'
        )
      );
      console.log(chalk.white('Usage: tianji worker pull <worker-id>\n'));
      process.exit(1);
    }

    // Check directory status
    const files = await fs.readdir(currentDir);
    const isEmptyDir = files.length === 0;

    if (!hasTianjirc && !isEmptyDir) {
      // Directory is not empty and not a Tianji worker project
      console.error(
        chalk.red(
          'Error: Current directory is not empty and is not a Tianji worker project.\n'
        )
      );
      console.log(
        chalk.yellow(
          '⚠️  Warning: Please use an empty directory or navigate to an existing Tianji worker project.\n'
        )
      );
      process.exit(1);
    }

    // Fetch worker from API
    const fetchSpinner = ora('Fetching worker from remote...').start();
    let worker;
    try {
      const apiClient = createAPIClient(globalConfig);
      worker = await apiClient.getWorker(workerId);

      if (!worker) {
        fetchSpinner.fail(chalk.red('Worker not found'));
        console.error(
          chalk.red(`\nError: Worker with ID "${workerId}" not found.\n`)
        );
        process.exit(1);
      }

      fetchSpinner.succeed(chalk.green('Worker fetched successfully'));
    } catch (error) {
      fetchSpinner.fail(chalk.red('Failed to fetch worker'));
      console.error(chalk.red(`\nError: ${error}\n`));
      process.exit(1);
    }

    // If this is a new project (no .tianjirc), initialize project structure
    if (!hasTianjirc) {
      const initSpinner = ora('Initializing project structure...').start();
      try {
        const templateDir = path.resolve(
          __dirname,
          '../../../templates/worker'
        );

        // Copy template files
        await fs.copy(templateDir, currentDir);

        // Update package.json with worker name
        const packageJsonPath = path.join(currentDir, 'package.json');
        const packageJson = await fs.readJson(packageJsonPath);
        packageJson.name = worker.name;
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

        // Update .tianjirc with worker info
        const tianjiRcPath = path.join(currentDir, '.tianjirc');
        const tianjiRc = await fs.readJson(tianjiRcPath);
        tianjiRc.name = worker.name;
        tianjiRc.workerId = worker.id;
        await fs.writeJson(tianjiRcPath, tianjiRc, { spaces: 2 });

        initSpinner.succeed(chalk.green('Project structure initialized'));
      } catch (error) {
        initSpinner.fail(chalk.red('Failed to initialize project'));
        console.error(chalk.red(`\nError: ${error}\n`));
        process.exit(1);
      }
    } else {
      // Update existing .tianjirc if worker ID was provided via command line
      if (argv.workerId && projectConfig.workerId !== argv.workerId) {
        const updateSpinner = ora('Updating .tianjirc...').start();
        try {
          projectConfig.workerId = argv.workerId;
          projectConfig.name = worker.name;
          await saveProjectConfig(projectConfig, currentDir);
          updateSpinner.succeed(chalk.green('.tianjirc updated'));
        } catch (error) {
          updateSpinner.fail(chalk.red('Failed to update .tianjirc'));
          console.error(chalk.red(`\nError: ${error}\n`));
          process.exit(1);
        }
      }
    }

    // Save the pulled code to src/index.ts
    const saveSpinner = ora('Saving worker code...').start();
    try {
      const srcDir = path.join(currentDir, 'src');
      await fs.ensureDir(srcDir);

      const srcFilePath = path.join(srcDir, 'index.ts');

      // Check if file exists and overwrite flag is not set
      if (await fs.pathExists(srcFilePath)) {
        if (!argv.overwrite) {
          saveSpinner.fail(chalk.red('File exists'));
          console.error(
            chalk.red(
              '\nError: src/index.ts already exists. Use --overwrite to overwrite it.\n'
            )
          );
          console.log(
            chalk.yellow(
              '⚠️  To prevent accidental data loss, you must explicitly use --overwrite flag:\n'
            )
          );
          console.log(chalk.white('  tianji worker pull --overwrite\n'));
          process.exit(1);
        } else {
          saveSpinner.text = 'Overwriting existing worker code...';
        }
      }

      await fs.writeFile(srcFilePath, worker.code, 'utf-8');

      saveSpinner.succeed(chalk.green('Worker code saved'));

      // Show warning about JavaScript code
      console.log(
        chalk.yellow(
          '\n⚠️  Warning: The pulled code is JavaScript but saved as .ts file.\n'
        )
      );
    } catch (error) {
      saveSpinner.fail(chalk.red('Failed to save worker code'));
      console.error(chalk.red(`\nError: ${error}\n`));
      process.exit(1);
    }

    // Show success message
    console.log(chalk.cyan('\n✨ Worker pulled successfully!\n'));
    console.log(chalk.white(`  Worker ID: ${worker.id}`));
    console.log(chalk.white(`  Name: ${worker.name}`));
    if (worker.description) {
      console.log(chalk.white(`  Description: ${worker.description}`));
    }

    // Show next steps
    console.log(chalk.cyan('\n📝 Next steps:\n'));
    if (!hasTianjirc) {
      console.log(chalk.white('  npm install'));
    }
    console.log(chalk.white('  # Edit src/index.ts to modify your worker'));
    console.log(chalk.white('  npm run build'));
    console.log(chalk.white('  tianji worker deploy'));
    console.log(chalk.cyan('\n✨ Happy coding!\n'));
  } catch (error) {
    console.error(chalk.red(`\nError: ${error}\n`));
    process.exit(1);
  }
};
