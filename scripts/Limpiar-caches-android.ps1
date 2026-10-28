# ─────────────────────────────────────────────────────────────────────────────
# Limpia las cachés que genera la compilación de Android.
#
# ── Por qué existe ──────────────────────────────────────────────────────────
# Gradle crea carpetas con rutas de más de 250 caracteres dentro de
# `frontend\android\...\build` y de `frontend\node_modules\...\build`. OneDrive
# no puede guardar nombres tan largos, así que muestra el aviso "no se puede
# guardar el nombre" una y otra vez.
#
# Estas carpetas NO son código: se vuelven a crear solas la próxima vez que
# compiles la app de Android. Borrarlas no afecta a Worklish (que vive en
# Firebase) ni a CIENCIA COOL (que vive en Cloud Run).
#
# Úsalo después de compilar el APK (o cuando OneDrive empiece a quejarse).
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Continue"
$raiz = $PSScriptRoot
$android = Join-Path $raiz "frontend\android"
$nm = Join-Path $raiz "frontend\node_modules"

if (-not (Test-Path -LiteralPath $android)) {
  Write-Host "No encuentro frontend\android. Ejecuta este script desde la carpeta WORKLISHv3." -ForegroundColor Red
  exit 1
}

$objetivos = @()

foreach ($rel in @("app\build", "capacitor-cordova-android-plugins\build", ".gradle")) {
  $p = Join-Path $android $rel
  if (Test-Path -LiteralPath $p) { $objetivos += $p }
}

if (Test-Path -LiteralPath $nm) {
  # Cachés de Gradle dentro de los paquetes de Capacitor
  $objetivos += (Get-ChildItem -LiteralPath $nm -Recurse -Directory -Force -Filter ".transforms" -ErrorAction SilentlyContinue).FullName
  # Salidas de compilación de los plugins (contienen "intermediates")
  $objetivos += (Get-ChildItem -LiteralPath $nm -Recurse -Directory -Force -Filter "build" -ErrorAction SilentlyContinue |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "intermediates") }).FullName
}

$objetivos = $objetivos | Where-Object { $_ } | Sort-Object -Unique

if ($objetivos.Count -eq 0) {
  Write-Host "No hay cachés que borrar. Todo limpio." -ForegroundColor Green
  exit 0
}

$antes = (Get-ChildItem -LiteralPath $raiz -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum

foreach ($t in $objetivos) {
  if (Test-Path -LiteralPath $t) {
    # \\?\ permite borrar rutas de más de 260 caracteres
    cmd /c rd /s /q "\\?\$t" 2>$null
    $estado = if (Test-Path -LiteralPath $t) { "no se pudo borrar" } else { "borrado" }
    Write-Host ("  " + $estado + ": " + $t.Replace($raiz + "\", ""))
  }
}

$despues = (Get-ChildItem -LiteralPath $raiz -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
$liberado = [math]::Round(($antes - $despues) / 1MB, 1)

$largas = @(Get-ChildItem -LiteralPath $raiz -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName.Length -gt 250 })

Write-Host ""
Write-Host ("Espacio liberado: " + $liberado + " MB") -ForegroundColor Cyan
Write-Host ("Rutas de más de 250 caracteres que quedan: " + $largas.Count) -ForegroundColor Cyan
if ($largas.Count -eq 0) {
  Write-Host "OneDrive ya no debería quejarse. Reinícialo para que olvide los errores viejos." -ForegroundColor Green
} else {
  Write-Host "Todavía quedan rutas largas; revisa las carpetas de arriba." -ForegroundColor Yellow
}
