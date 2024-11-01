import * as vscode from 'vscode';
import { DataOptions, DataProvider } from './data-provider';
import { readJsonContent, writeJsonContent } from '../file.utils';
import { getConfigSetting } from '../config';
import { logger } from '../initOutputChannel';

export class SettingsProvider implements DataProvider {
  readonly id = 'settings';

  #ignoreSettings: Array<string> = [
    'local-sync.backupPath',
    'local-sync.ignoreSettings',
    'local-sync.ignoreExtensions',
  ];
  public async backup({ path, userFolder, dryRun }: DataOptions): Promise<void> {
    const source = this.getFilepath(userFolder);
    const target = this.getFilepath(path);

    const settings = await readJsonContent<Record<string, unknown>>(source);
    if (!settings) {
      return;
    }

    for (const setting of this.getIgnoreSettings()) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete settings[setting];
    }
    if (!dryRun) {
      logger.info('settings backup');
      await writeJsonContent(target, settings);
    } else {
      logger.info('settings backup', settings);
    }
  }

  private getIgnoreSettings(): Array<string> {
    return [...this.#ignoreSettings, ...(getConfigSetting().get<Array<string>>('local-sync.ignoreSettings') || [])];
  }

  private getFilepath(path: vscode.Uri) {
    return vscode.Uri.joinPath(path, 'settings.json');
  }

  public async restore({ path, userFolder, dryRun }: DataOptions): Promise<void> {
    const source = this.getFilepath(path);
    const target = this.getFilepath(userFolder);

    const ignoredValues = this.getIgnoreSettings().map(key => ({
      key,
      value: vscode.workspace.getConfiguration(key),
    }));
    const settings = await readJsonContent<Record<string, unknown>>(source);
    if (!settings) {
      return;
    }

    for (const { key, value } of ignoredValues) {
      settings[key] = value;
    }
    if (!dryRun) {
      logger.info('settings restore');
      await writeJsonContent(target, settings);
    } else {
      logger.info('settings restore', settings);
    }
  }
}
