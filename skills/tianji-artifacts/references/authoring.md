# Build an interactive artifact

Use the starter for React pages with state, multiple components, or shadcn/ui.
Simple HTML pages do not need a build step. The workflow follows Anthropic's
[web-artifacts-builder](https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder):
initialize, edit, bundle, and present. Tianji adds publication through its API.

## Initialize

Requirements: Node.js 22+, pnpm 10.27.0, Bash, tar, and access to the npm registry
for the initial dependency installation. The scripts do not install global tools.
Resolve the Skill directory from the location of the `SKILL.md` you loaded;
do not assume your working directory is the Skill directory.

```bash
SKILL_DIR="/absolute/path/to/tianji-artifacts"
bash "$SKILL_DIR/scripts/init-artifact.sh" ./quarterly-report
cd quarterly-report
```

The destination must not exist. If installation fails after copying the project,
fix the reported dependency/network issue and run `pnpm install --frozen-lockfile`
inside that project. Do not rerun initialization over existing work.

The starter provides React 18, TypeScript, Vite, Tailwind CSS 3, Lucide icons,
44 shadcn/ui components and their Radix dependencies, light/dark CSS variables,
and the `@/` import alias. Compatible dependency versions and the pnpm lockfile
are bundled. Dependencies and development files stay on the agent's machine;
only the final HTML is uploaded.

## Edit and preview

- Replace `src/App.tsx` with the requested page, customize `src/index.css`, and
  update the title in `index.html`. Import components from `@/components/ui/...`.
- Use React state for interaction. Embed the necessary data. For navigation,
  prefer in-memory state or hash navigation over server routes.
- Import local images/fonts/media from `src` so Vite can inline them. Inline SVG
  markup is also supported. Do not use a `public` directory, relative URL strings,
  external CSS, remote data requests, workers, or runtime code evaluation.
- Do not embed credentials or use environment variables in the page. The starter
  disables Vite's environment-variable exposure.
- Persistence and host APIs are unavailable in Tianji's sandbox. Avoid
  `localStorage`, cookies, and Claude-specific APIs. Set dark mode with React state
  and the `dark` CSS class rather than a storage-backed theme provider. Do not use
  persistent panel layouts. Forms must handle input locally without navigation.

Run `pnpm dev` for local development. This server does not enforce Tianji's
preview policy, so also inspect the final bundle under that policy before upload.

## Bundle and publish

```bash
bash "$SKILL_DIR/scripts/bundle-artifact.sh"
# Equivalent: pnpm build
```

The build checks TypeScript, inlines JavaScript/CSS/assets with
`vite-plugin-singlefile`, and writes `bundle.html` in the project root. It rejects
additional emitted files and HTML larger than 1 MiB. A failed build preserves any
previous bundle; never upload that older file as though the failed edit succeeded.
Avoid importing unused components and reduce large images/data if the limit is
exceeded. Keep the project directory for future edits; bundled HTML is not a
replacement for the editable source project.

Check the bundle's main interactions, layout, browser console, and network
requests. Test with an iframe using `sandbox="allow-scripts"` and the CSP in
[operations.md](operations.md); a successful build cannot prove arbitrary user
code avoids blocked APIs or external URL strings. The final page should run with
no network requests. Do not change Tianji's sandbox to accommodate a page.

When publication is requested, follow [operations.md](operations.md), using
`bundle.html` as the source file. Initialization and bundling do not call Tianji or
publish automatically. Updates reuse the artifact ID and current revision.

The authoring workflow and supplied UI components align with the public Claude
Skill. Tianji uses Vite for both development and bundling instead of Parcel, and
retains its own upload limit, permissions, and runtime. See
[THIRD_PARTY.md](../THIRD_PARTY.md) for the pinned upstream source and license.
