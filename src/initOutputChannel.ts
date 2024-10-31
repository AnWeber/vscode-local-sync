import * as vscode from 'vscode';

export function initOutputChannel() {
  logger = vscode.window.createOutputChannel('local-sync', { log: true });
  return logger;
}

export let logger: vscode.LogOutputChannel;
