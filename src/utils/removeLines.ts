import fs from 'node:fs';
import path from 'node:path';

export default function removeLines(file: string, lines: number[] = []) {
  const cwd = process.cwd();
  const filePath = path.join(cwd, file);
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) throw err;
    fs.writeFile(
      filePath,
      data
        .split('\n')
        .filter((_: any, i: number) => lines.indexOf(i) === -1)
        .join('\n'),
      'utf8',
      (err) => {
        if (err) throw err;
      }
    );
  });
}
