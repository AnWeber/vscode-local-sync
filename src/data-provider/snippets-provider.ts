import * as vscode from 'vscode';
import { DataOptions, DataProvider } from './data-provider';
import { logger } from '../initOutputChannel';

export class SnippetsProvider implements DataProvider {
  readonly id = 'snippets';
  public async backup({ path, userFolder }: DataOptions): Promise<void> {
    const source = this.getFilepath(userFolder);
    const target = this.getFilepath(path);

    try {
      await vscode.workspace.fs.copy(source, target, {
        overwrite: true,
      });
      logger.info('snippets backup');
    } catch (err) {
      logger.error('snippets backup failed', err);
    }
  }

  private getFilepath(path: vscode.Uri) {
    return vscode.Uri.joinPath(path, 'snippets');
  }

  public async restore({ path, userFolder }: DataOptions): Promise<void> {
    const source = this.getFilepath(path);
    const target = this.getFilepath(userFolder);

    logger.info('snippets restore');
    try {
      await vscode.workspace.fs.copy(source, target, {
        overwrite: true,
      });
      logger.info('snippets restored');
    } catch (err) {
      logger.error('snippets restore failed', err);
    }
  }
}
