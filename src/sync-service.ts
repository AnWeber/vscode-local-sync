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
    if (!this.backupPath) {
      return;
    }
    for (const provider of this.getDataProviders(options?.providerId)) {
      await provider.backup({
        path: this.backupPath,
        userFolder: this.#userFolder,
        dryRun: !!options?.dryRun,
      });
    }
  }

  private getDataProviders(providerId: string | undefined) {
    if (providerId) {
      return this.#dataProviders.filter(d => d.id === providerId);
    }
    return this.#dataProviders;
  }

  public async restore(options?: { providerId?: string; dryRun?: boolean }): Promise<void> {
    if (!this.backupPath) {
      return;
    }
    for (const provider of this.getDataProviders(options?.providerId)) {
      await provider.restore({
        path: this.backupPath,
        userFolder: this.#userFolder,
        dryRun: !!options?.dryRun,
      });
    }
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
}
