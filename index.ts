import * as execa from 'execa';
import log from '@gitsync/log';
import theme from 'chalk-theme';
import * as path from 'path';

export interface RunOptions {
  trimEnd?: boolean
  mute?: boolean
  env?: {}
  input?: string
}

export class Git {
  private _dir: string;
  private name: string;

  get dir(): string {
    return this._dir;
  }

  constructor(dir: string) {
    this._dir = dir;
    this.name = path.basename(dir);
  }

  async run(args: string[], options: RunOptions = {}) {
    log.info(`${this.name} run command: ${args.join(' ')}`);

    const start = new Date();

    const proc = execa('git', args, {
      cwd: this._dir,
      env: options.env,
    });
    if (options.input) {
      proc.stdin.end(options.input);
    }

    try {
      const result = await proc;

      log.verbose('command: %s, duration: %s, exit code: %s, output: %s',
        theme.info(args[0]),
        theme.info((new Date().getMilliseconds() - start.getMilliseconds()).toString() + 'ms'),
        theme.info(result.exitCode.toString()),
        result.all,
      );

      if (options.trimEnd === false) {
        return result.all;
      }

      return result.all.trimEnd();
    } catch (e) {
      if (!options.mute) {
        throw e;
      }
    }
  }

  // TODO proxy?
  log(args: string[], options: RunOptions = {}) {
    args.unshift('log');
    return this.run(args, options);
  }

  getBranch() {
    return this.run(['symbolic-ref', '--short', 'HEAD']);
  }
}

function git(dir: string) {
  return new Git(dir);
}

export default git;
