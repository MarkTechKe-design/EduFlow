# EduFlow Module 03.5 — Enterprise Role Verification & Dashboard Completion Audit

Date: 2026-08-14  
Mode: diagnosis-first; this report was produced before the application changes in this module.

## Scope and method

The audit compared the authoritative role and permission seeders, Laravel route groups and middleware, controller authorization calls, policies, Inertia render targets, React page files, authenticated navigation, dashboard data contracts, migrations, models, and existing security tests. It also checked the Inertia bootstrap and Blade root view for page-resolution or white-screen causes.

No new feature, model, migration, permission, controller, service, or parallel UI system is justified by the inventory.

## Executive findings

1. The application has 12 seeded roles: `super-admin`, `school-admin`, `principal`, `teacher`, `accountant`, `librarian`, `receptionist`, `student`, `parent`, `driver`, `warden`, and `store-manager`. The additional role names in the Module 03.5 brief (School Owner, Deputy Principal, Academic Registrar, Finance Officer, Bursar, Class Teacher, Inventory Officer, HR Officer, Transport Manager, Admissions Officer, Support Officer, and similar) are not seeded and have no authoritative route, policy, dashboard, or permission implementation. They must not be invented in this audit.
2. Seven seeded role landing paths are valid. Receptionist and Warden currently fall through to a school reports dashboard that their role middleware rejects, producing a 403 rather than a usable landing page. Driver also has no usable landing path, and transport policies intentionally deny the role until an explicit driver-assignment workflow exists.
3. Receptionist has existing permissions and policy-backed Student and Communication workflows, and Warden has existing permission and policy-backed Hostel read workflows. Both are disconnected only at the route-group and navigation/landing layers.
4. The Super Admin dashboard currently exposes school, user, student, staff, revenue, subscription, package, coupon, school-growth, revenue-trend, status, package-distribution, recent-school, expiring-subscription, and recent-user data. It does not expose counts for the existing academic, operations, communication, finance, HR, CMS, or lead domains, so it does not yet represent the full SaaS platform.
5. `SchoolAdmin\\ReportController::superAdminDashboard()` is a second, incomplete Super Admin dashboard calculation. The explicit `super-admin.dashboard` route uses `SuperAdmin\\DashboardController`; the duplicate method is not a valid platform dashboard and is unsafe for a Super Admin with no tenant context.
6. No static Inertia render target is missing a corresponding `resources/js/Pages/**/*.tsx` file: 106 statically named render targets were found and all resolve. The page glob `./Pages/**/*.tsx` covers the 107 page files currently present.
7. The app mount is healthy: `@inertia` emits the root element, `createRoot(el)` mounts the Inertia app, and `app.blade.php` includes the CSS and TypeScript Vite entries. `HandleInertiaRequests` supplies auth, flash, branding, and favicon props with database-failure fallbacks; no shared-prop failure was found.
8. React errors are not swallowed by Suspense or a null layout. The root `ErrorBoundary` renders a visible runtime-error panel. `createInertiaApp` resolves pages through the standard Laravel Vite glob helper. No Suspense boundary or layout returning `null` was found.

## Authoritative role matrix before repair

| Role | Seeded permissions/workflows | Current landing | Current result | Audit decision |
| --- | --- | --- | --- | --- |
| Super Admin | All seeded permissions; platform administration | `/super-admin/dashboard` | Valid | Complete after platform metrics expansion |
| School Admin | Full school administration | `/school/reports/dashboard` | Valid | Preserve |
| Principal | Read/report/approval school workflows | `/school/reports/dashboard` | Valid | Preserve |
| Teacher | Teaching, attendance, marks, homework, reports | `/school/reports/dashboard` | Valid | Preserve |
| Accountant | Fees, expenses, payroll, reports | `/school/reports/dashboard` | Valid | Preserve |
| Librarian | Library and limited student/staff viewing | `/school/library/books` | Valid | Preserve |
| Store Manager | Inventory workflows | `/school/inventory/items` | Valid | Preserve |
| Student | Student portal policies and pages | `/school/student/dashboard` | Valid; linked-state empty state is intentional | Preserve |
| Parent | Parent portal policies and pages | `/school/parent/dashboard` | Valid; linked-state empty state is intentional | Preserve |
| Receptionist | `students.view`, `students.create`, announcement view, message view/send | Falls through to `/school/reports/dashboard` | 403 because role is excluded from the school route group | Wire existing student/communication pages only |
| Warden | Student view, hostel view/attendance | Falls through to `/school/reports/dashboard` | 403 because role is excluded from the school route group | Wire existing read-only hostel pages only |
| Driver | Transport view/attendance permission | Falls through to `/school/reports/dashboard` | No supported page: transport policies explicitly reject unmapped drivers | Keep intentionally hidden and fail closed; do not bypass policy |

The role list is sourced from `AdminSeeder` and `RolePermissionSeeder`, not from the illustrative role names in the brief.

## Route and middleware map

- Guest/public website and authentication routes are separate from authenticated application routes.
- `/dashboard` is a role-switch redirect. Before repair, its default branch points to the school reports dashboard even for roles that cannot enter the school route group.
- The school route group is protected by `auth` and `role:super-admin|school-admin|principal|teacher|accountant|librarian|store-manager`, which is the direct cause of the Receptionist/Warden landing failure and the intentional exclusion of Driver.
- Student and Parent portals have dedicated role middleware and dedicated controller/page trees.
- Super Admin has a dedicated `role:super-admin` route group and dedicated controller/page tree.
- Controller methods and policies provide the finer-grained tenant and permission boundaries. Existing security tests cover cross-tenant access, policy denial, platform administration, finance, library/inventory, operations, transport/communication, student/staff, and route authorization.

## Controller, layout, and page map

### Controller domains

- Authentication/account: Auth controllers, `ProfileController`, `OnboardingController`, `BillingController`.
- School operations: School Admin controllers for students, staff, classes, sections, subjects, shifts, holidays, attendance, timetable, examinations, fees, HR/payroll, library, inventory/assets, transport, hostel, homework, communication, admissions, settings, integrations, and reports.
- Portals: `StudentPortalController`, `ParentPortalController`.
- Platform: Super Admin dashboard, schools, users, packages, subscriptions, coupons, module manager, settings, and website CMS controllers.
- Public/marketing: `PublicWebsiteController`, `PublicAdmissionController`.

### Layouts and bootstrap

- Authenticated pages use `resources/js/Layouts/AppLayout.tsx`, which owns the sidebar, topbar, breadcrumb fallback, mobile drawer, and content shell.
- Auth pages use `resources/js/Layouts/AuthLayout.tsx`.
- `resources/js/app.tsx` has one React/Vite bootstrap, one `createInertiaApp`, and one `import.meta.glob('./Pages/**/*.tsx')` resolver.
- `resources/views/app.blade.php` uses the Inertia root directive and the two Vite assets. No duplicate mount was found.
- No duplicate authenticated layout or duplicate page resolver was found. `Pages/Dashboard.tsx` is a generic fallback page component but has no competing controller route in the current map.

## Dashboard verification

### School dashboard

`ReportController@dashboard` dispatches to the existing role-aware school dashboard data for School Admin/Principal, Teacher, and Accountant. The report dashboard page exists and its metric links point to registered routes. Librarian and Store Manager use their module workspace as their landing page because no dedicated dashboard controller/page exists for either role.

### Student and Parent dashboards

Both portal controllers and all portal pages resolve. They intentionally render a visible unlinked-record empty state when the account is not connected to a student/guardian record; that state is not a white screen or authorization failure.

### Super Admin dashboard

The current `SuperAdmin\\DashboardController` is the authoritative route target. Existing models provide enough data to expose platform-level domain metrics without adding persistence:

- Schools, users, students, staff, subscriptions, packages, coupons, subscription payments/audit logs.
- Admissions, attendance, homework/submissions, examinations/marks.
- Library books/issues, inventory items/issues, transport vehicles/routes, hostels/allocations.
- Finance fee payments, payroll.
- Messages, announcements, school notifications.
- Website pages and website leads, including lead type/status distributions.

The following brief examples have no complete source in the repository and therefore must remain documented as unavailable rather than fabricated: queue health, cache health, disk/storage usage, security-alert workflow, support requests, consultation requests, and a normalized analytics/event pipeline. MRR/ARR and trial conversion can only be shown when derived from the existing subscription/package fields with an explicit label; raw fee collection is not SaaS revenue.

## Discoverability and hidden-workflow findings

### Existing workflows hidden by missing navigation/role wiring

- Receptionist student admission/list and communication workflows.
- Warden hostel overview, rooms, and allocations read workflows.
- Super Admin platform domain statistics beyond the original KPI cards.
- Existing nested detail/action pages are intentionally page-local: student/staff detail, exam marks/results, hostel rooms, transport assignments, inventory asset detail/maintenance, payslips, receipts, and publish/suspend/activate actions.

### Intentionally hidden or not independently navigable

- Roles not present in the seeders; no role implementation may be inferred from the brief’s examples.
- Driver transport pages: the existing `isNotUnmappedDriver` policy guard fails closed because no explicit driver-to-vehicle/route assignment implementation exists.
- Migrations, models, policies, seeders, service classes, and permission definitions are implementation layers, not destinations.
- `academic-years.*` permissions have no controller/page implementation.
- `BookReservation` has a model/policy but no controller/page workflow.
- Website media, menu, menu-item, page-section, redirect, and lead management persistence has no complete admin UI. Contact submissions reach `WebsiteLead` through the public endpoint; a lead-management screen is not invented.
- Several granular permissions (imports, promotions, report-card generation, transport/hostel attendance, website media/leads/settings, and similar) have no complete standalone workflow. They remain authorization primitives until an existing implementation is found.
- Queue/cache/disk/system/security/support/consultation/analytics metrics are not represented by completed backend modules and are excluded from implementation.

## White-screen/runtime findings

| Check | Result |
| --- | --- |
| Blade root mount | Healthy: Inertia directive present |
| Vite entries | One CSS entry and one TSX entry in `app.blade.php` |
| Inertia resolver | Standard helper + recursive glob; all static render targets resolve |
| Shared props | Auth/flash/branding/favicon guarded against missing tenant/database settings |
| Error swallowing | No Suspense; root ErrorBoundary visibly renders runtime errors |
| Null layout | None found in authenticated or auth layouts |
| Duplicate React entrypoint | None found |
| Duplicate layout system | None found |

## Recommended integration strategy

1. Keep the current Laravel, Inertia, React, Vite, authentication, tenant scope, policy, and permission systems.
2. Expand only the existing school route role middleware for Receptionist and Warden, whose existing controllers and policies already support the requested workflows.
3. Add role-specific landing redirects and sidebar items for those two roles. Keep each item aligned with an existing policy-backed route.
4. Change the generic fallback for unsupported roles so it does not redirect into a forbidden school dashboard. Keep Driver’s transport access fail-closed until an explicit assignment workflow exists.
5. Expand the authoritative Super Admin dashboard controller/page using counts and distributions from existing models only. Do not expose tenant-scoped school routes to Super Admin without a tenant context.
6. Leave the duplicate legacy Super Admin calculation out of the active route; remove it only if tests and references confirm no dependency.
7. Add role landing/access regression coverage and rerun the complete test/build/route/static-link validation suite.

## Phase 1 conclusion

The verified root causes are disconnected role wiring for Receptionist/Warden, an unsafe generic landing fallback for unsupported roles, and an incomplete authoritative Super Admin metric surface. The Inertia runtime, mount, resolver, shared props, layouts, and page files are not the cause of a blank dashboard.
