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
    version: string;
  };
}

export const ExtensionProviderId = 'extensions';

export class ExtensionProvider implements DataProvider {
  readonly id = ExtensionProviderId;
  #extensionFolder: vscode.Uri;

  constructor(extensionFolder: vscode.Uri) {
    this.#extensionFolder = extensionFolder;
  }

  public async backup({ path, dryRun }: DataOptions): Promise<void> {
    const installedExtensions = this.filterIgnoredExtensions(await this.getInstalledExtensions()).sort();

    logger.info('extensions backup', installedExtensions);
    if (!dryRun) {
      const filename = this.getFilepath(path);
      await writeJsonContent(filename, installedExtensions);
    }
  }

  private async getInstalledExtensions(): Promise<Array<string>> {
    const extensions = await readJsonContent<Array<VSCodeExtensionsJSON>>(this.#extensionFolder);

    if (extensions?.length) {
      return extensions.map(ext => ext.identifier.id);
    }
    return vscode.extensions.all
      .filter((ext: Extension) => !ext.packageJSON.isBuiltin)
      .map((ext: Extension) => `${ext.packageJSON.publisher}.${ext.packageJSON.name}`);
  }

  private getFilepath(path: vscode.Uri) {
    return vscode.Uri.joinPath(path, 'extension.json');
  }

  private get shouldRemoveExtensions(): boolean {
    return !!getConfigSetting().get<boolean>('removeExtensions');
  }

  private filterIgnoredExtensions(extensions: Array<string> | undefined): Array<string> {
    const ignoredExtensios = getConfigSetting().get<Array<string>>('ignoreExtensions') || [];
    return (extensions || []).filter(ext => !ignoredExtensios.includes(ext));
  }

  public async restore({ path, dryRun }: DataOptions): Promise<void> {
    const extensions = this.filterIgnoredExtensions(await readJsonContent<Array<string>>(this.getFilepath(path)));
    const installedExtensions = this.filterIgnoredExtensions(await this.getInstalledExtensions());

    const missingExtensions = extensions.filter(ext => !installedExtensions.includes(ext));
    const deletedExtensions = this.shouldRemoveExtensions
      ? installedExtensions.filter(ext => !extensions.includes(ext))
      : [];
    logger.info('extensions restore', missingExtensions, ' deleted:', deletedExtensions);
    if (!dryRun) {
      await Promise.all(missingExtensions.map(ext => this.installExtension(ext)));
      await Promise.all(deletedExtensions.map(ext => this.deleteExtension(ext)));
    }
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

export interface VSCodeExtensionsJSON {
  identifier: {
    id: string;
    uuid: string;
  };
  version: string;
}
