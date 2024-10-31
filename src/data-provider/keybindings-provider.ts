import * as vscode from 'vscode';
import { DataOptions, DataProvider } from './data-provider';
import { logger } from '../initOutputChannel';

export class KeybindingsProvider implements DataProvider {
  readonly id = 'keybindings';
  public async backup({ path, userFolder }: DataOptions): Promise<void> {
    const source = this.getFilepath(userFolder);
    const target = this.getFilepath(path);

    try {
      await vscode.workspace.fs.copy(source, target, {
        overwrite: true,
      });
      logger.info('keybindings backup');
    } catch (err) {
      logger.error('keybindings backup failed', err);
    }
  }

  private getFilepath(path: vscode.Uri) {
    return vscode.Uri.joinPath(path, 'keybindings.json');
  }

  public async restore({ path, userFolder }: DataOptions): Promise<void> {
    const source = this.getFilepath(path);
    const target = this.getFilepath(userFolder);

    try {
      await vscode.workspace.fs.copy(source, target, {
        overwrite: true,
      });
      logger.info('keybindings restored');
    } catch (err) {
      logger.error('keybindings restore failed', err);
    }
  }
}
