import { z } from 'zod';

const tencentCloudAlarmEventSchema = z.object({
  sessionId: z.string(),
  alarmStatus: z.union([z.literal('0'), z.literal('1')]),
  alarmType: z.literal('event'),
  alarmObjInfo: z.object({
    region: z.string().optional(),
    appId: z.string(),
    uin: z.string(),
    dimensions: z.object({
      unInstanceId: z.string(),
    }),
  }),
  alarmPolicyInfo: z.object({
    policyName: z.string(),
    conditions: z.object({
      productName: z.string(),
      productShowName: z.string(),
      eventName: z.string(),
      eventShowName: z.string(),
    }),
  }),
  firstOccurTime: z.string(),
  durationTime: z.number(),
  recoverTime: z.string(),
});

// Define metric type
export const tencentCloudAlarmMetricSchema = z.object({
  sessionId: z.string(),
  alarmStatus: z.union([z.literal('0'), z.literal('1')]),
  alarmType: z.literal('metric'),
  alarmLevel: z.string().optional(),
  alarmObjInfo: z.object({
    region: z.string().optional(),
    namespace: z.string(),
    appId: z.string(),
    uin: z.string(),
    dimensions: z.object({
      deviceName: z.string(),
      objId: z.string(),
      objName: z.string(),
      unInstanceId: z.string(),
    }),
  }),
  alarmPolicyInfo: z.object({
    policyId: z.string(),
    policyType: z.string(),
    policyName: z.string(),
    policyTypeCName: z.string(),
    policyTypeEname: z.string().optional(),
    conditions: z.object({
      metricName: z.string(),
      metricShowName: z.string(),
      calcType: z.string().optional(),
      calcValue: z.string().optional(),
      currentValue: z.string().optional(),
      historyValue: z.string().optional(),
      unit: z.string().optional(),
      calcUnit: z.string().optional(),
      period: z.string().optional(),
      periodNum: z.string().optional(),
      alarmNotifyType: z.string().optional(),
      alarmNotifyPeriod: z.number().optional(),
    }),
    tag: z.array(z.unknown()).optional(),
    policyTags: z
      .array(
        z.object({
          key: z.string(),
          value: z.string(),
        })
      )
      .optional(),
  }),
  firstOccurTime: z.string(),
  durationTime: z.number(),
  recoverTime: z.string(),
  policyDetailURL: z.string().optional(),
});

export const tencentCloudAlarmSchema = z.union([
  tencentCloudAlarmEventSchema,
  tencentCloudAlarmMetricSchema,
]);
