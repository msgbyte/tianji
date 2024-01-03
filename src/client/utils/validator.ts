import { RuleObject } from 'antd/es/form';
import { z } from 'zod';
import { hostnameRegex, slugRegex } from '../../shared';

type Validator = (
  rule: RuleObject,
  value: any,
  callback: (error?: string) => void
) => Promise<void | any> | void;

export const hostnameValidator: Validator = (rule, value, callback) => {
  try {
    z.union([z.string().ip(), z.string().regex(hostnameRegex)]).parse(value);
    callback();
  } catch (err) {
    callback('Not valid host, it should be ip or hostname');
  }
};

export const urlSlugValidator: Validator = (rule, value, callback) => {
  try {
    z.string().regex(slugRegex).parse(value);
    callback();
  } catch (err) {
    callback('Not valid slug');
  }
};
