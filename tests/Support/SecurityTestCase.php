<?php

namespace Tests\Support;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class SecurityTestCase extends TestCase
{
    use CreatesSecurityFixtures;
    use RefreshDatabase;
}
