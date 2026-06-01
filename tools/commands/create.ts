import { Argument, type Command } from 'commander';
import z from 'zod';
import { logger } from '#shared/logger';
import { createComponent } from '#tools/commands/create/component';
import { createPage } from '#tools/commands/create/page';

const ElementTypes = ['component', 'page'] as const; // 'provider', 'page', 'testPage'];

const ElementType = z.enum(ElementTypes);

const CreateOptionsSchema = z.object({
  dryRun: z.boolean().default(false),
});

export type CreateOptions = z.infer<typeof CreateOptionsSchema>;

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
      case 'page':
        createPage(name, validatedOptions);
        break;
      default:
        logger.error('Unsupported element type: %s', elementType);
    }
  });
}

export default registerCreateCommand;
