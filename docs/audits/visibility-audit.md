# EduFlow visibility audit

Date: 2026-08-14

## Scope and method

This audit compared the registered Laravel routes, controller entrypoints, policy and role boundaries, seeded permissions, Inertia pages, dashboard destinations, and the authenticated navigation in `resources/js/components/layout/Sidebar.tsx`.

The audit treats a feature as discoverable when the authorized role can reach it from a sidebar item, dashboard card, page action, account menu, public-site menu, or an intentional workflow redirect. Mutation, export, detail, and confirmation endpoints do not require standalone navigation when their owning page exposes the action.

## Visibility changes made

| Area | Change | Reason |
| --- | --- | --- |
| Role landing | Added valid landing redirects for librarian and store-manager; removed unsupported operational-role destinations | These supported roles now open valid existing workspaces. Receptionist, driver, and warden remain intentionally outside the school route group. |
| Tenant isolation in navigation | Removed tenant-scoped school links from the Super Admin sidebar | Super Admin has no tenant context; those controllers intentionally fail closed. |
| Platform CMS | Added `Website CMS` under the Super Admin Admin group | `SuperAdmin\\WebsitePageController` and its page editor had no navigation entry. |
| Billing | Added Billing for School Admin | The authenticated billing portal existed without an application entrypoint. |
| Academic submodules | Added Staff Attendance, Teacher Schedule, and Grade Scales | These were reachable only from secondary page links. |
| HR submodules | Added Leave Types and Salary Structure | Existing controllers and pages lacked primary navigation. |
| Finance submodules | Added Collect Fees and Outstanding Fees | Existing payment workflows were not independently discoverable. |
| Facility submodules | Added library issues/overdue, transport routes, hostel allocations, and inventory categories/purchases/issues/assets | Existing pages existed but were hidden behind incidental cross-links or were not linked at all. |
| Dashboard cards | Linked authorized student, staff, attendance, finance, outstanding-fee, homework, and accountant-collection metrics to their existing pages | Metrics now act as entrypoints into the corresponding implemented workflows. |
| Breadcrumbs | Added a shared fallback breadcrumb trail in the authenticated topbar | Pages that supplied only a title now still expose a navigable workspace path. |
| Role accuracy | Removed stale links for Accountant Examinations, Principal Library, Principal/Accountant Custom Reports, and other policy-incompatible combinations | The old role-only menu displayed links that the existing policies would reject. |

No new business feature, controller, model, migration, permission, or backend workflow was created.

## Complete feature visibility matrix

### Authentication, account, and tenant lifecycle

| Implemented area | Controller/routes | Page or UI entry | Visibility |
| --- | --- | --- | --- |
| Login, registration, password reset, email verification | `Auth\\LoginController`, `RegistrationController`, `PasswordResetController`; guest auth routes and verification routes | `Pages/Auth/*`; guest auth links and verification flow | Visible by lifecycle state; intentionally absent from authenticated sidebar. |
| Profile and password change | `ProfileController`; `/profile`, `/password/change` | Account dropdown in `Topbar` | Visible to every authenticated user. |
| Onboarding | `OnboardingController`; `/onboarding` | Registration/email-verification redirect | Intentionally flow-driven, not a permanent navigation item. |
| School billing | `BillingController`; `/billing` and package/cancel/reactivate actions | Admin → Billing | Visible to School Admin; actions remain page-local. |
| Role-specific dashboard redirect | The dashboard redirect closure and System workspace items | Visible for every seeded role with a valid existing route; unsupported operational roles remain fail-closed. |

### Public website and marketing platform

| Implemented area | Controller/routes | Page or UI entry | Visibility |
| --- | --- | --- | --- |
| Public home, About, Features, Pricing, FAQ, Privacy, Terms, contact | `PublicWebsiteController`; guest routes and catch-all public route | Public website navigation/footer | Public by design; not part of the authenticated sidebar. |
| Public admission form | `PublicAdmissionController`; `/apply/{school}` | Public website CTA and school application link | Public by design. |
| Website page CMS | `SuperAdmin\\WebsitePageController`; `/super-admin/website/pages` | Super Admin → Website CMS | Now visible to Super Admin. |
| Page publishing/archive actions | Same CMS controller, POST/PUT/PATCH/DELETE routes | CMS row actions and editor | Visible as page-local actions, not standalone menu items. |

### Platform administration

| Feature/page | Controller | Entry point and roles |
| --- | --- | --- |
| Platform dashboard | `SuperAdmin\\DashboardController` | System → Dashboard; Super Admin |
| Schools, create, edit, show, suspend, activate | `SuperAdmin\\SchoolController` | System → Schools; create/edit/detail are list actions |
| Platform users and user actions | `SuperAdmin\\UserManagementController` | Admin → All Users; row actions |
| Packages | `SuperAdmin\\PackageController` | Subscription → Packages |
| Subscriptions | `SuperAdmin\\SubscriptionController` | Subscription → Subscriptions |
| Coupons | `SuperAdmin\\CouponController` | Subscription → Coupons |
| Module manager | `SuperAdmin\\ModuleManagerController` | Subscription → Module Manager |
| Platform settings | `SuperAdmin\\SettingsController` | Admin → Platform Settings |

### School operations

| Feature/page | Controller/page | Entry point and roles |
| --- | --- | --- |
| Classes, sections, subjects, shifts, holidays | Corresponding School Admin controllers and pages | School Setup; School Admin and Principal |
| Students, admission, edit, detail, documents | `StudentController`; `Students/*` | Academic → Students; secondary create/edit/detail/document actions |
| Staff, create, edit, detail, documents | `StaffController`; `Staff/*` | Academic → Staff; secondary actions |
| Student timetable and teacher schedule | `TimetableController`; `Timetable/*` | Academic → Timetable and Teacher Schedule |
| Student and staff attendance | `AttendanceController`; `Attendance/*` | Academic → Attendance and Staff Attendance |
| Examinations, marks, results, grade scales | `ExamController`; `Exams/*` | Academic → Examinations and Grade Scales; exam row actions open marks/results |
| Departments and designations | `DepartmentController`, `DesignationController` | HR Setup |
| Leave types and leave requests | `LeaveController`; `HR/LeaveTypes`, `HR/Leaves` | HR Setup |
| Salary structure, payroll, payslip | `PayrollController`; `HR/*` | HR Setup; payslip is a payroll row action |
| Fee categories and structures | `FeeCategoryController`, `FeeStructureController` | Finance |
| Fee payments, collect, outstanding, receipt | `FeePaymentController`; `Fees/*` | Finance; collect/outstanding are now primary links and receipt is a payment row action |
| Homework and submissions | `HomeworkController`; `Homework/*` | Learning → Homework; submissions are homework row actions |
| Lesson plans, syllabi, online classes | `HomeworkController`; corresponding pages | Learning |
| Library books, issues, overdue | `LibraryController`; `Library/*` | Facilities → Library Books, Issues, Overdue; book/issue actions remain page-local |
| Inventory categories, items, purchases, issues, assets, maintenance | `InventoryController`, `AssetController`; `Inventory/*` | Facilities; asset detail and maintenance are asset row actions |
| Transport vehicles, routes, assignments | TransportController; Transport pages | Facilities → Transport Fleet and Routes for School Admin; assignments are route row actions |
| Hostel, rooms, allocations | HostelController; Hostel pages | Facilities → Hostel and Hostel Allocations for School Admin; rooms are hostel row actions |
| Admissions inquiries and visitors | AdmissionInquiryController, VisitorLogController | Admissions; School Admin and Principal |
| Announcements, messages, blast, email templates, notifications | `CommunicationController`; `Communication/*` | Communication |
| School settings and integrations | `SchoolAdmin\\SettingsController`, `IntegrationController` | Admin → School Settings and Integrations; School Admin |
| School user/admin management | `SchoolUserController` | Admin → Manage Users; School Admin |

### Reporting and portals

| Feature/page | Controller/page | Entry point |
| --- | --- | --- |
| Role-aware reports dashboard | `ReportController@dashboard`; `Reports/Dashboard` | System → Dashboard for School Admin, Principal, Teacher, Accountant |
| Attendance, academic, finance reports | `ReportController`; `Reports/Attendance`, `Academic`, `Finance` | Reports group, limited to roles whose existing policy grants the report |
| Custom report builder and exports | `ReportController`; `Reports/CustomBuilder` plus export routes | Reports → Custom Report for School Admin; run/export are page actions |
| Audit log | `ReportController`; `Reports/AuditLog` | Reports → Audit Log for School Admin |
| Student portal dashboard and pages | `StudentPortalController`; `Student/*` | Student workspace and My Academic/My Finance/School Info |
| Parent portal dashboard and pages | `ParentPortalController`; `Parent/*` | Parent workspace and My Children |

## Implemented persistence and permission layers

The following model/migration domains are represented in UI through the matrix above: users and permissions; schools and academic years; classes, sections, subjects, shifts, holidays; guardians, students, student documents; departments, designations, staff, staff documents; attendance and timetables; grade scales, exams, marks; fee categories, structures, payments; leave types/requests; salary structures/payroll; announcements, email templates, messages, notifications; books, issues, reservations; inventory categories/items/purchases/issues; assets and maintenance logs; vehicles, transport routes and student assignments; hostels, rooms and allocations; homework, submissions, lesson plans, syllabi, online classes; packages, package modules, subscriptions, subscription payments/audit logs, coupons; school/platform settings; admissions inquiries/follow-ups and visitors; and website pages, sections, menus, menu items, media, leads, and redirects.

Models and migrations are not independently navigable features. They become visible through the owning controller/page or remain persistence-only when no controller/page exists.

## Intentionally hidden or non-standalone implementation

These items were not promoted to new UI because there is no completed controller/page workflow to expose, or because they are implementation primitives rather than user destinations:

- Database migrations, Eloquent models, policies, service classes, providers, seeders, and route mutation endpoints.
- Academic-year persistence and seeded `academic-years.*` permissions: no controller, route, or page exists.
- `BookReservation` and its policy: persistence/policy exists, but there is no reservation controller, route, or page.
- Website media, menu, menu-item, page-section, lead, and redirect models: CMS persistence exists, but only the existing page CRUD/publish workflow is implemented. No unsupported management screens were invented.
- `WebsiteLead` collection is reached through the public contact POST endpoint; there is no completed admin lead-management page.
- Seeded but currently unconsumed permission capabilities: `users.impersonate`, `students.import`, `students.promote`, `students.idcard`, `marks.import`, `results.publish`, `results.lock`, `reportcard.generate`, `fees.waiver`, `fees.online`, `expenses.view`, `staff.performance`, `transport.attendance`, `hostel.attendance`, `website.media`, `website.leads`, and `website.settings`. These remain permission definitions without a complete standalone route/page workflow.
- Export/download endpoints, publish/suspend/activate/delete endpoints, nested detail routes, and form POST/PUT/PATCH/DELETE endpoints are intentionally page-local actions rather than sidebar destinations.
- Receptionist, driver, and warden are seeded roles but are intentionally hidden from the authenticated school sidebar because the current school route middleware excludes them. Driver transport access also fails closed in the existing transport policy until an explicit supported assignment workflow exists. No new route or permission bypass was introduced.
- Guest authentication and public marketing pages are intentionally outside authenticated navigation.

## Validation evidence

- `php artisan route:list --except-vendor` completed successfully.
- Every static sidebar/dashboard destination was compared with the route table: **78 destinations passed**.
- Role landing destinations for Super Admin, School Admin/Principal/Teacher/Accountant, Student, Parent, Librarian, Store Manager, Billing, and Website CMS all resolve to registered GET routes. Unsupported operational roles remain intentionally fail-closed.
- `npm run build` passed after the visibility changes.
- php artisan test passed: 201 tests, 1,122 assertions.
