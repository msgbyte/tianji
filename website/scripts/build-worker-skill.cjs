const fs = require('node:fs/promises');
const path = require('node:path');
const tar = require('tar');

const skillsDir = path.resolve(__dirname, '../../skills');

async function buildWorkerSkill(
  outputFile = path.resolve(__dirname, '../static/skills/tianji-worker.tar.gz')
) {
  await fs.mkdir(path.join(skillsDir, 'tianji-worker/references'), {
    recursive: true,
  });
  await fs.copyFile(
    path.resolve(__dirname, '../docs/worker/agent-reference.md'),
    path.join(skillsDir, 'tianji-worker/references/agent-reference.md')
  );
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await tar.c(
    {
      cwd: skillsDir,
      file: outputFile,
      gzip: true,
      portable: true,
      mtime: new Date(0),
    },
    [
      'tianji-worker/SKILL.md',
      'tianji-worker/references/operations.md',
      'tianji-worker/references/agent-reference.md',
    ]
  );
}

module.exports = { buildWorkerSkill };

if (require.main === module) {
  buildWorkerSkill().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
