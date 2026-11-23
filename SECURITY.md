# Security Policy

FChat holds Instagram access tokens and the conversations of the people who message you, so we take security reports seriously.

## Supported versions

Only the latest release receives security fixes. Installations with automatic updates turned on get them within about four hours of a release. If yours is off, update from **Settings › Updates**.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Report it privately through GitHub: go to the [Security tab](https://github.com/paidbyfacu/fchat/security) of this repository and click **Report a vulnerability**. Include:

- what an attacker could do and what they need to do it, such as being logged out or knowing a URL;
- steps to reproduce, ideally against a local installation;
- the FChat version, from `package.json` or **Settings › Updates**.

We will acknowledge your report as soon as we can, keep you updated while we work on a fix, and credit you in the release notes unless you prefer to stay anonymous.

## Scope

In scope: the code in this repository, including the dashboard, authentication and sessions, the Meta webhook, `/api/cron`, the update workflow and how secrets are stored.

Out of scope: vulnerabilities in Meta, Instagram, Vercel or Neon themselves, installations that were modified by their owners, and reports that require access the administrator already granted.

## Keeping your installation safe

- Use a long, unique administrator password.
- Keep automatic updates on, or update often.
- Never share your `.env` files, Meta app secret or access tokens, and never commit them to a repository.
- If you think your Meta app secret or a token leaked, rotate it in the Meta dashboard and reconnect Instagram in FChat.
