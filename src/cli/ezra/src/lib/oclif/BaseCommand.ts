import { Command, Flags, Interfaces } from '@oclif/core';
import chalk from 'chalk';

import { EZRAConfig } from '../config.js';

export type CustomFlags<T extends typeof Command> = Interfaces.InferredFlags<typeof BaseCommand['baseFlags'] & T['flags']>;
export type CustomArgs<T extends typeof Command> = Interfaces.InferredArgs<T['args']>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  protected ezraConfig: EZRAConfig = {} as EZRAConfig;

  static baseFlags = {
    // interactive: Flags.boolean({
    //   char: 'i',
    //   description: 'Run command in interactive mode',
    // }),
    config: Flags.string({
      char: 'c',
      description: 'Path to config file',
    }),
  };

  protected flags!: CustomFlags<T>;

  protected args!: CustomArgs<T>;

  public async init(): Promise<void> {
    await super.init();

    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: this.ctor.strict,
    });
    this.flags = flags as CustomFlags<T>;
    this.args = args as CustomArgs<T>;

    this.ezraConfig = new EZRAConfig(this, this.flags.config);
  }

  protected catch(err: Interfaces.CommandError): Promise<any> {
    if (err instanceof Error) {
      this.logToStderr(chalk.red(err.message));
    }
    return super.catch(err);
  }
}
