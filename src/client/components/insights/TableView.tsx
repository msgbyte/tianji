import React from 'react';
import { createColumnHelper, DataTable } from '../DataTable';
import { MetricsInfo } from '@/store/insights';
import { get, groupBy, mapValues, reverse, sum } from 'lodash-es';
import { useTranslation } from '@i18next-toolkit/react';
import dayjs from 'dayjs';
import { DateUnit } from '@tianji/shared';
import { formatNumber } from '@/utils/common';

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

  const dates = props.data.map((d) => d.date);

  const columns = [
    columnHelper.accessor('name', {
      header: t('Event'),
      size: 150,
    }),
    columnHelper.display({
      header: t('Average'),
      size: 150,
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

            return dayjs(id).format('MMM D');
          },
          minSize: 110,
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

  return <DataTable columns={columns} data={data} />;
});
TableView.displayName = 'TableView';
