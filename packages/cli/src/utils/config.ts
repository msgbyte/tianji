import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface GlobalConfig {
  serverUrl: string;
  workspaceId: string;
  apiKey: string;
}

export interface ProjectConfig {
  workerId?: string;
  name?: string;
}

const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.config', 'tianji');
const GLOBAL_CONFIG_PATH = path.join(GLOBAL_CONFIG_DIR, 'config.json');
const PROJECT_CONFIG_FILE = '.tianjirc';

/**
 * Load global configuration from ~/.config/tianji/config.json
 */
export async function loadGlobalConfig(): Promise<GlobalConfig | null> {
  try {
    if (await fs.pathExists(GLOBAL_CONFIG_PATH)) {
      const config = await fs.readJson(GLOBAL_CONFIG_PATH);
      return config;
    }
    return null;
  } catch (error) {
    console.error('Error loading global config:', error);
    return null;
  }
}

/**
 * Save global configuration to ~/.config/tianji/config.json
 */
export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  try {
    await fs.ensureDir(GLOBAL_CONFIG_DIR);
    await fs.writeJson(GLOBAL_CONFIG_PATH, config, { spaces: 2 });
  } catch (error) {
    throw new Error(`Failed to save global config: ${error}`);
  }
}

/**
 * Load project configuration from .tianjirc in current directory
 */
export async function loadProjectConfig(
  cwd: string = process.cwd()
): Promise<ProjectConfig | null> {
  try {
    const projectConfigPath = path.join(cwd, PROJECT_CONFIG_FILE);
    if (await fs.pathExists(projectConfigPath)) {
      const config = await fs.readJson(projectConfigPath);
      return config;
    }
    return null;
  } catch (error) {
    console.error('Error loading project config:', error);
    return null;
  }
}

/**
 * Save project configuration to .tianjirc in specified directory
 */
export async function saveProjectConfig(
  config: ProjectConfig,
  cwd: string = process.cwd()
): Promise<void> {
  try {
    const projectConfigPath = path.join(cwd, PROJECT_CONFIG_FILE);
    await fs.writeJson(projectConfigPath, config, { spaces: 2 });
  } catch (error) {
    throw new Error(`Failed to save project config: ${error}`);
  }
}

/**
 * Check if user is logged in (has valid global config)
 */
export async function isLoggedIn(): Promise<boolean> {
  const config = await loadGlobalConfig();
  return (
    config !== null &&
    Boolean(config.serverUrl) &&
    Boolean(config.workspaceId) &&
    Boolean(config.apiKey)
  );
}
