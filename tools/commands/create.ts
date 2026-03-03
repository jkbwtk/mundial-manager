import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Argument, type Command } from 'commander';
import { Environment, FileSystemLoader } from 'nunjucks';
import z from 'zod';
import { logger } from '#shared/logger';
import { projectRoot } from '#tools/cli-utils';

const ElementTypes = ['component'] as const; // 'provider', 'page', 'testPage'];

const ElementType = z.enum(ElementTypes);

const CreateOptionsSchema = z.object({
  dryRun: z.boolean().default(false),
});

type CreateOptions = z.infer<typeof CreateOptionsSchema>;

function createComponent(name: string, options: CreateOptions) {
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

export function registerCreateCommand(program: Command) {
  const elementTypeArgument = new Argument(
    '<element type>',
    'Type of element to create',
  ).choices(ElementTypes);

  const nameArgument = new Argument('<name>', 'Name of the element to create');

  const createCmd = program
    .command('create')
    .description('Create a new element')
    .addArgument(elementTypeArgument)
    .addArgument(nameArgument)
    .option(
      '-d, --dry-run',
      'Show what would be done without making changes',
      false,
    );

  createCmd.action((type: string, name: string, options: CreateOptions) => {
    const elementType = ElementType.parse(type);
    const validatedOptions = CreateOptionsSchema.parse(options);

    logger.info('Creating a new %s named %s', elementType, name);

    switch (elementType) {
      case 'component':
        createComponent(name, validatedOptions);
        break;
      default:
        logger.error('Unsupported element type: %s', elementType);
    }
  });
}

export default registerCreateCommand;
