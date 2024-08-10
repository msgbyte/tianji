import { describe, expect, test } from 'vitest';
import {
  tencentCloudAlarmMetricSchema,
  tencentCloudAlarmSchema,
} from '../feed.js';

describe('tencentCloudAlarmSchema', () => {
  test('should be pass in ', () => {
    const data = {
      sessionId: '395d4bb4-08bf-45fd-a820-ef27047a00009',
      alarmStatus: '1',
      alarmType: 'metric',
      alarmObjInfo: {
        region: 'sh',
        namespace: 'qce/lb',
        appId: '1257200005',
        uin: '10000670009',
        dimensions: {
          deviceName: 'Tailchat',
          objId: '953a6ec8-f9ff-4c6f-96f6-37c2005dddfb',
          objName: '172.17.32.0#41119',
          unInstanceId: 'ins-n0y0008z',
        },
      },
      alarmPolicyInfo: {
        policyId: 'policy-b900061',
        policyType: 'cvm_device',
        policyName: 'xxxxx',
        policyTypeCName: 'xxxxx-xxxxxx',
        policyTypeEname: '',
        conditions: {
          metricName: 'outratio',
          metricShowName: 'xxxxxxxxxxxxx',
          calcType: '>',
          calcValue: '95',
          currentValue: '95.255',
          historyValue: '',
          unit: '%',
          calcUnit: '%',
          period: '300',
          periodNum: '5',
          alarmNotifyType: 'continuousAlarm',
          alarmNotifyPeriod: 86400,
        },
        tag: [],
        policyTags: [],
      },
      firstOccurTime: '2024-08-07 07:55:00',
      durationTime: 0,
      recoverTime: '0',
      policyDetailURL: 'https://tcop.qq.com/r/xxxxxx',
    };

    const res = tencentCloudAlarmSchema.safeParse(data);

    expect(res.success).toBe(true);
    expect((res as any).data).toEqual(data);
  });
});
