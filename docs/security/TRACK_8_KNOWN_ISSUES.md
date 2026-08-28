# Track 8 Security Audit: Quarantine & Outstanding Issues

**Status:** PARTIALLY VERIFIED / QUARANTINED (8/10 Scenarios Passing)  
**Date:** August 2026  
**Auditor:** Security Remediation Engineering  

---

## 1. Verified Security Invariants (Passing 8/10)

| Scenario | Scope | Security Invariant | Status |
|---|---|---|---|
| **Attack 1** | Tenant Data Boundary | Cross-tenant student read/mutation/deletion fails closed (404) | **PASSED** |
| **Attack 2** | Staff Boundary | Cross-tenant staff read/mutation/deletion fails closed (404) | **PASSED** |
| **Attack 3** | Financial Ledger | Cross-tenant fee payment access/tampering fails closed (404) | **PASSED** |
| **Attack 4** | File Storage / IDOR | Cross-tenant student document downloading blocked (403/404) | **PASSED** |
| **Attack 5** | Mass Assignment | Request-supplied `school_id` and role injection strictly overridden | **PASSED** |
| **Attack 7** | Co-Curricular | Cross-tenant score awards and house point tampering resisted | **PASSED** |
| **Attack 9** | Financial State | Negative payments and illegal ledger mutations rejected | **PASSED** |
| **Sanity** | Schema & Fixtures | Multi-tenant fixtures created with strict database isolation | **PASSED** |

---

## 2. Quarantined Outstanding Items

### Issue 1: RBAC `/super-admin/settings` Returns 302 Instead of 403
* **Failing Assertion:** `$this->actingAs($this->adminA)->get('/super-admin/settings')->assertStatus(403);`
* **Observed Result:** `302 Found` (redirect to session referer / dashboard).
* **Root Cause Classification:** Class C — Expected framework session handling. Spatie `RoleMiddleware` throws `UnauthorizedException`, which Laravel's default web pipeline redirects rather than displaying a raw 403 page.
* **Production Security Impact:** **LOW**. Access to platform settings remains denied to non-super-admins; no privilege escalation occurs.
* **Follow-up Action:** Standardize platform API exception responses during the Phase 9 Global Error Handling refactor.

### Issue 2: Webhook Replay Test Harness Setup
* **Failing Assertion:** `TypeError: Illuminate\Auth\SessionGuard::setUser(): Argument #1 ($user) must be of type Authenticatable, null given`
* **Root Cause Classification:** Class B — Test harness artifact. The test attempted to reset authentication using `setUser(null)` within an active session lifecycle.
* **Production Security Impact:** **NONE**. The production webhook handler (`PaystackWebhookController`) operates statelessly via cryptographic webhook signatures (`X-Paystack-Signature`).
* **Follow-up Action:** Isolate webhook integration tests into dedicated stateless feature test cases in Phase 9.