import { Handler } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { compose } from 'compose-middleware';

export function validate(...validator: ValidationChain[]): Handler {
  const handler: Handler = (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      res
        .status(422)
        .json({ errors: result.array(), message: 'Invalid Parameters' });
    } else {
      next();
    }
  };

  return compose([...validator, handler as any]);
}

export { body, query, param, header } from 'express-validator';
