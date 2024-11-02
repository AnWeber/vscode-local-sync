import * as vscode from 'vscode';
import * as provider from './data-provider';
import { logger } from './initOutputChannel';

export class SyncService {
  #extensionFolder: vscode.Uri;
  #userFolder: vscode.Uri;
  #dataProviders: Array<provider.DataProvider>;

  constructor(context: vscode.ExtensionContext) {
    this.#extensionFolder = vscode.Uri.joinPath(context.extensionUri, '..', 'extensions.json');
    this.#userFolder = this.getUserfolder(context);
    this.#dataProviders = [
      new provider.SettingsProvider(),
      new provider.KeybindingsProvider(),
      new provider.SnippetsProvider(),
      new provider.ExtensionProvider(this.#extensionFolder),
    ];
  }

  public backupPath: vscode.Uri | undefined;

  public async backup(options?: { providerId?: string; dryRun?: boolean }): Promise<void> {
    await this.runWithLock(async path => {
      for (const provider of this.getDataProviders(options?.providerId)) {
        await provider.backup({
          path,
          userFolder: this.#userFolder,
          dryRun: !!options?.dryRun,
        });
      }
    });
  }

  private getDataProviders(providerId: string | undefined) {
    if (providerId) {
      return this.#dataProviders.filter(d => d.id === providerId);
    }
    return this.#dataProviders;
  }

  public async restore(options?: { providerId?: string; dryRun?: boolean }): Promise<void> {
    await this.runWithLock(async path => {
      if (!this.backupPath) {
        return;
      }
      for (const provider of this.getDataProviders(options?.providerId)) {
        await provider.restore({
          path,
          userFolder: this.#userFolder,
          dryRun: !!options?.dryRun,
        });
      }
    });
  }

  private getUserfolder(context: vscode.ExtensionContext): vscode.Uri {
    if (process.env.VSCODE_PORTABLE) {
      const path = vscode.Uri.file(process.env.VSCODE_PORTABLE);
      return vscode.Uri.joinPath(path, 'user-data', 'User');
    } else {
      const path = vscode.Uri.joinPath(context.globalStorageUri, '..', '..', '..');
      return vscode.Uri.joinPath(path, 'User');
    }
  }

  public watchForChanges(): Array<vscode.Disposable> {
    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(this.#userFolder, '{*.json,snippets/*.{json,code-snippets}'),
      false,
      false,
      true
    );

    return [
      vscode.extensions.onDidChange(async () => {
        if (vscode.window.state.focused && this.backupPath) {
          logger.info('Extensions changed');
          await this.backup({
            providerId: provider.ExtensionProviderId,
          });
        }
      }),
      fileSystemWatcher.onDidCreate(() => this.backup()),
      fileSystemWatcher.onDidChange(() => this.backup()),
      fileSystemWatcher,
    ];
  }

  private async runWithLock(action: (path: vscode.Uri) => Promise<void>) {
    if (!this.backupPath) {
      return;
    }
    const lockUri = vscode.Uri.joinPath(this.backupPath, '.lock');
    try {
      await vscode.workspace.fs.stat(lockUri);
      logger.warn('lock file exists');
      return;
    } catch {
      try {
        await vscode.workspace.fs.writeFile(lockUri, new Uint8Array());
      } catch (err) {
        logger.warn('lock file was not created', err);
        return;
      }
    }
    await action(this.backupPath);
    try {
      await vscode.workspace.fs.delete(lockUri);
      return;
    } catch (err) {
      logger.error('lock file not deleted', err);
    }
  }
}
