import antfu from '@antfu/eslint-config';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';

const customGroups
  = [
    { elementNamePattern: '^key$', groupName: 'key' },
    { elementNamePattern: '^id$', groupName: 'id' },
    { elementNamePattern: '^.+Id$', groupName: 'related-id' },
    { elementNamePattern: '^path$', groupName: 'path' },
    { elementNamePattern: '^index$', groupName: 'index' },
    { elementNamePattern: '^element$', groupName: 'element' },
    { elementNamePattern: '^created(?:At|By)$', groupName: 'created-audit' },
    { elementNamePattern: '^updated(?:At|By)$', groupName: 'updated-audit' },
    { elementNamePattern: '^deleted(?:At|By)$', groupName: 'deleted-audit' },
    { elementNamePattern: '^.+(?:At|By)$', groupName: 'audit' },
  ];
const groups = ['key', 'id', 'related-id', 'path', 'index', 'element', 'unknown', 'audit', 'created-audit', 'updated-audit', 'deleted-audit'];

export default antfu(
  {
    react: true,
    stylistic: {
      commaDangle: 'only-multiline',
      indent: 2,
      quotes: 'single',
      semi: true,
      severity: 'warn',
    },
    typescript: true,
  },
  {
    name: 'unicorn/recommended',
    rules: eslintPluginUnicorn.configs.recommended.rules,
  },
  {
    name: 'better-tailwindcss/recommended',
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs.recommended.rules,
      'better-tailwindcss/enforce-canonical-classes': 'off',
    },
    settings: {
      'better-tailwindcss': {
        group: 'newLine',
        lineBreakStyle: 'windows',
        printWidth: 1000,
        tailwindConfig: 'tailwind.config.ts',
      },
    },
  },
  {
    rules: {
      'perfectionist/sort-interfaces': [
        'error',
        {
          customGroups,
          groups,
          partitionByComment: true,
        },
        {
          type: 'natural',
        },
      ],
      'perfectionist/sort-jsx-props': [
        'warn',
        {
          customGroups: [
            {
              elementNamePattern: '^key$',
              groupName: 'key-prop',
            },
            {
              elementNamePattern: '^id$',
              groupName: 'id-prop',
            },
            {
              elementNamePattern: '^.+Id$',
              groupName: 'related-id-prop',
            },
            {
              elementNamePattern: '^name$',
              groupName: 'name-prop',
            },
            {
              elementNamePattern: '^control$',
              groupName: 'control-prop',
            },
            {
              elementNamePattern: '^src$',
              groupName: 'src-prop',
            },
            {
              elementNamePattern: '^on.+$',
              groupName: 'event-prop',
            },
            {
              elementNamePattern: '^ref$',
              groupName: 'ref-prop',
            },
            {
              elementNamePattern: '^inputRef$',
              groupName: 'input-ref-prop',
            },
            {
              elementNamePattern: ['^value$', '^defaultValue$'],
              groupName: 'value-prop',
            },
            {
              elementNamePattern: '^className$',
              groupName: 'className-prop',
            },
          ],
          groups: [
            'key-prop',
            'id-prop',
            'related-id-prop',
            'name-prop',
            'control-prop',
            'src-prop',
            'event-prop',
            'ref-prop',
            'input-ref-prop',
            'value-prop',
            'unknown',
            'className-prop',
          ],
        },
        {
          type: 'natural',
        },
      ],
      'perfectionist/sort-object-types': [
        'warn',
        {
          customGroups,
          groups,
          partitionByComment: true,
        },
        {
          type: 'natural',
        },
      ],
      'perfectionist/sort-objects': [
        'warn',
        {
          customGroups,
          groups,
          partitionByComment: true,
        },
        {
          type: 'natural',
        },
      ],
      'perfectionist/sort-union-types': [
        'warn',
        {
          groups: ['unknown', 'nullish'],
          order: 'asc',
          type: 'natural',
        },
      ],
      'react-naming-convention/ref-name': 'off',
      'react-refresh/only-export-components': 'off',
      'unicorn/expiring-todo-comments': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/logical-assignment-operators': 'off',
      'unicorn/name-replacements': [
        'error',
        {
          allowList: {
            env: true,
            params: true,
            Params: true,
            props: true,
            Props: true,
          },
        },
      ],
      'unicorn/no-null': 'off',
    },
    settings: {
      tailwindcss: {
        callees: ['cva', 'cn'],
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'better-tailwindcss/no-unknown-classes': 'off',
      'react-refresh/only-export-components': 'off',
      'react/naming-convention-ref-name': 'off',
      'react/set-state-in-effect': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/expiring-todo-comments': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/name-replacements': [
        'error',
      ],
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
      'unicorn/no-declarations-before-early-exit': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-null': 'off',
    },
  },
);
