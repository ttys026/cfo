# Cloudflare Open-Graph Scrapper (CFO)

This is a template using HTMLRewriter in Cloudflare Workers to scrap open graph info from a website.

It has zero dependencies and can be deployed on Cloudflare workers with zero configuration by running:

```bash
npm install && npm run deploy
```

Feel free to fork this repo and modify the `src/index.ts` file if you want to make any changes to the code. For example, extract more info from html head tags or add a cache machanism using Cloudflare KV.

See a example:

[https://cfo.tianyi.li/?url=https://www.apple.com/](https://cfo.tianyi.li/?url=https%3A%2F%2Fwww.apple.com%2F)
