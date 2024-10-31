import * as vscode from 'vscode';
import { initOutputChannel } from './initOutputChannel';
import { SyncService } from './sync-service';
import { watchConfigSettings } from './config';

export function activate(context: vscode.ExtensionContext): void {
  const syncService = new SyncService(context);
  let isRestored = false;
  context.subscriptions.push(
    ...[
      initOutputChannel(),
      vscode.commands.registerCommand('local-sync.backup', async () => {
        await syncService.backup();
      }),
      vscode.commands.registerCommand('local-sync.restore', async () => {
        await syncService.restore();
      }),

      watchConfigSettings(config => {
        const backupPath = config.get<string>('backupPath');
        if (backupPath) {
          syncService.backupPath = vscode.Uri.file(backupPath);
        }
        const result: Array<vscode.Disposable> = [];
        if (config.get('autobackup')) {
          result.push(...syncService.watchForChanges());
        }
        if (config.get('autorestore') && !isRestored) {
          isRestored = true;
          void syncService.restore();
        }
        return result;
      }),
    ]
  );
}
