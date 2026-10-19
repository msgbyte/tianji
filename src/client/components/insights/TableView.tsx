import React from 'react';
import { createColumnHelper, DataTable } from '../DataTable';
import { get, reverse, sum } from 'lodash-es';
import { useTranslation } from '@i18next-toolkit/react';
import { DateUnit, GroupInfo, MetricsInfo } from '@tianji/shared';
import { formatNumber } from '@/utils/common';
import { getShortTextByUnit } from '@/utils/date';
import { Button } from '@/components/ui/button';
import { downloadCSVJson } from '@/utils/dom';

const columnHelper = createColumnHelper<any>();

interface TableViewProps {
  metrics: MetricsInfo[];
  groups: GroupInfo[];
  data: {
    [groupName: string]: any;
    name: string;
    data: {
      date: string;
      value: number;
    }[];
  }[];
  dateUnit: DateUnit;
}
export const TableView: React.FC<TableViewProps> = React.memo((props) => {
  const { t } = useTranslation();

  const dateUnit = props.dateUnit;
  const dates = props.data[0].data.map((item) => item.date);
  const groupLabels = props.groups.map((group) =>
    group.source === 'builtin'
      ? t('{{name}} (Built-in)', { name: group.value })
      : group.value
  );

  const columns = [
    columnHelper.display({
      id: 'name',
      header: t('Event'),
      size: 150,
      cell(props) {
        return props.row.original.alias ?? props.row.original.name;
      },
    }),
    ...props.groups.map((g, index) => {
      return columnHelper.accessor((row) => row[groupLabels[index]], {
        id: `group_${index}`,
        header: groupLabels[index],
        size: 110,
        meta: {
          className: 'text-right',
        },
        cell(props) {
          return props.cell.getValue();
        },
      });
    }),
    columnHelper.display({
      id: 'average',
      header: t('Average'),
      size: 110,
      meta: {
        className: 'text-right',
      },
      cell(props) {
        const values = dates.map((d) => Number(props.row.getValue(d)) || 0);

        return formatNumber(sum(values) / values.length);
      },
    }),
    ...reverse([...dates]).map((item) => {
      return columnHelper.accessor(item, {
        header(props) {
          const id = props.column.id;

          return getShortTextByUnit(id, dateUnit);
        },
        size: 110,
        meta: {
          className: 'text-right',
        },
        cell(props) {
          return formatNumber(props.cell.getValue());
        },
      });
    }),
  ];

  const tableData = props.data.map((item) => {
    const { name, alias, data } = item;

    return {
      name,
      ...(alias ? { alias } : {}),
      ...Object.fromEntries(
        props.groups.map((group, index) => [
          groupLabels[index],
          item.groupValues ? item.groupValues[index] : get(item, group.value),
        ])
      ),
      ...data.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.date]: curr.value,
        };
      }, {}),
    };
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end px-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadCSVJson(tableData, 'insights-table')}
        >
          {t('Download CSV')}
        </Button>
      </div>
      <DataTable
        columnPinning={{
          left: [
            'name',
            ...props.groups.map((_, index) => `group_${index}`),
            'average',
          ],
        }}
        columns={columns}
        data={tableData}
      />
    </div>
  );
});
TableView.displayName = 'TableView';
