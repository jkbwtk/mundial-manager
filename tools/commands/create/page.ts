import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Environment, FileSystemLoader } from 'nunjucks';
import { logger } from '#shared/logger';
import { projectRoot } from '#tools/cli-utils';
import type { CreateOptions } from '#tools/commands/create';

export function createPage(name: string, options: CreateOptions) {
  const pageDir = resolve(projectRoot, 'frontend', 'pages', name);
  const pageFile = join(pageDir, `${name}.tsx`);
  const styleFile = join(pageDir, `${name}.module.scss`);

  const templatesDir = resolve(
    projectRoot,
    'tools',
    'templates',
    'create',
    'page',
  );
  const pageTemplateFile = resolve(templatesDir, 'page.tsx.njk');
  const styleTemplateFile = resolve(templatesDir, 'page.module.scss.njk');

  if (options.dryRun) {
    logger.info('Dry run: would create directory %s', pageDir);

    logger.info('Dry run: would create file %s', pageFile);
    logger.info('From template %s', pageTemplateFile);

    logger.info('Dry run: would create file %s', styleFile);
    logger.info('From template %s', styleTemplateFile);

    return;
  }

  const env = new Environment(new FileSystemLoader(templatesDir));

  const page = env.render('page.tsx.njk', { name });
  const styleContent = env.render('page.module.scss.njk', { name });

  const importString = `const ${name} = lazy(() => import('#pages/${name}/${name}'));`;

  try {
    logger.info('Creating directory %s', pageDir);
    mkdirSync(pageDir, { recursive: true });

    logger.debug('Creating file %s', pageFile);
    writeFileSync(pageFile, page);

    logger.debug('Creating file %s', styleFile);
    writeFileSync(styleFile, styleContent);

    logger.info('Page %s created successfully!', name);

    logger.info(
      'Add the following import to %s, and declare the route\n%s',
      resolve(projectRoot, 'frontend', 'routes.tsx'),
      importString,
    );
  } catch (err) {
    logger.error('Failed to create page %s', {
      error: err,
      label: ['cli', 'create', 'page'],
    });
  }
}
