import minimist from 'minimist';
import {
  blue,
  cyan,
  yellow,
  bgYellow
} from 'kolorist';

const cwd = process.cwd();

const argv = minimist<{
  typescript?: string;
  telefunc?: string;
  tailwind?: string;
}>(process.argv.slice(2), { string: ['_'] });

type ColorFunc = (str: string | number) => string;
type Template = {
  name: string;
  display: string;
  color: ColorFunc;
};

type Options = {
  name: string;
  display: string;
  color: ColorFunc;
};

const templates: Template[] = [
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

const options: Options[] = [
  {
    name: 'telefunc',
    display: 'Telefunc',
    color: bgYellow
  },
  {
    name: 'tailwind',
    display: 'Tailwind.Css',
    color: cyan
  },
] 

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
};

const defaultTargetDir = 'solid-js-app';
