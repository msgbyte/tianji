const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const tar = require('tar');
const { spawnSync } = require('node:child_process');
const {
  buildArtifactsSkill,
  skillFiles,
} = require('./build-artifacts-skill.cjs');

test('artifact download contains only current installable skill sources', async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), 'tianji-artifacts-skill-')
  );
  try {
    const archive = path.join(temp, 'tianji-artifacts.tar.gz');
    await buildArtifactsSkill(archive);
    await tar.x({ file: archive, cwd: temp });
    const skill = path.join(temp, 'tianji-artifacts');
    for (const file of skillFiles) {
      assert.deepEqual(
        await fs.readFile(path.join(skill, file)),
        await fs.readFile(
          path.resolve(__dirname, '../../skills/tianji-artifacts', file)
        )
      );
    }
    assert.deepEqual((await fs.readdir(skill)).sort(), [
      'LICENSE.txt',
      'SKILL.md',
      'THIRD_PARTY.md',
      'assets',
      'references',
      'scripts',
    ]);
    assert.deepEqual(
      (await fs.readdir(path.join(skill, 'references'))).sort(),
      ['authoring.md', 'operations.md']
    );
    const entries = [];
    await tar.t({
      file: archive,
      onentry: (entry) => entries.push(entry.path),
    });
    assert.deepEqual(
      entries.sort(),
      skillFiles.map((file) => `tianji-artifacts/${file}`).sort()
    );
    assert.deepEqual(
      await fs.readFile(archive),
      await fs.readFile(
        path.resolve(__dirname, '../static/skills/tianji-artifacts.tar.gz')
      )
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});

test('initializer refuses existing destinations without changing their content', async () => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), 'tianji-artifact-existing-')
  );
  try {
    const marker = path.join(temp, 'keep.txt');
    await fs.writeFile(marker, 'Existing work');
    const result = spawnSync(
      'bash',
      [
        path.resolve(
          __dirname,
          '../../skills/tianji-artifacts/scripts/init-artifact.sh'
        ),
        temp,
      ],
      { encoding: 'utf8' }
    );
    assert.notEqual(result.status, 0);
    assert.equal(await fs.readFile(marker, 'utf8'), 'Existing work');
    assert.deepEqual(await fs.readdir(temp), ['keep.txt']);
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});
