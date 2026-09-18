const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const tar = require('tar');
const { buildWorkerSkill } = require('./build-worker-skill.cjs');

test('download extracts into an installable skill with current references', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'tianji-worker-skill-'));
  try {
    const archive = path.join(temp, 'tianji-worker.tar.gz');
    await buildWorkerSkill(archive);
    assert.ok((await fs.readdir(temp)).includes('tianji-worker.tar.gz'));
    await tar.x({ file: archive, cwd: temp });
    const skill = path.join(temp, 'tianji-worker');
    for (const file of [
      'SKILL.md',
      'references/operations.md',
      'references/agent-reference.md',
    ]) {
      assert.equal(
        await fs.readFile(path.join(skill, file), 'utf8'),
        await fs.readFile(
          path.resolve(__dirname, '../../skills/tianji-worker', file),
          'utf8'
        )
      );
    }
    assert.equal(
      await fs.readFile(
        path.join(skill, 'references/agent-reference.md'),
        'utf8'
      ),
      await fs.readFile(
        path.resolve(__dirname, '../docs/worker/agent-reference.md'),
        'utf8'
      )
    );
    assert.deepEqual((await fs.readdir(skill)).sort(), [
      'SKILL.md',
      'references',
    ]);
    assert.deepEqual(
      (await fs.readdir(path.join(skill, 'references'))).sort(),
      ['agent-reference.md', 'operations.md']
    );
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
});
