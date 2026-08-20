<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\Support\SecurityTestCase;

class AuthenticationSecurityTest extends SecurityTestCase
{
    public function test_a_user_can_log_in_with_valid_credentials(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'email' => 'login@example.test',
            'password' => 'correct-password',
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response
            ->assertRedirect(route('dashboard'))
            ->assertSessionDoesntHaveErrors();

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->last_login_at);
    }

    public function test_invalid_credentials_do_not_authenticate_a_user(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'email' => 'invalid-password@example.test',
            'password' => 'correct-password',
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response
            ->assertRedirect('/login')
            ->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertNull($user->fresh()->last_login_at);
    }

    public function test_login_requires_an_email_and_password(): void
    {
        $response = $this->from('/login')->post('/login', []);

        $response
            ->assertRedirect('/login')
            ->assertSessionHasErrors(['email', 'password']);

        $this->assertGuest();
    }

    public function test_login_regenerates_the_session_id(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'email' => 'session@example.test',
            'password' => 'correct-password',
        ]);

        $this->withSession(['pre_login_marker' => 'present']);
        $sessionIdBeforeLogin = $this->app['session']->getId();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response->assertRedirect(route('dashboard'));

        $this->assertNotSame(
            $sessionIdBeforeLogin,
            $response->getSession()->getId(),
            'The session ID must rotate after authentication.'
        );
        $this->assertSame('present', $response->getSession()->get('pre_login_marker'));
    }

    public function test_remember_me_creates_a_recaller_cookie(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'email' => 'remember@example.test',
            'password' => 'correct-password',
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'correct-password',
            'remember' => true,
        ]);

        $response->assertRedirect(route('dashboard'));
        $response->assertCookie($this->app['auth']->guard()->getRecallerName());
    }

    public function test_successful_login_writes_a_security_activity_log(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'email' => 'activity@example.test',
            'password' => 'correct-password',
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ])->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('activity_log', [
            'description' => 'User logged in',
            'causer_type' => User::class,
            'causer_id' => $user->id,
        ]);
    }

    public function test_logout_invalidates_the_authenticated_session(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school);

        $this->actingAs($user);

        $response = $this->post('/logout');

        $response->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_guests_cannot_access_authenticated_profile_routes(): void
    {
        $this->get('/profile')->assertRedirect(route('login'));
        $this->get('/password/change')->assertRedirect(route('login'));
    }

    public function test_a_user_can_change_their_password_with_the_current_password(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'password' => 'old-password',
        ]);

        $response = $this->actingAs($user)->put('/profile/password', [
            'current_password' => 'old-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response
            ->assertRedirect()
            ->assertSessionHas('success', 'Password changed successfully.');

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }

    public function test_password_change_requires_the_correct_current_password(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'password' => 'old-password',
        ]);

        $response = $this->actingAs($user)->from('/password/change')->put('/profile/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response
            ->assertRedirect('/password/change')
            ->assertSessionHasErrors('current_password');

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_password_change_requires_confirmation_and_a_strong_enough_password(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'password' => 'old-password',
        ]);

        $response = $this->actingAs($user)->from('/password/change')->put('/profile/password', [
            'current_password' => 'old-password',
            'password' => 'short',
            'password_confirmation' => 'different',
        ]);

        $response
            ->assertRedirect('/password/change')
            ->assertSessionHasErrors('password');

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }

    public function test_inactive_users_are_rejected_at_login(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'email' => 'inactive@example.test',
            'password' => 'correct-password',
            'status' => 'inactive',
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response
            ->assertRedirect('/login')
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }

    public function test_suspended_users_are_rejected_at_login(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school, [
            'email' => 'suspended@example.test',
            'password' => 'correct-password',
            'status' => 'suspended',
        ]);

        $response = $this->from('/login')->post('/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response
            ->assertRedirect('/login')
            ->assertSessionHasErrors('email');

        $this->assertGuest();
    }
}
