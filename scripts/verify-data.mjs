import ts from 'typescript';
import { readFile, writeFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const folder = await mkdtemp(join(tmpdir(), 'resonance-test-'));

try {
  for (const file of await readdir(new URL('../src/data/', import.meta.url))) {
    if (!file.endsWith('.ts') || file === 'index.ts') continue;

    let source = await readFile(
      new URL('../src/data/' + file, import.meta.url),
      'utf8',
    );

    source = source.replace('import.meta.env.DEV', 'false');

    const output = ts
      .transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      })
      .outputText.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'");

    await writeFile(join(folder, file.replace('.ts', '.mjs')), output);
  }

  const { GENRES, EDGES, byId, findPath, search } = await import(
    pathToFileURL(join(folder, 'graph.mjs'))
  );

  assert.equal(GENRES.length, 146);
  assert.equal(new Set(GENRES.map((g) => g.id)).size, GENRES.length);
  assert.equal(GENRES.filter((g) => g.isRoot).length, 16);

  for (const g of GENRES) {
    assert.ok(byId[g.family]);

    if (g.parent) assert.ok(byId[g.parent]);

    assert.ok(g.wiki);
    assert.ok(g.tracks.length || g.albums.length);
  }

  for (const edge of EDGES) {
    assert.ok(byId[edge.from], edge.from);
    assert.ok(byId[edge.to], edge.to);
  }

  for (const [from, to] of [
    ['blues', 'metal'],
    ['disco', 'techno'],
    ['jazz', 'hiphop'],
  ]) {
    const route = findPath(from, to);

    assert.ok(route?.length);
    assert.equal(route[0].from, from);
    assert.equal(route.at(-1).to, to);

    route.forEach((step, i) => {
      assert.ok(EDGES.includes(step.edge));

      if (i) assert.equal(route[i - 1].to, step.from);
    });
  }

  const { buildLesson, BLACKENED_DEATH_LESSON } = await import(
    pathToFileURL(join(folder, 'lessons.mjs'))
  );

  assert.equal(BLACKENED_DEATH_LESSON.steps.at(-1).id, 'blackened-death-metal');

  const fusion = BLACKENED_DEATH_LESSON.edges.filter(
    (edge) => edge.to === 'blackened-death-metal',
  );

  assert.deepEqual(
    new Set(fusion.map((edge) => edge.from)),
    new Set(['black-metal', 'death-metal']),
  );

  assert.ok(fusion.every((edge) => edge.type === 'fusion'));

  assert.ok(
    !BLACKENED_DEATH_LESSON.edges.some(
      (edge) => edge.from === 'death-metal' && edge.to === 'black-metal',
    ),
  );

  for (const genre of GENRES) {
    const lesson = buildLesson(genre.id);
    const ids = lesson.steps.map((step) => step.id);

    assert.equal(ids.at(-1), genre.id);
    assert.equal(new Set(ids).size, ids.length);

    for (const edge of lesson.edges) {
      assert.ok(EDGES.includes(edge));
      assert.ok(ids.includes(edge.from) && ids.includes(edge.to));

      assert.ok(
        ids.indexOf(edge.from) < ids.indexOf(edge.to),
        `${genre.id}: non-topological lesson`,
      );
    }
  }

  const sceneSource = await readFile(
    new URL('../src/utils/sceneMath.ts', import.meta.url),
    'utf8',
  );

  await writeFile(
    join(folder, 'sceneMath.mjs'),
    ts.transpileModule(sceneSource, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  );

  const { createStarPositions, settleLabelVisibility, layoutLineage } =
    await import(pathToFileURL(join(folder, 'sceneMath.mjs')));

  const stars = createStarPositions(5200);

  assert.deepEqual(stars, createStarPositions(5200));

  const octants = Array(8).fill(0);

  for (let i = 0; i < stars.length; i += 3) {
    const [x, y, z] = stars.slice(i, i + 3);

    assert.ok(Math.hypot(x, y, z) >= 99.99 && Math.hypot(x, y, z) <= 145.01);
    octants[(x > 0 ? 1 : 0) + (y > 0 ? 2 : 0) + (z > 0 ? 4 : 0)]++;
  }

  assert.ok(
    octants.every((count) => count > 500),
    'Every sky octant must contain stars',
  );

  const visibility = { visible: true, candidate: true, changedAt: 0 };

  assert.equal(settleLabelVisibility(visibility, false, 0), true);
  assert.equal(settleLabelVisibility(visibility, true, 50), true);
  assert.equal(settleLabelVisibility(visibility, false, 70), true);
  assert.equal(settleLabelVisibility(visibility, false, 211), false);
  assert.equal(settleLabelVisibility(visibility, true, 230), false);
  assert.equal(settleLabelVisibility(visibility, true, 371), true);

  const layout = layoutLineage(
    BLACKENED_DEATH_LESSON.steps.map((step) => step.id),
    BLACKENED_DEATH_LESSON.edges,
  );

  assert.equal(layout.get('black-metal')[0], layout.get('death-metal')[0]);
  assert.notEqual(layout.get('black-metal')[1], layout.get('death-metal')[1]);

  assert.ok(
    layout.get('blackened-death-metal')[0] > layout.get('death-metal')[0],
  );

  console.log(
    'PASS: all 146 ancestry lessons, converging fusion branches, 360° stars and label visibility hysteresis.',
  );

  assert.equal(findPath('missing', 'jazz'), null);
  assert.equal(findPath('jazz', 'jazz'), null);
  assert.ok(search('Metallica').some((hit) => hit.kind === 'artist'));
  assert.ok(search('jAzZ').length);

  console.log(
    `PASS: ${GENRES.length} genres, 16 families, ${EDGES.length} valid relationships, connected paths and artist search.`,
  );
} finally {
  await rm(folder, { recursive: true, force: true });
}
