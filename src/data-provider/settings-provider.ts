import * as vscode from 'vscode';
import { DataOptions, DataProvider } from './data-provider';
import { readJsonContent, writeJsonContent } from '../file.utils';
import { getConfigSetting } from '../config';
import { logger } from '../initOutputChannel';

type Settings = Record<string, unknown> | false;

export class SettingsProvider implements DataProvider {
  readonly id = 'settings';
  public async backup({ path, userFolder }: DataOptions): Promise<void> {
    const source = this.getFilepath(userFolder);
    const target = this.getFilepath(path);

    const settings = await readJsonContent(source, false as Settings);
    if (!settings) {
      return;
    }
    delete settings['local-sync.backupPath'];
    logger.info('settings backup');
    await writeJsonContent(target, settings);
  }

  private getFilepath(path: vscode.Uri) {
    return vscode.Uri.joinPath(path, 'settings.json');
  }

  public async restore({ path, userFolder }: DataOptions): Promise<void> {
    const source = this.getFilepath(path);
    const target = this.getFilepath(userFolder);

    const backupPath = getConfigSetting().get('backupPath');
    const settings = await readJsonContent(source, false as Settings);
    if (!settings) {
      return;
    }
    settings['local-sync.backupPath'] = backupPath;
    logger.info('settings restore');
    await writeJsonContent(target, settings);
  }
}
