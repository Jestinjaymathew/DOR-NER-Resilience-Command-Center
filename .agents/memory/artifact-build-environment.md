---
name: Artifact build environment
description: Local build behavior for deployable Vite artifacts in this workspace
---

Run standalone Vite production builds with the artifact's required `PORT` and `BASE_PATH` environment values; the managed workflow supplies these automatically during normal preview operation.

**Why:** The artifact config intentionally fails fast without routing metadata, so a bare package build can fail even when the app and typecheck are healthy.

**How to apply:** Prefer the managed workflow for verification; when invoking the package build directly, provide a valid port and the artifact preview path.