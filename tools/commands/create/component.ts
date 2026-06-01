import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Environment, FileSystemLoader } from 'nunjucks';
import { logger } from '#shared/logger';
import { projectRoot } from '#tools/cli-utils';
import type { CreateOptions } from '#tools/commands/create';

export function createComponent(name: string, options: CreateOptions) {
  const componentDir = resolve(projectRoot, 'frontend', 'components', name);
  const componentFile = join(componentDir, `${name}.tsx`);
  const styleFile = join(componentDir, `${name}.module.scss`);

  const templatesDir = resolve(
    projectRoot,
    'tools',
    'templates',
    'create',
    'component',
  );
  const componentTemplateFile = resolve(templatesDir, 'component.tsx.njk');
  const styleTemplateFile = resolve(templatesDir, 'component.module.scss.njk');

  if (options.dryRun) {
    logger.info('Dry run: would create directory %s', componentDir);

    logger.info('Dry run: would create file %s', componentFile);
    logger.info('From template %s', componentTemplateFile);

    logger.info('Dry run: would create file %s', styleFile);
    logger.info('From template %s', styleTemplateFile);

    return;
  }

  const env = new Environment(new FileSystemLoader(templatesDir));

  const componentContent = env.render('component.tsx.njk', { name });
  const styleContent = env.render('component.module.scss.njk', { name });

  try {
    logger.info('Creating directory %s', componentDir);
    mkdirSync(componentDir, { recursive: true });

    logger.debug('Creating file %s', componentFile);
    writeFileSync(componentFile, componentContent);

    logger.debug('Creating file %s', styleFile);
    writeFileSync(styleFile, styleContent);

    logger.info('Component %s created successfully!', name);
  } catch (err) {
    logger.error('Failed to create component %s', {
      error: err,
      label: ['cli', 'create', 'component'],
    });
  }
}
