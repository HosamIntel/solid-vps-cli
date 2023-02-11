import minimist from 'minimist';
import { blue, red, reset, yellow } from 'kolorist';
import path from 'node:path';
import prompts from 'prompts';

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
  const argProjectDir = argv._[0];
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
            projectDir = state.value || defaultProjectDir;
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
  console.log(root, option?.name || argTemplate);
  
}

try {
  run();
} catch (error) {
  console.log('error Occurred');
}
