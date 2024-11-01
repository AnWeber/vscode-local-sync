import * as vscode from 'vscode';
import { DataOptions, DataProvider } from './data-provider';
import { logger } from '../initOutputChannel';

export class KeybindingsProvider implements DataProvider {
  readonly id = 'keybindings';
  public async backup({ path, userFolder, dryRun }: DataOptions): Promise<void> {
    const source = this.getFilepath(userFolder);
    const target = this.getFilepath(path);

    logger.info('keybindings backup', source.fsPath);
    if (!dryRun) {
      try {
        await vscode.workspace.fs.copy(source, target, {
          overwrite: true,
        });
      } catch (err) {
        logger.error('keybindings backup failed', err);
      }
    }
  }

  private getFilepath(path: vscode.Uri) {
    return vscode.Uri.joinPath(path, 'keybindings.json');
  }

  public async restore({ path, userFolder, dryRun }: DataOptions): Promise<void> {
    const source = this.getFilepath(path);
    const target = this.getFilepath(userFolder);

    logger.info('keybindings restored', source.fsPath);
    if (!dryRun) {
      try {
        await vscode.workspace.fs.copy(source, target, {
          overwrite: true,
        });
      } catch (err) {
        logger.error('keybindings restore failed', err);
      }
    }
  }
}
