# Third-party sources

The shadcn/ui component archive is copied unchanged from Anthropic's
[web-artifacts-builder](https://github.com/anthropics/skills/tree/b9e19e6f44773509fbdd7001d77ff41a49a486c1/skills/web-artifacts-builder)
at commit `b9e19e6f44773509fbdd7001d77ff41a49a486c1`.
The Tailwind theme, CSS variables, and `components.json` are adapted from its
`scripts/init-artifact.sh`. The Tailwind configuration uses CommonJS filenames
for compatibility with the generated ESM project. These sources are distributed
under the Apache License 2.0; see [LICENSE.txt](LICENSE.txt).

Tianji supplies its own fixed starter, initialization and bundling scripts, and
API workflow. The starter uses Vite with `vite-plugin-singlefile` instead of
Parcel and `html-inline`, and enforces Tianji's 1 MiB upload limit. Runtime
dependencies retain their respective licenses in the installed packages.
