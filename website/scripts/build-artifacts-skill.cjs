const fs = require('node:fs/promises');
const path = require('node:path');
const tar = require('tar');

const skillFiles = [
  'SKILL.md',
  'LICENSE.txt',
  'THIRD_PARTY.md',
  'references/operations.md',
  'references/authoring.md',
  'scripts/init-artifact.sh',
  'scripts/bundle-artifact.sh',
  'assets/shadcn-components.tar.gz',
  ...[
    '.gitignore',
    'components.json',
    'index.html',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'postcss.config.cjs',
    'tailwind.config.cjs',
    'tsconfig.json',
    'vite.config.ts',
    'scripts/bundle.mjs',
    'src/App.tsx',
    'src/index.css',
    'src/main.tsx',
  ].map((file) => `assets/react/${file}`),
];

async function buildArtifactsSkill(
  outputFile = path.resolve(
    __dirname,
    '../static/skills/tianji-artifacts.tar.gz'
  )
) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await tar.c(
    {
      cwd: path.resolve(__dirname, '../../skills'),
      file: outputFile,
      gzip: true,
      portable: true,
      mtime: new Date(0),
    },
    skillFiles.map((file) => `tianji-artifacts/${file}`)
  );
}

module.exports = { buildArtifactsSkill, skillFiles };

if (require.main === module) {
  buildArtifactsSkill().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
