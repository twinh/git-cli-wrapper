import {createRepo, removeRepos} from "@gitsync/test";

afterAll(() => {
  removeRepos();
});

describe('ts-git', () => {
  test('hasCommit', async () => {
    const repo = await createRepo();
    expect(await repo.hasCommit()).toBeFalsy();

    await repo.commitFile('test.txt');
    expect(await repo.hasCommit()).toBeTruthy();
  });

  test('getBranch', async () => {
    const repo = await createRepo();
    expect(await repo.getBranch()).toBe('master');

    await repo.run(['checkout', '-b', 'test']);
    expect(await repo.getBranch()).toBe('test');
  });
});
