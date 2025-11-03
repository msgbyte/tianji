import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { Arguments, CommandBuilder } from 'yargs';

interface InitOptions {
  projectName?: string;
}

export const command = 'init [project-name]';
export const desc = 'Create a new Tianji Worker project';

export const builder: CommandBuilder<InitOptions, InitOptions> = (yargs) => {
  return yargs.positional('project-name', {
    type: 'string',
    describe:
      'Name of the project (optional, uses current directory if not provided)',
  });
};

export const handler = async (argv: Arguments<InitOptions>): Promise<void> => {
  const projectName = argv.projectName;
  const targetDir = projectName
    ? path.resolve(process.cwd(), projectName)
    : process.cwd();

  const templateDir = path.resolve(__dirname, '../../templates/worker');

  console.log(chalk.cyan('\n🚀 Initializing Tianji Worker project...\n'));

  // Check if target directory exists and is not empty
  if (projectName) {
    if (await fs.pathExists(targetDir)) {
      const files = await fs.readdir(targetDir);
      if (files.length > 0) {
        console.error(
          chalk.red(
            `Error: Directory "${projectName}" already exists and is not empty.`
          )
        );
        process.exit(1);
      }
    }
  } else {
    // If using current directory, check if it's not empty
    const files = await fs.readdir(targetDir);
    if (files.length > 0) {
      console.error(
        chalk.red(
          'Error: Current directory is not empty. Please use an empty directory or provide a project name.'
        )
      );
      process.exit(1);
    }
  }

  const spinner = ora('Creating project files...').start();

  try {
    // Ensure target directory exists
    await fs.ensureDir(targetDir);

    // Copy template files
    await fs.copy(templateDir, targetDir);

    // Update package.json with project name if provided
    if (projectName) {
      const packageJsonPath = path.join(targetDir, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.name = projectName;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      // Update .tianjirc with project name
      const tianjiRcPath = path.join(targetDir, '.tianjirc');
      const tianjiRc = await fs.readJson(tianjiRcPath);
      tianjiRc.name = projectName;
      await fs.writeJson(tianjiRcPath, tianjiRc, { spaces: 2 });
    }

    spinner.succeed(chalk.green('Project created successfully!'));

    // Show next steps
    console.log(chalk.cyan('\n📝 Next steps:\n'));
    if (projectName) {
      console.log(chalk.white(`  cd ${projectName}`));
    }
    console.log(chalk.white('  npm install'));
    console.log(chalk.white('  npm run build'));
    console.log(chalk.white('  tianji login              # if not logged in'));
    console.log(chalk.white('  tianji worker deploy'));
    console.log(chalk.cyan('\n✨ Happy coding!\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
};
