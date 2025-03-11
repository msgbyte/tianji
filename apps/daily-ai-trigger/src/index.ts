/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { initOpenapiSDK } from 'tianji-client-sdk';
import { handleCreateDailyReport, handleTriggerAITask } from './handler';

export default {
	async fetch(request, env, ctx): Promise<Response> {
		initOpenapiSDK(env.BASE_URL, {
			apiKey: env.API_KEY,
			header: {
				'accept-language': env.LANGUAGE ?? 'en',
			},
		});

		const url = new URL(request.url);

		if (url.pathname === '/__/handleTriggerAITask') {
			await handleTriggerAITask(env);
			return new Response('handleTriggerAITask DONE');
		}

		if (url.pathname === '/__/handleCreateDailyReport') {
			await handleCreateDailyReport(env);
			return new Response('handleCreateDailyReport DONE');
		}

		return new Response('Hello World!');
	},
	async scheduled(controller, env, ctx) {
		initOpenapiSDK(env.BASE_URL, {
			apiKey: env.API_KEY,
			header: {
				'accept-language': env.LANGUAGE ?? 'en',
			},
		});

		switch (controller.cron) {
			case '0 1 * * *':
				await handleTriggerAITask(env);
				break;
			case '0 2 * * *':
				await handleCreateDailyReport(env);
				break;
		}
		console.log('cron processed');
	},
} satisfies ExportedHandler<Env>;
