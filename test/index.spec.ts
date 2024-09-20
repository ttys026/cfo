// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect, vitest } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('should get item correctly', () => {
	it('https://ogp.me/', async () => {
		const request = new IncomingRequest('http://localhost/?url=https://ogp.me/');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.json()).toMatchSnapshot();
	});
	it('https://google.com/', async () => {
		const request = new IncomingRequest('http://localhost/?url=https://google.com/');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.json()).toMatchSnapshot();
	});
});

describe('should bring user-agent header', () => {
	it('https://facebook.com/', async () => {
		const request = new IncomingRequest('http://localhost/?url=https://facebook.com/');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.json()).toMatchSnapshot();
	});
});

describe('should return error', () => {
	it('https://some-url-that-does-not-work.abcde/', async () => {
		const request = new IncomingRequest('http://localhost/?url=https://some-url-that-does-not-work.abcde/');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const json = await response.json();
		expect(json).toEqual({ error: 'Fetch failed' });
	});
});
