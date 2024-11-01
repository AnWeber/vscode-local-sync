import { Uri } from 'vscode';

export type DataOptions = {
  path: Uri;
  userFolder: Uri;
  dryRun: boolean;
};

export interface DataProvider {
  readonly id: string;
  backup(options: DataOptions): Promise<void>;

  restore(options: DataOptions): Promise<void>;
}
