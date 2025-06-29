import React from 'react';
import { SortableItem } from '@/components/Sortable/types';
import { SortableGroup } from '@/components/Sortable/SortableGroup';
import { z } from 'zod';
import { useEvent } from '@/hooks/useEvent';
import { v1 as uuid } from 'uuid';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCircleMinus, LuCirclePlus, LuTrash } from 'react-icons/lu';
import { cn } from '@/utils/style';
import { Separator } from '@/components/ui/separator';
import { MonitorPicker } from '../MonitorPicker';
import { Switch } from '@/components/ui/switch';
import { set } from 'lodash-es';
import { EditableText } from '@/components/EditableText';
import { groupItemSchema, leafItemSchema } from './schema';

type GroupItemProps = Omit<z.infer<typeof groupItemSchema>, 'key' | 'children'>;
type LeafItemProps = Omit<z.infer<typeof leafItemSchema>, 'key'>;

export type MonitorStatusPageServiceItem = SortableItem<
  GroupItemProps,
  LeafItemProps
>;

interface MonitorStatusPageServiceListProps {
  value: MonitorStatusPageServiceItem[];
  onChange: (list: MonitorStatusPageServiceItem[]) => void;
}
export const MonitorStatusPageServiceList: React.FC<MonitorStatusPageServiceListProps> =
  React.memo((props) => {
    const { t } = useTranslation();
    const handleAddGroup = useEvent(() => {
      props.onChange([
        ...props.value,
        {
          key: uuid(),
          title: 'Default',
          children: [],
        },
      ]);
    });

    const handleAddItem = useEvent((groupKey: string) => {
      const index = props.value.findIndex((item) => item.key === groupKey);
      if (index === -1) {
        return;
      }

      const newList = [...props.value];

      if (!('children' in newList[index])) {
        return;
      }

      newList[index].children = [
        ...newList[index].children,
        {
          key: uuid(),
          id: '',
          type: 'monitor',
          showCurrent: false,
          showDetail: true,
        },
      ] as MonitorStatusPageServiceItem[];

      props.onChange(newList);
    });

    const handleDeleteGroup = useEvent((groupKey: string) => {
      const index = props.value.findIndex((item) => item.key === groupKey);
      if (index === -1) {
        return;
      }

      const newList = [...props.value];

      newList.splice(index, 1);

      props.onChange(newList);
    });

    const handleChangeGroupTitle = useEvent(
      (groupKey: string, title: string) => {
        const index = props.value.findIndex((item) => item.key === groupKey);
        if (index === -1) {
          return;
        }

        const newList = [...props.value];
        if (!('children' in newList[index])) {
          return;
        }

        newList[index].title = title;

        props.onChange(newList);
      }
    );

    const handleDeleteItem = useEvent((groupKey: string, itemKey: string) => {
      const newList = [...props.value];
      const groupIndex = newList.findIndex((item) => item.key === groupKey);
      if (groupIndex === -1) {
        return;
      }
      const group = newList[groupIndex];
      if (!('children' in group)) {
        return;
      }

      const itemIndex = group.children.findIndex(
        (item) => item.key === itemKey
      );
      if (itemIndex === -1) {
        return;
      }

      group.children.splice(itemIndex, 1);

      props.onChange(newList);
    });

    const handleUpdateItem = useEvent(
      (groupKey: string, itemKey: string, fieldName: string, value: any) => {
        const newList = [...props.value];
        const groupIndex = newList.findIndex((item) => item.key === groupKey);
        if (groupIndex === -1) {
          return;
        }
        const group = newList[groupIndex];
        if (!('children' in group)) {
          return;
        }

        const itemIndex = group.children.findIndex(
          (item) => item.key === itemKey
        );
        if (itemIndex === -1) {
          return;
        }

        set(group, `children[${itemIndex}].${fieldName}`, value);

        props.onChange(newList);
      }
    );

    return (
      <div className="rounded-lg border p-2">
        <SortableGroup<GroupItemProps, LeafItemProps>
          list={props.value}
          onChange={props.onChange}
          renderGroup={(group, children, level) => (
            <div>
              {level > 0 && (
                <div className={cn('flex items-center gap-2')}>
                  <EditableText
                    className="flex-1 overflow-hidden text-ellipsis text-nowrap font-bold"
                    defaultValue={group.title}
                    onSave={(text) => handleChangeGroupTitle(group.key, text)}
                  />

                  <Button
                    className="h-6 w-6"
                    variant="outline"
                    size="icon"
                    type="button"
                    Icon={LuCirclePlus}
                    onClick={() => handleAddItem(group.key)}
                  />

                  <Button
                    className="h-6 w-6"
                    variant="outline"
                    size="icon"
                    type="button"
                    Icon={LuTrash}
                    onClick={() => handleDeleteGroup(group.key)}
                  />
                </div>
              )}

              <div
                className={cn(
                  level > 0 &&
                    'border-l-4 border-gray-300 p-2 dark:border-gray-600'
                )}
              >
                {children}
              </div>
            </div>
          )}
          renderItem={(item, i, group) => {
            if (item.type === 'monitor') {
              return (
                <div key={item.key}>
                  {i !== 0 && <Separator className="my-2" />}

                  <div className="mb-2 flex flex-col gap-2">
                    <MonitorPicker
                      value={item.id}
                      onValueChange={(val) =>
                        handleUpdateItem(group.key, item.key, 'id', val)
                      }
                    />

                    <div className="flex flex-1 items-center">
                      <Switch
                        checked={item.showCurrent ?? false}
                        onCheckedChange={(val) =>
                          handleUpdateItem(
                            group.key,
                            item.key,
                            'showCurrent',
                            val
                          )
                        }
                      />

                      <span className="ml-1 flex-1 align-middle text-sm">
                        {t('Show Latest Value')}
                      </span>

                      <Switch
                        className="ml-4"
                        checked={item.showDetail ?? true}
                        onCheckedChange={(val) =>
                          handleUpdateItem(
                            group.key,
                            item.key,
                            'showDetail',
                            val
                          )
                        }
                      />

                      <span className="ml-1 flex-1 align-middle text-sm">
                        {t('Show Detail')}
                      </span>

                      <LuCircleMinus
                        className="cursor-pointer text-lg"
                        onClick={() => handleDeleteItem(group.key, item.key)}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          }}
        />

        {Array.isArray(props.value) && props.value.length === 0 && (
          <p className="text-xs opacity-50">
            {t('No any group has been created, click button to create one')}
          </p>
        )}

        <Button
          className="mt-2"
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddGroup}
        >
          {t('Add Group')}
        </Button>
      </div>
    );
  });
MonitorStatusPageServiceList.displayName = 'MonitorStatusPageServiceList';
