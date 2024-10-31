import * as vscode from 'vscode';

export function getConfigSetting(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration('local-sync');
}

export function watchConfigSettings(
  watcher: (appConfig: vscode.WorkspaceConfiguration) => vscode.Disposable | Array<vscode.Disposable>
): vscode.Disposable {
  const disposables: Array<vscode.Disposable> = [];

  const disposeAllDisposables = () => {
    for (const d of disposables) {
      d.dispose();
    }
  };

  const callWatcher = () => {
    if (disposables.length > 0) {
      disposeAllDisposables();
    }
    const result = watcher(getConfigSetting());
    if (Array.isArray(result)) {
      disposables.push(...result);
    } else {
      disposables.push(result);
    }
  };

  callWatcher();
  const dispose = vscode.workspace.onDidChangeConfiguration(changeEvent => {
    if (changeEvent.affectsConfiguration('local-sync')) {
      callWatcher();
    }
  });

  return {
    dispose() {
      dispose.dispose();
      disposeAllDisposables();
    },
  };
}
