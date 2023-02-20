import minimist from 'minimist';
import { red, lightMagenta, lightBlue, lightYellow } from 'kolorist';
import path from 'node:path';
import prompts from 'prompts';
import fs from 'node:fs';


const cwd = process.cwd();
const args = minimist<{ template?: string; t?: string }>(
  process.argv.slice(2),
  {
    string: ['_'],
  }
  );
  
type ColorType = (color: string | number) => string;

type Option = {
  name: string;
  displayName: string;
  color: ColorType;
};

const projectTypes: Option[] = [
  {
    name: 'solid',
    displayName: 'Javascript',
    color: lightYellow,
  },
  {
    name: 'solid-ts',
    displayName: 'Typescript',
    color: lightBlue,
  },
];

const templates = projectTypes.map((option: Option) => {
  return option.name;
});

const defaultProjectDir = 'solid-js-app';

async function run() {
  const argProjectDir = args._[0];
  const argTemplate = args.template;

  let projectDir = argProjectDir || defaultProjectDir;
  const getProjectName = () =>
    projectDir === '.' ? path.basename(path.resolve()) : projectDir;

  let cli: prompts.Answers<'projectName' | 'projectType'>;

  try {
    cli = await prompts(
      [
        {
          type: argProjectDir ? null : 'text',
          name: 'projectName',
          message: lightMagenta('Name Of Project: '),
          initial: defaultProjectDir,
          onState: (state) => {
            projectDir = state.value || defaultProjectDir;
          },
        },
        {
          type:
            argTemplate && templates.includes(argTemplate) ? null : 'select',
          name: 'projectType',
          message:
            typeof argTemplate === 'string' && !templates.includes(argTemplate)
              ? lightMagenta(
                  `The Template Chosen (${argTemplate}) Is Not Valid, Please Choose From The List Below`
                )
              : lightMagenta('Select a Type'),
          initial: 0,
          choices: projectTypes.map((type) => {
            const color = type.color;
            return {
              title: color(type.displayName || type.name),
              value: type,
            };
          }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('CANCELED BY DEVELOPER !'));
        },
      }
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  const { projectType } = cli;

  const root = path.join(cwd, projectDir);
  const template = projectType ? projectType.name : argTemplate;
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm';

  fs.mkdirSync(root, { recursive: true });

  console.log(`\nCreating New Project In ${root}`);

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

  console.log(`\nProject Created`);
  console.log(`\nRun The Commands Below To Start, Happy Coding !!\n`);
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`);
  }
  console.log(`  ${pkgManager} install`);
  console.log(`  ${pkgManager} run dev`);
}

try {
  run();
} catch (error) {
  console.log(red('Error Occurred'));
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
