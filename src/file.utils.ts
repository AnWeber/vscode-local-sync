import * as vscode from 'vscode';
import { parse, stringify } from 'comment-json';

import { logger } from './initOutputChannel';

export async function readJsonContent<T>(path: vscode.Uri): Promise<T | undefined> {
  try {
    const stats = await vscode.workspace.fs.stat(path);
    if (stats.type === vscode.FileType.File) {
      const content = await vscode.workspace.fs.readFile(path);
      const text = Buffer.from(content).toString('utf-8');
      const result = parse(text) as T;
      return result;
    }
  } catch (err) {
    logger.error('readJsonError', path, err);
  }
  return undefined;
}

export async function writeJsonContent(path: vscode.Uri, content: unknown): Promise<void> {
  try {
    await vscode.workspace.fs.writeFile(path, Buffer.from(stringify(content, undefined, 2)));
  } catch (err) {
    logger.error('writeJsonError', path, err);
  }
}
