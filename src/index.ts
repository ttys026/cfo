export default {
	async fetch(request, _env, _ctx): Promise<Response> {
		const url = new URL(request.url);
		const target = url.searchParams.get('url');
		if (url.pathname !== '/' || !target || typeof target !== 'string') {
			return new Response(JSON.stringify({ error: 'Invalid URL' }), {
				status: 400,
				headers: { 'content-type': 'application/json' },
			});
		}
		const origin = new URL(target).origin;
		try {
			const html = (await fetch(target, {
				headers: {
					'user-agent':
						'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
				},
			})) as unknown as Response;

			const result: Record<string, string> = {};

			class OgStandardAttr implements HTMLRewriterElementContentHandlers {
				element(element: Element): void | Promise<void> {
					const key = element.getAttribute('property');
					const value = element.getAttribute('content');
					if (key && value) {
						result[key] = value;
					}
				}
			}

			class MetaFallbackAttr implements HTMLRewriterElementContentHandlers {
				element(element: Element): void | Promise<void> {
					const key = element.getAttribute('property');
					const value = element.getAttribute('content');
					if (key && value) {
						result[key] = value;
					}
				}
			}

			class TitleFallbackAttr implements HTMLRewriterElementContentHandlers {
				text(element: Text): void | Promise<void> {
					result.title = result.title || element.text;
				}
			}

			class IconAttr implements HTMLRewriterElementContentHandlers {
				element(element: Element): void | Promise<void> {
					const href = element.getAttribute('href');
					if (href) {
						try {
							const iconUrl = new URL(href, origin);
							result.icon = iconUrl.href;
						} catch (error) {
							// Handle invalid URL cases if necessary
							console.error('Invalid URL:', error);
						}
					}
				}
			}

			// throw symbol not working in cloudflare
			const stopSymbol = `done-${Date.now()}`;

			try {
				await new HTMLRewriter()
					.on('meta[property^="og:"]', new OgStandardAttr())
					.on('meta[name="title"]', new MetaFallbackAttr())
					.on('meta[name="description"]', new MetaFallbackAttr())
					.on('title', new TitleFallbackAttr())
					.on('link[rel="icon"]', new IconAttr())
					.on('link[rel="shortcut icon"]', new IconAttr())
					// skip body content
					.on('body', {
						element() {
							// cloudflare auto wrap throw as an error
							throw new Error(stopSymbol);
						},
					})
					.transform(html)
					.text();
			} catch (e) {
				const message = e instanceof Error ? e?.message : '';
				if (message !== stopSymbol) {
					console.error(e);
					return new Response(JSON.stringify({ error: message || 'Unknown Error' }), {
						headers: { 'content-type': 'application/json' },
					});
				}
			}

			const { title, description, ...rest } = result;
			// commit the fallback value
			rest['og:title'] = rest['og:title'] || title;
			rest['og:description'] = rest['og:description'] || title;

			if (!rest.icon) {
				const defaultIcon = `${origin}/favicon.ico`;
				try {
					const icon = await fetch(defaultIcon, { method: 'HEAD' });
					if (icon.headers.get('content-type')?.startsWith('image/')) {
						rest.icon = defaultIcon;
					}
				} catch (e) {
					console.error('Failed to fetch icon:', e);
				}
			}

			return new Response(JSON.stringify(rest), {
				headers: { 'content-type': 'application/json' },
			});
		} catch (e) {
			return new Response(JSON.stringify({ error: 'Fetch failed' }), {
				status: 500,
				headers: { 'content-type': 'application/json' },
			});
		}
	},
} satisfies ExportedHandler<Env>;
