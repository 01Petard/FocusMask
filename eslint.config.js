import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
export default [
  { ignores: ['dist/**', 'release/**', 'output/**', 'node_modules/**'] },
  js.configs.recommended, ...ts.configs.recommended, ...vue.configs['flat/recommended'],
  { files: ['**/*.{ts,js,mjs,vue}'], languageOptions: { globals: { ...globals.browser, ...globals.node, chrome: 'readonly' } } },
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: ts.parser } }, rules: { 'vue/multi-word-component-names': 'off', 'vue/max-attributes-per-line': 'off', 'vue/html-self-closing': 'off', 'vue/singleline-html-element-content-newline': 'off', 'vue/html-indent': 'off' } }
];
