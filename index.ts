import * as execa from 'execa';
import * as path from 'path';
import theme from 'chalk-theme';
import {ExecaReturnValue} from "execa";

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
  private start: Date;

  get dir(): string {
    return this._dir;
  }

  constructor(dir: string, options: GitOptions = {}) {
    this._dir = dir;
    this.name = path.basename(dir);
    options.logger && (this.logger = options.logger);
  }

  async run(args: string[], options: RunOptions = {}) {
    this.startLog(args);

    const proc = execa('git', args, {
      cwd: this._dir,
      env: options.env,
    });
    if (options.input) {
      proc.stdin.end(options.input);
    }

    try {
      const result = await proc;

      this.endLog(args, result);

      if (options.trimEnd === false) {
        return result.all;
      }

      return result.all.trimEnd();
    } catch (e) {
      this.endLog(args, e);

      if (!options.mute) {
        throw new Error(e.message + '. Output: ' + e.all);
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

  private startLog(args: string[]) {
    this.logger && this.logger.debug(`${this.name} run command: ${args.join(' ')}`);
    this.start = new Date();
  }

  private endLog(args: string[], result: ExecaReturnValue<string>) {
    this.logger && this.logger.trace(
      'command: %s, duration: %s, exit code: %s, output: %s',
      theme.info(args[0]),
      theme.info((new Date().getMilliseconds() - this.start.getMilliseconds()).toString() + 'ms'),
      theme.info(result.exitCode.toString()),
      result.all,
    );
  }
}

function git(dir: string, options: GitOptions = {}) {
  if (typeof options.logger === 'undefined') {
    options.logger = git.logger;
  }
  return new Git(dir, options);
}

git.logger = null;

export default git;
