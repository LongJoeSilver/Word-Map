# Visual Dictionary

Type a word, see a map of the words around it, click any word to map that one.

- `index.html`: the whole app
- `dict/`: the dictionary (Open English WordNet 2024, CC BY 4.0), 200 small files
- `api/map.js`: optional Claude fallback for words the dictionary doesn't have
- `vercel.json`: caches the dictionary files in the browser for a week

## Put it on Vercel (about 5 minutes)

1. Sign up at vercel.com (free Hobby plan) with your GitHub account.
2. Either:
   - **Drag and drop:** install the CLI (`npm i -g vercel`), then in this folder run `vercel` and follow the prompts. Run `vercel --prod` to publish.
   - **GitHub (best):** push this folder to a new GitHub repo, then in Vercel choose *Add New → Project → Import* that repo. Leave every setting on default and hit Deploy. Every push redeploys.
3. You get a link like `visual-dictionary.vercel.app`. That works straight away.

## Optional: the "Ask Claude" fallback

Without a key, words that aren't in the dictionary just show "not in the dictionary". To turn Claude on for those:

1. Create an API key at console.anthropic.com (Downing's account). Set a monthly spend limit there too.
2. In Vercel: *Project → Settings → Environment Variables*, add `ANTHROPIC_API_KEY` with the key.
3. Redeploy. The "Ask Claude instead" button now appears for missing words.

The key stays on Vercel's server and never reaches the page. Each lookup is limited to 10 per minute per person.

## Optional: your own address

*Project → Settings → Domains*, add something like `words.downing.nz`, then add the DNS record Vercel shows you wherever downing.nz's DNS is managed.

## Heads up

The free Vercel link is public: anyone with it can use the tool. Locking it to the team needs Vercel Pro (password protection) or a move to Cloudflare Pages with Access.
