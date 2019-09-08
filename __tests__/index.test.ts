import * as path from "path";
import * as fs from "fs";
import {promisify} from "util";
import * as rimraf from "rimraf";
import * as makeDir from 'make-dir';
import git from '..';

const baseDir = path.resolve('data');
let nameIndex = 1;

async function createRepo() {
  const repoDir = path.join(baseDir, (nameIndex++).toString());

  await makeDir(repoDir);

  const repo = git(repoDir);
  await repo.run(['init']);

  return repo;
}

function removeRepos() {
  return promisify(rimraf)(baseDir);
}

afterAll(() => {
  removeRepos();
});

describe('git-cli-wrapper', () => {
  test('hasCommit', async () => {
    const repo = await createRepo();

    expect(await repo.hasCommit()).toBeFalsy();

    await promisify(fs.writeFile)(repo.dir + '/test.txt', 'test');
    await repo.run(['add', 'test.txt']);
    await repo.run(['commit', '-am', 'add test.txt']);

    expect(await repo.hasCommit()).toBeTruthy();
  });

  test('getBranch', async () => {
    const repo = await createRepo();
    expect(await repo.getBranch()).toBe('master');

    await repo.run(['checkout', '-b', 'test']);
    expect(await repo.getBranch()).toBe('test');
  });
});
