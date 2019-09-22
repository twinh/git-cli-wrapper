import * as path from "path";
import * as fs from "fs";
import {promisify} from "util";
import * as rimraf from "rimraf";
import theme from 'chalk-theme';
import git, {GitOptions} from '..';

const baseDir = path.resolve('data');
let nameIndex = 1;

let logs: string[][] = [];
const logger = {
  trace: (...params: any[]) => {
    params.unshift('trace');
    logs.push(params);
  },
  debug: (...params: any[]) => {
    params.unshift('debug')
    logs.push(params);
  },
};

async function createRepo(options: GitOptions = {}) {
  const repoDir = path.join(baseDir, (nameIndex++).toString());
  await promisify(fs.mkdir)(repoDir, {recursive: true});

  const repo = git(repoDir, options);
  await repo.run(['init']);

  return repo;
}

function removeRepos() {
  return promisify(rimraf)(baseDir);
}

afterAll(() => {
  removeRepos();
});

afterEach(() => {
  logs = [];
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

  test('startLog endLog success', async () => {
    const repo = await createRepo({
      logger: logger
    });

    expect(logs[0]).toEqual(['debug', `${path.basename(repo.dir)} run command: init`]);
    expect(logs[1][0]).toEqual('trace');
    expect(logs[1][1]).toEqual('command: %s, duration: %s, exit code: %s, output: %s');
    expect(logs[1][2]).toEqual(theme.info('init'));
    expect(logs[1][4]).toEqual(theme.info('0'));
  });

  test('startLog endLog error', async () => {
    const repo = await createRepo({
      logger: logger
    });

    await repo.run(['unknown'], {mute: true});

    expect(logs[2]).toEqual(['debug', `${path.basename(repo.dir)} run command: unknown`]);
    expect(logs[3][0]).toEqual('trace');
    expect(logs[3][1]).toEqual('command: %s, duration: %s, exit code: %s, output: %s');
    expect(logs[3][2]).toEqual(theme.info('unknown'));
    expect(logs[3][4]).toEqual(theme.info('1'));
  });
});
