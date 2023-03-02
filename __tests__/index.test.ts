import { expect, test } from 'vitest';
import { mkdirpSync } from 'fs-extra';
import { join } from 'node:path';
import fs from 'node:fs';
import { isEmpty } from '../src';

const cwd = process.cwd();
const defaultDir = 'text-app';

test('Create Project Dir', () => {
  const res = createProjectDir();
  expect(res).toBe('created');
});

function createProjectDir(path?: string) {
  const projectDir = path || defaultDir;
  const isDirEmptyOrExists = !fs.existsSync(projectDir) || isEmpty(projectDir);
  try {
    if (isDirEmptyOrExists) {
      mkdirpSync(join(cwd, projectDir));
    }
    return 'created';
  } catch (err) {
    if (!isDirEmptyOrExists) {
      return 'already exists';
    } else {
      return 'something went wrong';
    }
  }
}
