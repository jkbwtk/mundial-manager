import { type Column, Table } from '#components/Table';
import '#styles/TableTest.module.scss';
import { createSignal } from 'solid-js';

const TableTest: Component = () => {
  const columns: Column[] = [
    { key: 'person', header: 'Person' },
    {
      key: 'interest',
      header: 'Most interest in',
      sortable: true,
    },
    { key: 'age', header: 'Age', align: 'right', sortable: true, minWidth: 8 },
  ];

  const [data, setData] = createSignal([
    { person: 'Chris', interest: 'HTML tables', age: 22 },
    { person: 'Dennis', interest: 'Web accessibility', age: 45 },
    { person: 'Sarah', interest: 'JavaScript frameworks', age: 29 },
    { person: 'Karen', interest: 'Web performance', age: null },
  ]);

  const onSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setData((d) =>
      // @ts-expect-error
      d.toSorted((a, b) => {
        if (a[key] === null) {
          return 1;
        }
        if (b[key] === null) {
          return -1;
        }

        switch (direction) {
          case 'asc':
            return a[key] > b[key] ? 1 : -1;

          case 'desc':
            return a[key] < b[key] ? 1 : -1;

          default:
            return 0;
        }
      }),
    );
  };

  return <Table columns={columns} data={data()} sortBy="age" onSort={onSort} />;
};

export default TableTest;
