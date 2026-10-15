import { randomUUID } from 'node:crypto';
import type { Command } from 'commander';
import z from 'zod';
import { db } from '#backend/db/database';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { createMagicLink } from '#blib/magicLink';
import { logger } from '#shared/logger';
import { Role, RoleEnum, Roles } from '#shared/permissions';

const MagicLinkOptions = z
  .object({
    role: Role,
    leagueUuid: z.uuid().nullable().default(null),
    ttl: z.coerce.number().int().min(1).max(365), // days
  })
  .refine(
    (options) => options.role === RoleEnum.ADMIN || options.leagueUuid !== null,
    { message: 'Non-admin links require a league', path: ['leagueUuid'] },
  );
export type MagicLinkOptions = z.infer<typeof MagicLinkOptions>;

async function generateMagicLink(options: MagicLinkOptions) {
  if (options.leagueUuid !== null) {
    await LeagueModel.getByIdOrThrow(db, options.leagueUuid);
  }

  const link = await createMagicLink(
    {
      uuid: randomUUID(),

      origin: 'cli-magic-link',

      role: options.role,
      leagueUuid: options.leagueUuid,

      redirectTo: options.leagueUuid === null ? '/admin' : '/',
    },
    `${options.ttl} days`,
  );

  logger.info('Magic link generated, %s', link, {
    label: ['cli', 'magic-link'],
  });
}

export function registerMagicLinkCommand(program: Command): void {
  const magicLinkCmd = program
    .command('magic-link')
    .description('Generate a magic link (an admin link by default)')
    .option(
      '-r, --role <role>',
      `Role granted by the link (${Roles.join(', ')})`,
      RoleEnum.ADMIN,
    )
    .option('-l, --leagueUuid <uuid>', 'League UUID the link signs into')
    .option('-t, --ttl <days>', 'Days until the link expires', '1');

  magicLinkCmd.action(async (rawOptions: MagicLinkOptions) => {
    let failed = false;

    try {
      await generateMagicLink(MagicLinkOptions.parse(rawOptions));
    } catch (error) {
      failed = true;

      logger.error('Magic link generation failed', {
        label: ['cli', 'magic-link'],
        error,
      });
    }

    await db.$client.end();

    process.exit(failed ? 1 : 0);
  });
}

export default registerMagicLinkCommand;
