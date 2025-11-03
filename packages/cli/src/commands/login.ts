import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import type { Arguments, CommandBuilder } from 'yargs';
import { saveGlobalConfig } from '../utils/config.js';
import { createAPIClient } from '../utils/api.js';

interface LoginOptions {}

export const command = 'login';
export const desc = 'Login to Tianji and save credentials';

export const builder: CommandBuilder<LoginOptions, LoginOptions> = (yargs) => {
  return yargs;
};

export const handler = async (argv: Arguments<LoginOptions>): Promise<void> => {
  console.log(chalk.cyan('\n🔐 Login to Tianji\n'));

  try {
    const response = await prompts([
      {
        type: 'text',
        name: 'serverUrl',
        message: 'Tianji server URL:',
        initial: 'https://tianji.example.com',
        validate: (value) =>
          value.startsWith('http://') || value.startsWith('https://')
            ? true
            : 'Please enter a valid URL (http:// or https://)',
      },
      {
        type: 'text',
        name: 'workspaceId',
        message: 'Workspace ID:',
        validate: (value) =>
          value.length > 0 ? true : 'Workspace ID is required',
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'API Key:',
        validate: (value) => (value.length > 0 ? true : 'API Key is required'),
      },
    ]);

    // Check if user cancelled the prompts
    if (!response.serverUrl || !response.workspaceId || !response.apiKey) {
      console.log(chalk.yellow('\n❌ Login cancelled\n'));
      process.exit(0);
    }

    const spinner = ora('Verifying credentials...').start();

    // Test the connection
    const apiClient = createAPIClient({
      serverUrl: response.serverUrl,
      workspaceId: response.workspaceId,
      apiKey: response.apiKey,
    });

    const isValid = await apiClient.testConnection();

    if (!isValid) {
      spinner.fail(chalk.red('Invalid credentials'));
      console.error(
        chalk.red(
          '\nPlease check your server URL, workspace ID, and API key.\n'
        )
      );
      process.exit(1);
    }

    // Save the configuration
    await saveGlobalConfig({
      serverUrl: response.serverUrl,
      workspaceId: response.workspaceId,
      apiKey: response.apiKey,
    });

    spinner.succeed(chalk.green('Login successful!'));
    console.log(
      chalk.cyan('\n✨ Configuration saved to ~/.config/tianji/config.json\n')
    );
    console.log(chalk.white('You can now use:'));
    console.log(
      chalk.white('  tianji worker init <project-name>  # Create a new worker')
    );
    console.log(
      chalk.white('  tianji worker deploy               # Deploy your worker\n')
    );
  } catch (error) {
    console.error(chalk.red(`\nError: ${error}\n`));
    process.exit(1);
  }
};
