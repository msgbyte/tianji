import React from 'react';
import { createColumnHelper, DataTable } from '../DataTable';
import { get, groupBy, mapValues, reverse, sum } from 'lodash-es';
import { useTranslation } from '@i18next-toolkit/react';
import { DateUnit, MetricsInfo } from '@tianji/shared';
import { formatNumber } from '@/utils/common';
import { getShortTextByUnit } from '@/utils/date';

const columnHelper = createColumnHelper<any>();

interface TableViewProps {
  metrics: MetricsInfo[];
  data: {
    date: string;
  }[];
  dateUnit: DateUnit;
}
export const TableView: React.FC<TableViewProps> = React.memo((props) => {
  const { t } = useTranslation();

  const dateUnit = props.dateUnit;
  const dates = props.data.map((d) => d.date);

  const columns = [
    columnHelper.accessor('name', {
      header: t('Event'),
      size: 150,
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
    ...reverse([...props.data])
      .map((item) => item.date)
      .map((item) => {
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

  const dataMap = groupBy(props.data, 'date');
  const data = props.metrics.map((m, i) => {
    return {
      name: m.name,
      ...mapValues(dataMap, (item) => {
        return get(item, [0, m.name]);
      }),
    };
  });

  return (
    <DataTable
      columnPinning={{ left: ['name', 'average'] }}
      columns={columns}
      data={data}
    />
  );
});
TableView.displayName = 'TableView';
