# Contributing to FChat

Thanks for wanting to make FChat better. **This project is open to pull requests:** anyone can propose a fix, a new feature, a translation or a docs improvement, and we are happy to review it and add it to the app.

Every accepted change ships in the next release, and every FChat installation with automatic updates turned on receives it within a few hours. Your work reaches all users, not just the main repository.

## Ways to help

- **Report a bug:** open an issue with the [bug report template](https://github.com/paidbyfacu/fchat/issues/new?template=bug_report.yml). Steps to reproduce help a lot.
- **Suggest a feature:** open an issue with the [feature request template](https://github.com/paidbyfacu/fchat/issues/new?template=feature_request.yml) and tell us the problem it solves.
- **Send a pull request:** fixes, features, tests, docs, screenshots and translations are all welcome.
- **Report a security issue privately:** see [SECURITY.md](SECURITY.md). Please do not open public issues for vulnerabilities.

For larger changes, such as a new channel, a new automation step or a database change, open an issue first so we can agree on the approach before you invest time in it.

## Development setup

You need Node.js 20 or newer and Git. You do not need Postgres: locally FChat can use PGlite, an embedded Postgres that stores its data in a folder.

```bash
git clone https://github.com/<your-user>/fchat.git
cd fchat
npm ci
cp .env.example .env.local
```

In `.env.local`, set `PGLITE_DIR` to an **absolute** path outside the project folder, for example `C:/fchat-data` or `/home/you/fchat-data`. Every other variable is optional. Then:

```bash
npm run dev
```

Open http://localhost:3000. On an empty database FChat sends you to `/setup` to create the administrator account.

To test the Instagram flow end to end you need a public HTTPS URL for Meta's webhook, for example a tunnel such as `cloudflared tunnel --url http://localhost:3000`, plus your own Meta app. The [Meta setup guide](docs/meta-setup.md) walks through it. Never use a real person's data in tests, screenshots or examples.

## Before you open a pull request

Run the same checks the maintainers run:

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

And please:

- Keep pull requests small and focused on one thing. Two separate fixes are easier to review as two pull requests.
- Add or update tests in `*.test.ts` when you change logic in `src/server` or `src/lib`.
- Database changes go in a **new** numbered file in `db/migrations`. Never edit a migration that already shipped: installations have already run it.
- Write code, comments, docs and commit messages in English.
- Do not commit secrets, `.env.local`, database files or screenshots with real names, IDs, tokens or URLs.
- If you change what the terms say, update both `src/lib/terms.ts` and [TERMS.md](TERMS.md) and bump `TERMS_VERSION`.

## Code conventions

- **Server vs client code:** functions used by server pages live in `src/lib` or `src/server`, never in a file marked `"use client"`.
- **Authentication:** every new page, server action or API route must go through `requireUser` or `sessionUser`. The proxy only checks the cookie signature.
- **Forms with `useActionState`:** submit them with `onSubmit={keepValues(action)}` from `src/lib/keep-values.ts`, so React does not clear the form when validation fails.
- **API routes that read nothing from the request** start with `await connection()`, so Next.js does not try to prerender them at build time.
- **Configuration:** every environment variable must stay optional. Secrets are generated and stored in the database when missing; see `src/server/config.ts`.
- **Meta API calls** go through `src/server/instagram.ts`, which handles rate limits and retries.

## How pull requests are handled

1. A maintainer reviews your pull request, may ask for changes, and runs the checks above.
2. Accepted pull requests are merged with **squash and merge**, so the history stays clean and you remain the author of the commit.
3. The change goes out in the next FChat version. Installations with automatic updates pick it up within about four hours.

## Releases

FChat follows [semantic versioning](https://semver.org). The version lives in `package.json`; **Settings › Updates** in every installation compares it with this repository to tell the administrator a new version is out. Maintainers bump it when releasing, so you do not need to change it in your pull request.

## License of contributions

By contributing, you agree that your contribution is licensed under the same terms as the project: the MIT license with the Commons Clause condition, see [LICENSE](LICENSE). That means nobody can sell FChat or a paid service based on it.

## Code of conduct

Everyone taking part in this project is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
