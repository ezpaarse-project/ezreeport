/* eslint-disable no-underscore-dangle */
import type { Command } from '@oclif/core';

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join, resolve, relative } from 'node:path';
import { homedir } from 'node:os';

import chalk from 'chalk';
import { readJSONSync, writeJSON } from './json.js';

export class EZRAConfig {
  private rootDir: string;

  public profilesDir: string;

  private loadedProfiles = new Map<number, Record<string, any>>();

  public configPath: string;

  public config: Record<string, any> = {};

  constructor(private command: Command, path?: string) {
    this.rootDir = join(homedir(), '.config/ezreeport-admin');
    this.profilesDir = join(this.rootDir, 'profiles');
    this.configPath = path || join(this.rootDir, 'config.json');

    if (existsSync(this.configPath)) {
      try {
        this.config = readJSONSync(this.configPath);

        // Read paths from config
        this.rootDir = this.config.rootDir || this.rootDir;
        this.profilesDir = this.config.profilesDir || join(this.rootDir, 'profiles');

        // Reload profiles
        this.applyProfiles();
      } catch (error) {
        command.logToStderr(chalk.red(`Error config ${chalk.underline(this.configPath)}: ${chalk.bold((error as Error).message)}`));
      }
    }

    // Ensuring root dir
    if (!existsSync(this.rootDir)) {
      mkdirSync(this.rootDir, { recursive: true });
    }

    // Ensuring profile dir
    if (!existsSync(this.profilesDir)) {
      mkdirSync(this.profilesDir, { recursive: true });
    }
  }

  /**
   * Load profiles from config
   *
   * @returns The profiles, key is the priority
   */
  private applyProfiles() {
    if (typeof this.config.profiles !== 'object' || Array.isArray(this.config.profiles)) {
      return;
    }

    const entries = Object.entries(this.config.profiles)
      .map(([key, value]) => [Number.parseInt(key, 10), value] as [number, string])
      .sort(([aPriority], [bPriority]) => bPriority - aPriority);

    // eslint-disable-next-line no-restricted-syntax
    for (const [priority, file] of entries) {
      this.applyProfile(priority, file);
    }
  }

  /**
   * Load a profile from disk and apply it
   *
   * @param priority The priority to apply
   * @param file The profile filename
   */
  private applyProfile(priority: number, file: string) {
    // Read config
    const path = resolve(this.profilesDir, file);
    let content;
    try {
      content = readJSONSync(path);
    } catch (error) {
      this.command.logToStderr(chalk.red(`Error loading profile ${chalk.underline(path)}: ${chalk.bold((error as Error).message)}`));
      return;
    }

    const { env = {}, ...profile } = content;

    // Set env
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(env)) {
      if (process.env[key] === `${value}`) {
        // eslint-disable-next-line no-continue
        continue;
      }

      this.command.log(chalk.grey(`${chalk.blue('ℹ')} Setting env ${chalk.bold(key, '=', value)}`));
      process.env[key] = `${value}`;
    }

    // Apply profile
    this.loadedProfiles.set(priority, { ...profile, path });
  }

  private static genProfileName(file: string) {
    return file
      .replace(/\.json$/i, '');
  }

  public static genProfileFileName(name: string) {
    return `${name}.json`;
  }

  public getLoadedProfiles() {
    const profiles: Record<string, string> = this.config.profiles || {};
    return new Map(
      Object.entries(profiles)
        .map(([priority, file]) => [
          EZRAConfig.genProfileName(file),
          { priority, file, path: resolve(this.profilesDir, file) },
        ]),
    );
  }

  /**
   * Get possible profiles
   *
   * @returns The profiles, key is the profile name
   */
  public getPossibleProfiles() {
    const map = new Map<string, Record<string, any> | Error>();

    const loaded = this.getLoadedProfiles();

    // eslint-disable-next-line no-restricted-syntax
    for (const file of readdirSync(this.profilesDir)) {
      if (!/\.json$/i.test(file)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const path = join(this.profilesDir, file);
      try {
        const content = readJSONSync(path);
        if (!content.url) {
          // eslint-disable-next-line no-continue
          continue;
        }

        const name = EZRAConfig.genProfileName(content.name || file);

        map.set(
          name,
          {
            ...content,
            name,
            path,
            priority: loaded.get(name)?.priority,
          },
        );
      } catch (error) {
        map.set(file, error as Error);
      }
    }
    return map;
  }

  /**
   * Get profiles following priority order
   *
   * @param index The index of the profile
   *
   * @returns The profile
   */
  public getProfileAt(index: number) {
    const profiles = Array.from(this.loadedProfiles.values());
    return profiles.at(index);
  }

  public getProfile(name: string) {
    const profileOrError = this.getPossibleProfiles().get(name);
    if (!profileOrError) {
      throw new Error(`Profile "${name}" not found`);
    }
    if (profileOrError instanceof Error) {
      throw new Error(`Error loading profile ${name}: ${(profileOrError as Error).message}`);
    }
    return profileOrError;
  }

  public async upsertProfile(name: string, data: Record<string, any>) {
    await writeJSON(
      join(this.profilesDir, EZRAConfig.genProfileFileName(name)),
      data,
      2,
    );
  }

  public async deleteProfile(name: string) {
    const profileOrError = this.getPossibleProfiles().get(name);
    if (!profileOrError || profileOrError instanceof Error) {
      return;
    }

    const profile = profileOrError;
    if (profile.priority != null) {
      await this.unloadProfile(profile.name);
    }

    await rm(profile.path);
  }

  public async loadProfile(name: string, priority?: number) {
    let p = priority;
    if (p == null) {
      const priorities = Array.from(this.loadedProfiles.keys());
      p = Math.max(...priorities, 0);
    }

    const profile = this.getProfile(name);

    const { config } = this;
    config.profiles[profile.priority] = undefined;
    config.profiles[p] = relative(this.profilesDir, profile.path);
    await this.update(config);

    return { profile, priority: p };
  }

  public async unloadProfile(name: string) {
    const profile = this.getProfile(name);

    if (profile.priority != null) {
      const { config } = this;
      config.profiles[profile.priority] = undefined;
      await this.update(config);
    }
  }

  /**
   * Save the main config
   */
  public async update(data: Record<string, any>) {
    try {
      this.config = data;
      await writeJSON(this.configPath, data, 2);
    } catch (error) {
      this.command.logToStderr(chalk.red(`Error saving config ${chalk.underline(this.configPath)}: ${chalk.bold((error as Error).message)}`));
    }
  }
}
