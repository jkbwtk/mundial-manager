import { ColorBlock } from '#components/ColorBlock';
import type { Table } from '#shared/types/api/table';

export interface TableLabelProps {
  table: Pick<Table, 'name' | 'side1Color' | 'side2Color'>;
}

export const TableLabel: Component<TableLabelProps> = (props) => (
  <>
    <ColorBlock color={props.table.side1Color} width={1} />
    <ColorBlock color={props.table.side2Color} width={1} /> {props.table.name}
  </>
);
