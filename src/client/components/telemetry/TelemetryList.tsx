import { Trans, t } from '@i18next-toolkit/react';
import { Button, Collapse, Form, Input, Modal, Table, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import { AppRouterOutput, trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { type ColumnsType } from 'antd/es/table/interface';
import {
  BarChartOutlined,
  CodeOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { PageHeader } from '../PageHeader';
import { useEvent } from '../../hooks/useEvent';
import { TelemetryCounter } from './TelemetryCounter';

type TelemetryInfo = AppRouterOutput['telemetry']['all'][number];

export const TelemetryList: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm<{ id?: string; name: string }>();
  const upsertTelemetryMutation = trpc.telemetry.upsert.useMutation();
  const utils = trpc.useUtils();
  const [modal, contextHolder] = Modal.useModal();

  const handleAddTelemetry = useEvent(async () => {
    await form.validateFields();
    const values = form.getFieldsValue();

    await upsertTelemetryMutation.mutateAsync({
      telemetryId: values.id,
      workspaceId,
      name: values.name,
    });

    utils.telemetry.all.refetch();

    setIsEditModalOpen(false);

    form.resetFields();
  });

  const handleShowUsage = useEvent((info: TelemetryInfo) => {
    const blankGif = `${window.location.origin}/telemetry/${workspaceId}/${info.id}.gif`;
    const countBadgeUrl = `${window.location.origin}/telemetry/${workspaceId}/${info.id}/badge.svg`;
    modal.info({
      maskClosable: true,
      title: 'How to Use Telemetry',
      content: (
        <div>
          <p>Here is some way to use telemetry:</p>
          <h2>Insert to article:</h2>
          <p>
            if your article support raw html, you can direct insert it{' '}
            <Typography.Text code={true} copyable={{ text: blankGif }}>
              {blankGif}
            </Typography.Text>
          </p>
          <Collapse
            ghost
            items={[
              {
                label: 'Advanced',
                children: (
                  <div>
                    <p>
                      Some website will not allow send `referer` field. so its
                      maybe can not track source. so you can mark it by
                      yourself. for example:
                    </p>
                    <p>
                      <Typography.Text code={true}>
                        {blankGif}?url=https://xxxxxxxx
                      </Typography.Text>
                    </p>
                  </div>
                ),
              },
            ]}
          />

          <h2>Count your website visitor:</h2>
          <p>
            if your article support raw html, you can direct insert it{' '}
            <Typography.Text code={true} copyable={{ text: countBadgeUrl }}>
              {countBadgeUrl}
            </Typography.Text>
          </p>
          <p>
            Like this: <img src={countBadgeUrl} />
          </p>
        </div>
      ),
    });
  });

  const handleEditTelemetry = useEvent(async (info: TelemetryInfo) => {
    setIsEditModalOpen(true);
    form.setFieldsValue({
      id: info.id,
      name: info.name,
    });
  });

  return (
    <div>
      <PageHeader
        title={t('Telemetry')}
        desc={
          <div>
            <p>
              <Trans>
                Telemetry is a technology that reports access data even on pages
                that are not under your control. As long as the other website
                allows the insertion of third-party images (e.g., forums, blogs,
                and various rich-text editors), then the data can be collected
                and used to analyze the images when they are loaded by the user.
              </Trans>
            </p>

            <p>
              <Trans>
                Generally, we will use a one-pixel blank image so that it will
                not affect the user's normal use.
              </Trans>
            </p>

            <p>
              <Trans>
                At the same time, we can also use it in some client-side
                application scenarios, such as collecting the frequency of cli
                usage, such as collecting the installation of selfhosted apps,
                and so on.
              </Trans>
            </p>
          </div>
        }
        action={
          <div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setIsEditModalOpen(true)}
            >
              {t('Add Telemetry')}
            </Button>
          </div>
        }
      />

      <TelemetryListTable
        onShowUsage={handleShowUsage}
        onEdit={handleEditTelemetry}
      />

      <Modal
        title={t('Add Telemetry')}
        open={isEditModalOpen}
        okButtonProps={{
          loading: upsertTelemetryMutation.isLoading,
        }}
        onOk={() => handleAddTelemetry()}
        onCancel={() => setIsEditModalOpen(false)}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="id" hidden={true} />
          <Form.Item
            label={t('Telemetry Name')}
            name="name"
            tooltip={t('Telemetry Name to Display')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {contextHolder}
    </div>
  );
});
TelemetryList.displayName = 'TelemetryList';

const TelemetryListTable: React.FC<{
  onEdit: (info: TelemetryInfo) => void;
  onShowUsage: (info: TelemetryInfo) => void;
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { data = [], isLoading } = trpc.telemetry.all.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();

  const columns = useMemo((): ColumnsType<TelemetryInfo> => {
    return [
      {
        dataIndex: 'name',
        title: t('Name'),
      },
      {
        dataIndex: 'id',
        title: t('Count'),
        align: 'center',
        width: 130,
        render: (id) => {
          return <TelemetryCounter telemetryId={id} />;
        },
      },
      {
        key: 'action',
        title: t('Actions'),
        align: 'right',
        width: 240,
        render: (_, record) => {
          return (
            <div className="flex justify-end gap-2">
              <Button
                icon={<CodeOutlined />}
                onClick={() => props.onShowUsage(record)}
              >
                {t('Usage')}
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => props.onEdit(record)}
              >
                {t('Edit')}
              </Button>
              <Button
                icon={<BarChartOutlined />}
                onClick={() => {
                  navigate(`/telemetry/${record.id}`);
                }}
              >
                {t('View')}
              </Button>
            </div>
          );
        },
      },
    ] as ColumnsType<TelemetryInfo>;
  }, []);

  return (
    <Table
      loading={isLoading}
      dataSource={data}
      columns={columns}
      rowKey="id"
    />
  );
});
TelemetryListTable.displayName = 'TelemetryListTable';
