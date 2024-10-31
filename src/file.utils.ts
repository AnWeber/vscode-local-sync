import * as vscode from 'vscode';
import { logger } from './initOutputChannel';

export async function readJsonContent<T>(path: vscode.Uri, defaultVal: T): Promise<T> {
  try {
    const stats = await vscode.workspace.fs.stat(path);
    if (stats.type === vscode.FileType.File) {
      const content = await vscode.workspace.fs.readFile(path);
      const text = Buffer.from(content).toString('utf-8');
      return JSON.parse(text) as T;
    }
  } catch (err) {
    logger.error('readJsonError', path, err);
  }
  return defaultVal;
}

export async function writeJsonContent(path: vscode.Uri, content: unknown): Promise<void> {
  try {
    await vscode.workspace.fs.writeFile(path, Buffer.from(JSON.stringify(content, undefined, 2)));
  } catch (err) {
    logger.error('writeJsonError', path, err);
  }
}
