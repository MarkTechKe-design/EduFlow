# Module 03 — Enterprise Public Website & Marketing Platform Audit

**Date:** 2026-08-14  
**Scope:** Existing Laravel 13 + React + Inertia SaaS repository before Module 03 changes

## Executive decision

The repository has a reusable platform settings table and a working Super Admin settings surface, but it has no CMS, page builder, menu system, media library, public content model, SEO model, redirect model, blog model, or public lead persistence model.

The current public site is a hardcoded React landing page (`resources/js/Pages/Public/Landing.tsx`) rendered by `PublicSaaSController`. It reads subscription packages from the database but embeds the remaining marketing copy, navigation, FAQ, features, branding defaults, and calls to action in React. `resources/views/welcome.blade.php` is an unreferenced Laravel starter view.

## Existing systems to reuse

| Requirement | Existing implementation | Decision |
|---|---|---|
| Platform branding/settings | `PlatformSetting`, `platform_settings`, `SuperAdmin\\SettingsController` | Extend/reuse; do not create a duplicate settings table |
| Tenant branding/settings | `SchoolSetting`, `school_settings`, `SchoolAdmin\\SettingsController` | Leave tenant-scoped; public platform site must not read tenant data |
| Logo/favicon uploads | Existing public disk uploads in platform/school settings | Reuse storage conventions; add central media records for CMS assets |
| Authentication | Guest/auth route groups and existing auth controllers | Preserve |
| Authorization | Spatie permissions, `role:super-admin`, policy registration in `AppServiceProvider` | Add website permissions and policies; keep super-admin boundary |
| Audit logging | `spatie/laravel-activitylog` tables/package | Use for CMS mutations where appropriate |
| Inertia root/Vite | `app.blade.php`, `app.tsx`, one active Vite entry | Preserve |
| Packages/pricing | `Package` and package admin controller/page | Reuse as the dynamic pricing source |
| Public admission | `PublicAdmissionController`, `AdmissionInquiry` | Preserve; do not mix tenant admission data into platform CMS |
| Cache | Laravel configured cache store | Add cache tags/invalidation around published website content where supported |

## Missing infrastructure

- No `WebsitePage`, section/block, navigation/menu, media, post, category/tag, redirect, lead, consultation, demo, newsletter, event, or SEO records.
- No public content service or published-state/scheduling query.
- No central public website route resolver.
- No Super Admin website management route group or page.
- No website-specific permissions in `RolePermissionSeeder`.
- No public dynamic metadata, canonical URL, Open Graph/Twitter, JSON-LD, sitemap, or robots implementation.
- No persisted public contact/consultation/demo/newsletter lead workflow.
- No CSP/security-header policy for the public web surface.

## Existing risks

1. Marketing copy and business claims are hardcoded in `Landing.tsx`, contrary to the database-driven requirement.
2. The active public route aliases `/features`, `/pricing`, `/faq`, `/about`, `/privacy`, and `/terms` to the same hardcoded landing component.
3. Guest branding currently uses static fallback colour values in `HandleInertiaRequests`; platform settings are only partly shared.
4. There is no normalized way to schedule, publish, redirect, or unpublish public content.
5. There is no centralized record for media metadata, alt text, ownership, or reuse.

## Safe Module 03 architecture

Phase 1 should introduce a generic public CMS core rather than one table per marketing page:

- `website_pages`: route identity, publication lifecycle, template, SEO, canonical, robots, and structured data.
- `website_page_sections`: ordered reusable section instances with typed block names, JSON content/settings, enablement, and scheduling.
- `website_menus` and `website_menu_items`: editable navigation trees with ordering, visibility, target, icon, and route/link data.
- `website_media`: central metadata registry over the existing configured storage disk.
- `website_leads`: contact, consultation, demo, pricing, support, and newsletter submissions with status, throttling metadata, and handler ownership.
- `website_redirects`: managed 301/302 redirects checked before page rendering.

The first implementation slice will wire these tables to a published-page service and a public Inertia renderer, while preserving the existing `/register`, `/login`, `/apply/{school}`, authenticated routes, tenant middleware, and billing flow. Admin CRUD and richer content types can then build on the same normalized foundation.

## Non-goals for the first safe slice

- No replacement of authentication, RBAC, tenancy, billing, or existing school modules.
- No invented tenant content or demo data.
- No deletion of `welcome.blade.php`, `app.js`, or existing landing components until the new renderer is verified.
- No external analytics, email provider, reCAPTCHA, virus scanner, or CDN integration without configured credentials and explicit infrastructure support.

## Audit conclusion

Module 03 requires new CMS infrastructure. There is no existing equivalent to extend beyond `PlatformSetting` and existing package/auth/admission flows. The safe implementation path is additive: create the normalized platform website tables and models, add explicit super-admin website permissions, introduce a published content service, and then migrate the public landing surface from hardcoded React content to database-provided sections.
