export default {
  // Type check TypeScript files
  '**/*.(ts|mts)': () => 'pnpm typecheck',

  // Lint & Prettify TS and JS files
  '**/*.(ts|js|mjs|mts)': () => [`pnpm lint`, `pnpm format`],

  // Prettify only Markdown and JSON files
  '**/*.(md|json)': () => `pnpm format`,
};
