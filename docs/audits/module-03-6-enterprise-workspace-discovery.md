# EduFlow Module 03.6 — Enterprise Workspace Discovery, Navigation & Dashboard Audit

Date: 2026-08-14  
Mode: repository-first, verification-first, production audit

## Executive outcome

The repository contains a substantial Laravel 13 + Inertia React SaaS implementation. The principal discoverability defects found in this pass were disconnected operational roles and an incomplete platform intelligence surface—not missing controllers or missing React pages.

Implemented in this pass:

- Receptionist and Warden now have reachable workspace landings through the existing Student and Hostel workflows.
- The authenticated school route group includes Receptionist and Warden, while Driver remains intentionally fail-closed.
- Sidebar entries now expose the restored role workspaces and remove the existing Messages link from roles without `messages.view`.
- Student and Hostel pages hide create/update/delete/allocate controls for roles whose existing policies do not authorize those actions.
- Super Admin dashboard now exposes repository-backed metrics across Academic, Admissions, Finance, Learning, Library, Inventory, Transport, Hostel, Communication, and Website domains, plus a real attention queue.

No new model, migration, permission, controller, route family, or duplicate dashboard was created.

## 1. Complete repository inventory

| Surface | Verified inventory |
|---|---:|
| Laravel routes | 301 registered non-vendor routes |
| Eloquent models | 70 files |
| Policies | 43 files, including tenant-aware policy concerns |
| Controllers | 51 files, including school, platform, portal, auth, and public controllers |
| React page files | 107 `.tsx` files |
| Seeded roles | 12: super-admin, school-admin, principal, teacher, accountant, librarian, receptionist, driver, warden, store-manager, student, parent |
| Migrations | SaaS foundation, school operations, portals, CMS, billing, permissions, and activity logging |
| Tests | Feature and unit security coverage, SaaS acquisition, CMS, tenancy, and authorization suites |

Implemented domains found in source include authentication, onboarding, billing, platform schools/users/packages/subscriptions/coupons/module management/settings, website CMS pages, school setup, students, staff, academics, exams, attendance, timetable, fees, HR/payroll, homework, library, inventory/assets, transport, hostel, communication, admissions, reports, student portal, and parent portal.

## 2. Workspace architecture report

| Workspace | Existing shell | Existing landing | Status |
|---|---|---|---|
| Platform | `AppLayout` + role-filtered sidebar | `super-admin.dashboard` | Connected; platform metrics expanded |
| School | `AppLayout` + school navigation | `school.reports.dashboard` | Connected for school-admin, principal, teacher, accountant |
| Student Portal | `AppLayout` + student navigation | `student.dashboard` | Connected; linked-record empty state is intentional |
| Parent Portal | `AppLayout` + parent navigation | `parent.dashboard` | Connected; linked-record empty state is intentional |
| Receptionist | Existing `AppLayout` and Student/Communication pages | `school.students.index` | Reconnected in this pass |
| Warden | Existing `AppLayout` and Hostel pages | `school.hostel.index` | Reconnected in this pass |
| Librarian | Existing Library workspace page | `school.library.books.index` | Connected |
| Store Manager | Existing Inventory workspace page | `school.inventory.items` | Connected |
| Public Website | Public CMS renderer and public pages | `home` / CMS page resolver | Connected; public CMS gaps remain documented separately |
| Authentication | `AuthLayout` | login/register/password flows | Connected |
| Driver | No supported assignment workflow | none | Intentionally fail-closed; no bypass added |

There is one active Inertia bootstrap and one authenticated layout. No duplicate layout, page resolver, or dashboard route was introduced.

## 3. Feature discoverability report

Most completed CRUD and workflow destinations have an existing sidebar or are correctly page-local actions. Nested detail, export, publish, assign, approve, return, and delete endpoints are intentionally not independent workspace destinations.

Reconnected features:

- Receptionist: student records, student admission, announcements, messages, notifications.
- Warden: hostel overview, hostel allocations, room viewing, notifications.
- Super Admin: cross-domain platform visibility and attention metrics.

Features intentionally not promoted because no complete destination exists:

- Academic-year management: persistence and permissions exist, but no controller/page workflow.
- Book reservations: model and policy exist, but no controller/page workflow.
- Website media, menus, sections, redirects, and lead-management screens: persistence exists, but only the existing page CRUD/publish workflow is complete.
- Permission-only capabilities such as imports, promotions, ID cards, result locks/publication, fee waivers, expenses, performance, transport/hostel attendance, and website media/leads/settings where no standalone workflow exists.

## 4. Sidebar audit

The sidebar uses a single role-filtered navigation definition, Lucide icons, active-state matching, collapsed tooltips, mobile drawer support, and desktop collapse behavior.

Corrective findings:

- Restored Receptionist and Warden workspace entries.
- Added their existing authorized Student, Hostel, Announcement, and allocation destinations.
- Removed the existing Messages entry from Accountant and Librarian because their seeded roles do not have `messages.view`.
- Kept Driver out of the sidebar because the transport policy intentionally rejects unmapped drivers.
- Kept tenant-specific school administration out of the Super Admin sidebar; platform administration remains aggregate and tenant-safe.

Remaining sidebar limitation: visibility is role-based rather than fully permission-derived. Backend route and policy authorization remains authoritative, and page-level action visibility was tightened for the affected roles.

## 5. Dashboard audit

### Platform dashboard

The authoritative `SuperAdmin\\DashboardController` now reports real counts from existing models for:

- Academic: students, staff, attendance, exams, marks, homework.
- Admissions: inquiries.
- Finance: fee payments and payroll records.
- Library: books and issues.
- Inventory: items and issues.
- Transport: vehicles and routes.
- Hostel: hostels and allocations.
- Communication: announcements and messages.
- Website: published pages and leads.

The attention queue derives from existing persisted statuses: admission follow-up, pending/partial/overdue fee payments, submitted homework, overdue library issues, pending leave requests, and subscriptions expiring within 30 days. No placeholder or hardcoded business metric was introduced.

### School and portal dashboards

The existing role-aware school dashboard, student portal, and parent portal remain in use. Student and Parent unlinked-record states remain visible empty states rather than fabricated KPIs.

## 6. Role matrix audit

| Role | Workspace / landing | Result |
|---|---|---|
| Super Admin | Platform / `/super-admin/dashboard` | Connected |
| School Admin | School / `/school/reports/dashboard` | Connected |
| Principal | School / `/school/reports/dashboard` | Connected |
| Teacher | School / `/school/reports/dashboard` | Connected |
| Accountant | School / `/school/reports/dashboard` | Connected |
| Librarian | Library / `/school/library/books` | Connected |
| Store Manager | Inventory / `/school/inventory/items` | Connected |
| Student | Student Portal / `/school/student/dashboard` | Connected |
| Parent | Parent Portal / `/school/parent/dashboard` | Connected |
| Receptionist | Student Records / `/school/students` | Reconnected |
| Warden | Hostel / `/school/hostel` | Reconnected |
| Driver | None | Intentionally fail-closed pending assignment workflow |

No roles from illustrative requirements were invented beyond the 12 roles present in the seeders.

## 7. Navigation and route audit

- `php artisan route:list --except-vendor` passed and reported 301 routes.
- Restored landings resolve to named routes `school.students.index` and `school.hostel.index`.
- The generic authenticated fallback no longer redirects unsupported roles into a route they cannot enter; it returns a clear 403.
- All static sidebar destinations inspected in the existing visibility audit resolve to registered GET routes.
- Public, platform, school, student, parent, billing, profile, and authentication route groups remain separated.

## 8. Permission and security audit

- Tenant isolation remains enforced through `BelongsToSchool`, `SchoolScope`, controller authorization, and policies.
- Super Admin remains restricted to platform routes and aggregate metrics; no tenant-specific editing screen was exposed without tenant context.
- Receptionist access is limited by existing `students.view`, `students.create`, `announcements.view`, `messages.view`, and `messages.send` permissions and policies.
- Warden access is limited by existing `students.view`, `hostel.view`, and `hostel.attendance` permissions; mutation controls are hidden and mutation policies still deny unauthorized requests.
- Driver remains excluded from the school route group and sidebar.
- No new permission, policy bypass, mass-assignment surface, upload surface, or tenant query path was added.

## 9. Performance audit

The existing Super Admin dashboard uses aggregate counts, bounded trend windows, eager loading for displayed relationships, and limited result sets for recent/top lists. The new platform metrics are count-only queries over existing tables. No per-row aggregate loop or unbounded list was added.

Known follow-up: the broader application still contains several dashboard trend loops that issue one aggregate query per time bucket. They are bounded and functional, but can be consolidated into grouped queries in a dedicated performance pass.

## 10. Hidden feature report

Confirmed hidden or disconnected before this pass:

- Receptionist and Warden existing workflows were blocked by route middleware and missing landing/navigation entries.
- Super Admin lacked cross-domain visibility despite existing models and controllers.

Intentionally hidden or incomplete:

- Driver transport workspace without an explicit driver-to-route assignment workflow.
- Academic-year, book-reservation, and partial CMS persistence without complete user workflows.
- Platform health metrics for queues, cache, storage, security alerts, support, consultation, and normalized analytics because no authoritative implementation exists.

## 11. Orphan route report

No orphaned primary workspace landing route was found after the reconnection. Nested routes remain page-local by design. The transport assignments page is reachable from the existing route/transport workflow through route-specific assignment links, not a global sidebar destination.

The disconnected `resources/views/welcome.blade.php` remains a legacy starter view and is not an active application route; it was not deleted because it is outside this discoverability fix.

## 12. Orphan page report

Static Inertia render targets resolve to existing React pages. The repository contains 107 page files and no missing static render target was identified in the prior page-resolution audit. Some page files represent nested workflows and therefore do not need standalone sidebar entries.

## 13. Reconnected features report

| Feature | Existing implementation reused | Integration change |
|---|---|---|
| Receptionist student workspace | StudentController, StudentPolicy, Students pages | Role middleware, landing redirect, sidebar entry, action gating |
| Receptionist communication | CommunicationController, AnnouncementPolicy, MessagePolicy | Sidebar visibility aligned with seeded permissions |
| Warden hostel workspace | HostelController, Hostel policies, Hostel pages | Role middleware, landing redirect, sidebar entry, action gating |
| Platform intelligence | Existing models and authoritative Super Admin dashboard | Aggregate metric and attention payloads plus dashboard widgets |

## 14. Remaining gaps

1. Complete the full Laravel suite in an environment where the command does not hang; the current full-suite attempt exceeded four minutes without output and was stopped. Focused route authorization passed.
2. Add a permission-derived navigation contract if future roles or permission combinations require more granularity than the current seeded role model.
3. Add a complete driver assignment/read-only transport workflow before exposing Driver navigation.
4. Build standalone workflows only when product requirements and existing domain contracts justify academic-year, reservations, website leads/media/menus, and platform audit/health surfaces.
5. Consolidate bounded dashboard trend queries and add request-level performance instrumentation.
6. Add browser-level verification for mobile drawer, collapsed sidebar, active states, and role-specific rendered menus.

## 15. Validation evidence

| Check | Result |
|---|---|
| PHP syntax: routes and Super Admin controller | Passed |
| Laravel route list | Passed; 301 routes |
| `npm run build` | Passed; Vite production build completed |
| Focused route authorization | Passed; 20 tests, 86 assertions |
| `git diff --check` | Passed; only line-ending normalization warnings |
| Full `php artisan test` | Timed out locally without output; not claimed as passed |

## 16. Production readiness score

**82/100 for workspace discoverability and navigation integration.**

The score reflects complete role/workspace reconnection for all supported seeded roles, route and build validation, policy-preserving action gating, and cross-domain platform metrics. It is not a claim that the entire SaaS product is production-ready: the full suite still needs a clean run, several persistence-only domains lack complete workflows, browser QA remains outstanding, and performance hardening is a separate follow-up.

Module 04 should remain blocked until the full-suite run, browser verification, and the remaining intentional gaps are explicitly accepted or implemented.