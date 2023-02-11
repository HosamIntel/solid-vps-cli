import minimist from 'minimist';
import { blue, red, reset, yellow } from 'kolorist';
import path from 'node:path';
import prompts from 'prompts';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const cwd = process.cwd();

const argv = minimist<{ template?: string; t?: string }>(
  process.argv.slice(2),
  {
    string: ['_'],
  }
);

type ColorFunc = (str: string | number) => string;

type Option = {
  name: string;
  display: string;
  color: ColorFunc;
};

const options: Option[] = [
  {
    name: 'solid',
    display: 'Javascript',
    color: yellow,
  },
  {
    name: 'solid-ts',
    display: 'Typescript',
    color: blue,
  },
];

const templates = options.map((option: Option) => {
  return option.name;
});

const defaultProjectDir = 'solid-js-app';

async function run() {
  const argProjectDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template;

  let projectDir = argProjectDir || defaultProjectDir;
  const getProjectName = () =>
    projectDir === '.' ? path.basename(path.resolve()) : projectDir;

  let result: prompts.Answers<'projectName' | 'option'>;

  try {
    result = await prompts(
      [
        {
          type: argProjectDir ? null : 'text',
          name: 'projectName',
          message: reset('Project name:'),
          initial: defaultProjectDir,
          onState: (state) => {
            projectDir = formatTargetDir(state.value) || defaultProjectDir;
          },
        },
        {
          type:
            argTemplate && templates.includes(argTemplate) ? null : 'select',
          name: 'option',
          message:
            typeof argTemplate === 'string' && !templates.includes(argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `
                )
              : reset('Select an Option'),
          initial: 0,
          choices: options.map((option) => {
            const frameworkColor = option.color;
            return {
              title: frameworkColor(option.display || option.name),
              value: option,
            };
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled');
        },
      }
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  const { option } = result;

  const root = path.join(cwd, projectDir);
  const template = option ? option.name : argTemplate;
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  fs.mkdirSync(root, { recursive: true });

  console.log(`\nScaffolding project in ${root}`);

  const localTemplateDir = path.join(cwd, `${template}-template`);

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(localTemplateDir, file), targetPath);
    }
  };

  const pkg = JSON.parse(
    fs.readFileSync(path.join(localTemplateDir, `package.json`), 'utf-8')
  );

  pkg.name == getProjectName();

  write('package.json', JSON.stringify(pkg, null, 2));

  const files = fs.readdirSync(localTemplateDir);
  files
    .filter((f) => f !== 'package.json')
    .forEach((file) => {
      write(file);
    });

  console.log(`\nDone. Now run:\n`);
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn');
      console.log('  yarn dev');
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run dev`);
      break;
  }
  console.log();
}

try {
  run();
} catch (error) {
  console.log('error Occurred');
}

function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, '');
}

function copyDir(srcDir: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file);
    const destFile = path.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}

function copy(src: string, dest: string) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs.copyFileSync(src, dest);
  }
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}
