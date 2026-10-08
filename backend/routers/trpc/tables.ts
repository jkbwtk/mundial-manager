import { TableModel } from '#backend/db/models/TableModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { PermissionEnum } from '#shared/permissions';
import {
  Table,
  TableCreate,
  TableQueryMeta,
  TableUpdate,
} from '#shared/types/api/table';

export const tablesRouter = router({
  ...createCrudOps({
    publicSchema: Table,
    createSchema: TableCreate,
    updateSchema: TableUpdate,
    model: TableModel,
    queryMetaSchema: TableQueryMeta,
    permissions: {
      read: PermissionEnum.TABLES_READ,
      create: PermissionEnum.TABLES_CREATE,
      update: PermissionEnum.TABLES_UPDATE,
      delete: PermissionEnum.TABLES_DELETE,
    },
  }),
});
