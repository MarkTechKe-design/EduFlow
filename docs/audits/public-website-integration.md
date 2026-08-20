# Public Website Integration Audit

**Module:** 02A – Public Website Integration & White Screen Repair  
**Audit mode:** Diagnosis-first (Phase 1)  
**Audit date:** 2026-08-14  
**Repository:** `feature/saas-v1`

## Executive finding

The current `/` route is not connected to an older 90+ page public website. It is connected to the Codex-generated SaaS landing page:

```text
GET /  -> PublicSaaSController@home
       -> Inertia::render('Public/Landing')
       -> resources/js/Pages/Public/Landing.tsx
       -> resources/views/app.blade.php
       -> resources/js/app.tsx
```

The older public-facing artifact in this repository is `resources/views/welcome.blade.php`, the original Laravel starter welcome page. It is not referenced by any current route or controller. Repository history and all local branches contain no separate 90+ page public-site tree. The repository does contain 106 React page files, but 104 of those are authenticated SaaS pages; only `Public/Landing.tsx` and `Public/AdmissionForm.tsx` are public pages.

This means the primary integration problem is architectural/disconnected content, not an Inertia page-resolution failure. A white screen cannot be attributed to a missing public component from static inspection: all 105 `Inertia::render()` targets resolve to existing React page files. Build and browser checks remain required before a repair is authorized.

## Scope and method

Read-only inspection covered:

- Laravel routes, controllers, middleware, bootstrap configuration, and Blade views.
- Vite configuration, TypeScript configuration, Inertia bootstrap, layouts, components, and page files.
- Static `Inertia::render()` target-to-file resolution.
- `php artisan route:list` (295 routes).
- Git history and all local branches for public-site and landing-page paths.
- Existing project instructions in `AI_RULES.md` and `CLAUDE.md`.

No application source, routes, layouts, controllers, or configuration were changed during the audit. This report is the requested Phase 1 artifact.

## Current architecture

### Backend

- Laravel 13 with the `web` route file at `routes/web.php`.
- Inertia middleware is appended to the web middleware stack in `bootstrap/app.php`.
- The Inertia root view is `resources/views/app.blade.php` through `HandleInertiaRequests::$rootView = 'app'`.
- Authentication, role middleware, permission middleware, and tenant-aware application code remain in the existing route/controller stack.
- The public SaaS controller is `app/Http/Controllers/PublicSaaSController.php`.
- Public school admission is handled separately by `app/Http/Controllers/PublicAdmissionController.php`.

### Frontend

- The active Vite input is `resources/js/app.tsx` plus `resources/css/app.css` (`vite.config.ts`).
- `resources/js/app.js` only imports `./bootstrap`; it is a legacy wrapper and is not an active Vite input.
- `app.tsx` calls `createInertiaApp`, resolves `./Pages/${name}.tsx`, and supplies `import.meta.glob('./Pages/**/*.tsx')`.
- There are two application layouts:
  - `resources/js/Layouts/AppLayout.tsx` for authenticated application pages.
  - `resources/js/Layouts/AuthLayout.tsx` for login/registration/password pages.
- `Public/Landing.tsx` and `Public/AdmissionForm.tsx` intentionally render their own public shells and do not use either application layout.

## Duplicate and disconnected systems

| System | Location | Status | Evidence |
|---|---|---|---|
| Codex-generated public SaaS landing page | `resources/js/Pages/Public/Landing.tsx` | Active | Added in commit `0b75a8e`, rendered by `PublicSaaSController@home` |
| Original Laravel welcome page | `resources/views/welcome.blade.php` | Disconnected | Added in `e83b361`; no route/controller reference remains |
| Active Inertia root shell | `resources/views/app.blade.php` | Active | `HandleInertiaRequests::$rootView = 'app'`; contains `@inertia` |
| Legacy JS wrapper | `resources/js/app.js` | Inactive for current root | Not in `vite.config.ts` input and not referenced by `app.blade.php` |
| Public React landing component | `resources/js/Pages/Public/Landing.tsx` | Single copy | No duplicate `Landing.tsx` or `Home.tsx` found |
| Shared React layouts | `resources/js/Layouts/AppLayout.tsx`, `AuthLayout.tsx` | Single copy each | No duplicate layout component files found |

The older `welcome.blade.php` is not a second active website: it is an unreferenced starter view. The current public implementation is a single-page SaaS marketing shell with section anchors. The requested “original 90+ pages” are not present in the repository snapshot or any local branch inspected, so they cannot be integrated until their source is supplied or recovered from an external artifact.

## Routing map

### Public guest routes

| URI | Name | Controller/action | Inertia page |
|---|---|---|---|
| `/` | `home` | `PublicSaaSController@home` | `Public/Landing` |
| `/features` | `public.features` | `PublicSaaSController@home` | `Public/Landing` |
| `/pricing` | `public.pricing` | `PublicSaaSController@home` | `Public/Landing` |
| `/faq` | `public.faq` | `PublicSaaSController@home` | `Public/Landing` |
| `/about` | `public.about` | `PublicSaaSController@home` | `Public/Landing` |
| `/privacy` | `public.privacy` | `PublicSaaSController@home` | `Public/Landing` |
| `/terms` | `public.terms` | `PublicSaaSController@home` | `Public/Landing` |
| `POST /contact` | `public.contact` | `PublicSaaSController@contact` | Redirect back with flash |
| `/login` | `login` | `LoginController@create` | `Auth/Login` |
| `/register` | `register` | `RegistrationController@create` | `Auth/Register` |
| `/forgot-password` | `password.request` | `PasswordResetController@createRequest` | `Auth/ForgotPassword` |
| `/reset-password/{token}` | `password.reset` | `PasswordResetController@createReset` | `Auth/ResetPassword` |

### Public admission routes

| URI | Name | Controller/action | Inertia page |
|---|---|---|---|
| `/apply/{school}` | `public.admission.show` | `PublicAdmissionController@show` | `Public/AdmissionForm` |
| `POST /apply/{school}` | `public.admission.submit` | `PublicAdmissionController@submit` | Redirect back with flash |

### Authenticated SaaS routes

The remaining 281 routes are authenticated, role/permission-gated school, student, parent, super-admin, billing, profile, onboarding, and email-verification routes. Their controllers render the existing application page tree under `Dashboard`, `SchoolAdmin`, `Student`, `Parent`, `SuperAdmin`, `Billing`, `Onboarding`, `Profile`, and `ChangePassword`.

`php artisan route:list --except-vendor` completed and reported 295 total routes. The existing role, permission, authentication, billing, and tenant route groups were not altered during this audit.

## Controller map

| Concern | Controller(s) | Public or authenticated |
|---|---|---|
| SaaS marketing shell and contact | `PublicSaaSController` | Public guest |
| School admission inquiry | `PublicAdmissionController` | Public |
| Login/logout | `Auth\\LoginController` | Guest/auth |
| Registration | `Auth\\RegistrationController` | Guest |
| Password reset | `Auth\\PasswordResetController` | Guest |
| School SaaS onboarding | `OnboardingController` | Authenticated |
| Subscription billing | `BillingController` | Authenticated |
| School operations | `SchoolAdmin\\*Controller` | Authenticated + role/permission |
| Student portal | `StudentPortalController` | Authenticated + role |
| Parent portal | `ParentPortalController` | Authenticated + role |
| Platform administration | `SuperAdmin\\*Controller` | Authenticated + role |

`PublicSaaSController::home()` loads public packages defensively when the `packages` table is available, then renders `Public/Landing` with `packages`. This controller does not render `welcome.blade.php`.

## Blade layout map

### Active Inertia root

`resources/views/app.blade.php`:

- Loads `resources/css/app.css` and `resources/js/app.tsx` through `@vite`.
- Includes `@inertiaHead`.
- Includes the Inertia mount directive `@inertia`, which creates the Inertia root element (`#app`) and serializes the page payload.
- Provides the favicon link and document title.

### Disconnected Blade view

`resources/views/welcome.blade.php` is a standalone Laravel starter page. It contains a conditional legacy `@vite(['resources/css/app.css', 'resources/js/app.js'])` branch and an embedded Tailwind fallback. No current route returns `view('welcome')`, so it cannot be the current `/` website.

## React page map

The page tree contains 106 `.tsx` page files:

| Area | Count / role |
|---|---:|
| `Public` | 2 (`Landing`, `AdmissionForm`) |
| `Auth` | 5 |
| `Billing`, `Onboarding`, `Profile`, `ChangePassword`, `Dashboard` | 5 |
| `SchoolAdmin` | 60 |
| `Student` | 7 |
| `Parent` | 5 |
| `SuperAdmin` | 21 |

The static render-target audit found 105 unique `Inertia::render()` names and zero missing corresponding `.tsx` files. The extra page file is `Dashboard.tsx`, which is present in the tree but the current `/dashboard` route redirects to a role-specific dashboard rather than directly rendering it.

### Public page behavior

- `Public/Landing.tsx` is a self-contained marketing page with navigation anchors for Features, Modules, Pricing, and FAQ, plus links to login/register/about/privacy/terms.
- `/features`, `/pricing`, `/faq`, `/about`, `/privacy`, and `/terms` all render the same `Public/Landing` component; they do not select distinct public page components.
- `Public/AdmissionForm.tsx` is a separate school-specific inquiry form.
- Neither public page uses `AppLayout` or `AuthLayout`.

## Layout and runtime checks

| Check | Result |
|---|---|
| Duplicate `Landing` / `Home` React pages | None found; one `Public/Landing.tsx` |
| Duplicate layout components | None found; one `AppLayout` and one `AuthLayout` |
| Multiple active Vite entrypoints | No; one active entry `resources/js/app.tsx` |
| Legacy entrypoint present | Yes, `resources/js/app.js`, inactive for current root |
| `createInertiaApp` page resolution | Correct static pattern: `./Pages/${name}.tsx` against `./Pages/**/*.tsx` |
| Public render targets missing | None found |
| `import.meta.glob()` coverage | Covers the full `resources/js/Pages/**/*.tsx` tree |
| Suspense hiding errors | No `Suspense` usage found |
| ErrorBoundary swallowing errors | No; the boundary renders a visible “Runtime Error” block with the error text |
| Layout returns `null` | No; both application layouts return markup. `PageProgress` and `BrandingSync` return `null` by design, not page layouts |
| `app.blade.php` mount | Correct; `@inertia` is present and active |
| HandleInertiaRequests shared props | Structurally valid; database-dependent branding props catch `QueryException`; unauthenticated requests return default branding and null auth |
| Middleware prevents public render | No static evidence; public root is in the `guest` group and Inertia middleware is appended to `web` |
| React runtime errors swallowed | No; visible error boundary exists. Page-resolution promise failures may still surface through Inertia/Vite rather than this render boundary |

## Causes of the white-screen risk

### Confirmed integration gap

The requested original public website is not connected because it is not present as a second public-site implementation in this repository. The root route is explicitly wired to the generated `Public/Landing` page, and all alternate public marketing URIs are aliases of that same component. `welcome.blade.php` is disconnected and is only the Laravel starter view.

### Not supported as causes by static evidence

- Missing Inertia page component: disproved by the 105-target/zero-missing check.
- Broken `import.meta.glob()` path: pattern and filesystem casing match all page files.
- `app.blade.php` failing to mount `#app`: `@inertia` is present.
- Suspense or ErrorBoundary hiding the page: no Suspense; the boundary displays errors.
- Duplicate public `Landing` / `Home` components: none found.
- Middleware rejection of `/`: root is guest-only and served by a public controller.

### Remaining runtime hypotheses requiring Phase 3 evidence

1. A Vite/TypeScript build failure or an asset-manifest mismatch.
2. A browser runtime exception during module evaluation or component render.
3. A database/configuration exception before Inertia serialization, although `PublicSaaSController` and shared branding access deliberately guard missing tables with `QueryException`.
4. A deployment with neither a running Vite dev server nor `public/build/manifest.json`; the active `app.blade.php` always invokes `@vite`, whereas the disconnected legacy `welcome.blade.php` had a conditional fallback.

These hypotheses must be tested with `npm run build`, browser inspection, and a real request before changing code.

## Recommended integration strategy

1. Treat `PublicSaaSController` + `Public/Landing.tsx` as the current public entrypoint for the SaaS application and preserve the authenticated route tree.
2. Recover or provide the actual original public website source before attempting a merge. The current repository does not contain the claimed 90+ public pages, so no honest file-level integration can be performed from this snapshot.
3. If the original site is supplied as React/Inertia pages, place it under a distinct `Public` page namespace, connect only its public GET routes to dedicated controller actions, and reuse the existing `app.blade.php`, Vite entry, Inertia bootstrap, branding props, and public admission/auth links.
4. If the original site is supplied as Blade/HTML, integrate it into the existing Inertia root or create a deliberately separate public Blade root only after verifying that authentication and Inertia navigation remain isolated. Do not route `/` to `welcome.blade.php` without preserving the active asset pipeline.
5. Keep `AppLayout`, `AuthLayout`, `HandleInertiaRequests`, RBAC middleware, tenancy logic, billing, and SaaS controllers unchanged unless runtime evidence identifies a direct defect in one of them.
6. Do not delete `welcome.blade.php`, `app.js`, or any public component until references and deployment requirements are rechecked; they are currently redundant/disconnected, but deletion is not necessary to repair the integration.

## Phase 1 conclusion

Phase 1 is complete. The repository currently has one active generated public landing system and one disconnected Laravel starter view, not two complete public websites. Static page resolution, route registration, middleware wiring, and root mounting are internally consistent. Proceeding to repair requires either runtime failure evidence or the missing original public-site source. No authentication, middleware, RBAC, tenancy, billing, or security changes are recommended.
