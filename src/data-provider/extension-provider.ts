import * as vscode from 'vscode';
import { logger } from '../initOutputChannel';
import { DataOptions, DataProvider } from './data-provider';
import { readJsonContent, writeJsonContent } from '../file.utils';
import { getConfigSetting } from '../config';

interface Extension extends vscode.Extension<unknown> {
  packageJSON: {
    isBuiltin: boolean;
    publisher: string;
    name: string;
  };
}

export const ExtensionProviderId = 'extensions';

export class ExtensionProvider implements DataProvider {
  readonly id = ExtensionProviderId;
  public async backup({ path }: DataOptions): Promise<void> {
    const installedExtensions = this.getInstalledExtensions();
    logger.info('extensions backup', installedExtensions);
    const filename = this.getFilepath(path);
    await writeJsonContent(filename, installedExtensions);
  }

  private getInstalledExtensions() {
    return vscode.extensions.all
      .filter((ext: Extension) => !ext.packageJSON.isBuiltin)
      .map((ext: Extension) => {
        return `${ext.packageJSON.publisher}.${ext.packageJSON.name}`;
      })
      .sort();
  }

  private getFilepath(path: vscode.Uri) {
    return vscode.Uri.joinPath(path, 'extension.json');
  }

  public async restore({ path }: DataOptions): Promise<void> {
    const extensions: Array<string> = await readJsonContent(this.getFilepath(path), []);
    const installedExtensions = this.getInstalledExtensions();

    const missingExtensions = extensions.filter(ext => !installedExtensions.includes(ext));
    const deletedExtensions = getConfigSetting().get('removeExtensions')
      ? installedExtensions.filter(ext => !extensions.includes(ext))
      : [];
    logger.info('extensions restore', missingExtensions, ' deleted:', deletedExtensions);

    await Promise.all(missingExtensions.map(ext => this.installExtension(ext)));
    await Promise.all(deletedExtensions.map(ext => this.deleteExtension(ext)));
  }

  private async installExtension(ext: string) {
    try {
      await vscode.commands.executeCommand('workbench.extensions.installExtension', ext);
      logger.info(`extension ${ext} installed`);
    } catch (err) {
      logger.error(`extension ${ext} failed to install`, err);
    }
  }

  private async deleteExtension(ext: string) {
    try {
      await vscode.commands.executeCommand('workbench.extensions.uninstallExtension', ext);
      logger.info(`extension ${ext} deleted`);
    } catch (err) {
      logger.error(`extension ${ext} failed to delete`, err);
    }
  }
}
