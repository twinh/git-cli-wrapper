import * as execa from 'execa';
import * as path from 'path';
import theme from 'chalk-theme';

export interface RunOptions {
  trimEnd?: boolean
  mute?: boolean
  env?: {}
  input?: string
}

export interface GitOptions {
  logger?: Logger,
}

export interface Logger {
  trace(message?: any, ...params: any[]): void;

  debug(message?: any, ...params: any[]): void;

  [key: string]: any;
}

export class Git {
  private _dir: string;
  private name: string;
  private logger: Logger;

  get dir(): string {
    return this._dir;
  }

  constructor(dir: string, options: GitOptions = {}) {
    this._dir = dir;
    this.name = path.basename(dir);
    options.logger && (this.logger = options.logger);
  }

  async run(args: string[], options: RunOptions = {}) {
    this.logger && this.logger.debug(`${this.name} run command: ${args.join(' ')}`);

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

      this.logger && this.logger.trace(
        'command: %s, duration: %s, exit code: %s, output: %s',
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

  /**
   * Check if the repo has commit
   */
  async hasCommit() {
    return !!(await this.run(['rev-list', '-n', '1', '--all']));
  }

  getBranch() {
    return this.run(['symbolic-ref', '--short', 'HEAD']);
  }
}

export default function git(dir: string, options: GitOptions = {}) {
  return new Git(dir, options);
}
