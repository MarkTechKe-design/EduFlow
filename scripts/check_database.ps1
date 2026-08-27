Write-Host "=== EDUFLOW DATABASE HEALTH CHECK ===" -ForegroundColor Cyan

$tcp3306 = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
if ($tcp3306) {
    $proc = Get-Process -Id $tcp3306[0].OwningProcess -ErrorAction SilentlyContinue
    Write-Host "[OK] Port 3306 is listening." -ForegroundColor Green
    Write-Host "     Process: $($proc.ProcessName) (PID: $($proc.Id))"
    Write-Host "     Path   : $($proc.Path)"
} else {
    Write-Host "[ERROR] Nothing is listening on Port 3306." -ForegroundColor Red
    Write-Host "        Please click 'Start All' in Laragon or start mysqld.exe." -ForegroundColor Yellow
}

php -r "
require 'vendor/autoload.php';
\$app = require_once 'bootstrap/app.php';
\$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
try {
    \$db = Illuminate\Support\Facades\DB::connection();
    \$res = \$db->select('SELECT DATABASE() as db, VERSION() as ver')[0];
    echo '[OK] Laravel Connected to: ' . \$res->db . ' (MySQL ' . \$res->ver . ')' . PHP_EOL;
} catch (\Throwable \$e) {
    echo '[ERROR] Laravel DB Connection Failed: ' . \$e->getMessage() . PHP_EOL;
}
"