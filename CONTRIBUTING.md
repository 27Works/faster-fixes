# Contributing to Faster Fixes

Thanks for your interest in improving Faster Fixes. This guide explains how to propose a change and what a pull request needs before it can be merged.

## Before you start

- **Open an issue first** for anything beyond a small fix (typos, obvious bugs, one-file changes). Describe the problem and the change you have in mind, and wait for a reply before writing code. The codebase moves quickly, and this avoids work that conflicts with something already planned.
- **One concern per pull request.** Split unrelated changes into separate pull requests. Small pull requests are reviewed faster.
- **Search existing issues and pull requests** to check that the work is not already in progress.

## Contributor License Agreement

All contributors must sign the Faster Fixes [Contributor License Agreement](CLA.md) (CLA) before a pull request can be merged. You sign it once, and it covers all your future contributions.

When you open your first pull request, the CLA Assistant bot posts a comment with a link to the agreement. Sign in with GitHub and accept it, and the check turns green. If your pull request contains commits from several authors, each author must sign.

## Development setup

Requirements: Node.js 20 or later and pnpm 10.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp packages/database/.env.example packages/database/.env
pnpm build:packages
pnpm --filter @workspace/db db:gen
pnpm --filter @workspace/db migrate:dev
pnpm dev
```

The [self-hosting guide](https://faster-fixes.com/docs/self-hosting) describes the services and environment variables the app needs.

## Making changes

- Branch from `dev` and open your pull request against `dev`.
- Follow the conventions of the surrounding code. Project conventions live in [`.claude/skills/coding-standards/`](.claude/skills/coding-standards/), and domain terms are defined in [`CONTEXT.md`](CONTEXT.md).
- Add or update tests for the behavior you change.
- If you add an environment variable, document it in `apps/web/.env.example`.
- If you change a published `@fasterfixes/*` package, add a changeset with `pnpm changeset`.
- Do not commit unrelated `pnpm-lock.yaml` changes. Only touch the lockfile when you add or remove a dependency.

## Commit messages

Commits follow the [Conventional Commits](https://www.conventionalcommits.org) format:

```
fix(widget): keep the comment box inside the viewport on mobile
feat(integrations): send resolved feedback to Linear
docs(self-hosting): document the SMTP settings
```

## Checks

The pre-commit hook runs formatting, linting, type checking, tests and Knip. Before opening a pull request, also run the checks that cover the whole repository:

```bash
pnpm lint
pnpm format:check
```

CI runs the same checks on every pull request. A pull request is merged once CI passes, the CLA is signed, and a maintainer has approved it.

## Reporting security issues

Do not open a public issue for a security vulnerability. Email [support@faster-fixes.com](mailto:support@faster-fixes.com) instead.

## License

By contributing, you agree that your contributions are licensed under the terms of the CLA and the project [license](LICENSE).
