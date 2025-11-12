import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

declare global {
  namespace NodeJS {
    interface Process {
      pkg?: {
        entrypoint: string;
        defaultEntrypoint: string;
      };
    }
  }
}


export function getSqlitePath() {
  const dbName = 'sistema_pos.sqlite';

  const isPkg = typeof process.pkg !== 'undefined';

  const baseDir = isPkg
    ? path.join(os.homedir(), '.sistema_pos') 
    : process.cwd();

  const dbPath = path.join(baseDir, dbName);

  if (isPkg && !fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  return dbPath;
}

