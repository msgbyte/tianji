import { Router, raw } from 'express';
import crypto from 'crypto';
import { env } from '../utils/env.js';
import { get } from 'lodash-es';
import {
  checkIsValidProduct,
  getTierEnumByVariantId,
  updateWorkspaceSubscription,
} from '../model/billing/index.js';
import { prisma } from '../model/_client.js';
import dayjs from 'dayjs';
import { WorkspaceSubscriptionTier } from '@prisma/client';

export const billingRouter = Router();

billingRouter.post(
  '/lemonsqueezy/webhook',
  raw({
    type: () => true,
  }),
  async (req, res) => {
    const rawBody = String(req.rawBody);
    const body = req.body;

    signatureIsValid(rawBody, req.get('X-Signature') ?? '');

    const eventName = get(body, 'meta.event_name');
    const workspaceId = get(body, 'meta.custom_data.workspace_id');

    await prisma.lemonSqueezyWebhookEvent.create({
      data: {
        eventName,
        payload: body,
      },
    });

    if (!workspaceId) {
      res.status(500).send('No workspace id');
      return;
    }

    if (eventName === 'subscription_updated') {
      // update user subscription
      const subscriptionId = String(get(body, 'data.id'));
      const storeId = String(get(body, 'data.attributes.store_id'));
      const productId = String(get(body, 'data.attributes.product_id'));
      const variantId = String(get(body, 'data.attributes.variant_id'));
      const status = get(body, 'data.attributes.status');
      const cardBrand = get(body, 'data.attributes.card_brand');
      const cardLastFour = get(body, 'data.attributes.card_last_four');
      const renewsAt = dayjs(get(body, 'data.attributes.renews_at')).toDate();

      if (!checkIsValidProduct(storeId, variantId)) {
        throw new Error(`Invalid product: ${storeId}, ${variantId}`);
      }

      await prisma.lemonSqueezySubscription.upsert({
        create: {
          subscriptionId,
          workspaceId,
          storeId,
          productId,
          variantId,
          status,
          cardBrand,
          cardLastFour,
          renewsAt,
        },
        update: {
          subscriptionId,
          storeId,
          productId,
          variantId,
          status,
          cardBrand,
          cardLastFour,
          renewsAt,
        },
        where: {
          workspaceId,
        },
      });
      await updateWorkspaceSubscription(
        workspaceId,
        status === 'cancelled'
          ? WorkspaceSubscriptionTier.FREE
          : getTierEnumByVariantId(variantId)
      );
    }

    res.status(200).send('OK');
  }
);

function signatureIsValid(rawBody: string, requestSignature: string) {
  const secret = env.billing.lemonSqueezy.signatureSecret;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
  const signature = Buffer.from(requestSignature, 'utf8');

  if (!crypto.timingSafeEqual(digest, signature)) {
    throw new Error('Invalid signature.');
  }
}
