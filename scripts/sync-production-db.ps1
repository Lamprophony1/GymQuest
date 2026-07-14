[CmdletBinding()]
param(
    [string]$SshTarget = 'gc@10.4.28.21',
    [string]$RemoteDatabasePath = '/opt/gymquest/data/gymchall.db',
    [ValidateRange(1, 300)]
    [int]$BusyTimeoutSeconds = 15,
    [switch]$PreflightOnly
)

$ErrorActionPreference = 'Stop'

function Assert-SafeSshTarget {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw 'SshTarget no puede estar vacio.'
    }

    if ($Value -notmatch '^[A-Za-z0-9][A-Za-z0-9_.@-]*$') {
        throw "SshTarget contiene caracteres no permitidos: '$Value'. Use un alias SSH o usuario@host."
    }
}

function Assert-SafeRemotePath {
    param([string]$Value)

    if ($Value -notmatch '^/[A-Za-z0-9._/-]+$') {
        throw "RemoteDatabasePath debe ser un path POSIX absoluto sin espacios: '$Value'."
    }

    $segments = $Value.Split('/', [System.StringSplitOptions]::RemoveEmptyEntries)
    if ($segments -contains '..' -or $segments -contains '.') {
        throw "RemoteDatabasePath no puede contener segmentos '.' o '..': '$Value'."
    }

    if ($Value.EndsWith('/')) {
        throw "RemoteDatabasePath debe apuntar a un archivo: '$Value'."
    }
}

function Get-RequiredCommandPath {
    param([string]$Name)

    $command = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $command) {
        throw "No se encontro '$Name' en PATH. Instale/active OpenSSH Client antes de continuar."
    }

    return $command.Source
}

function Invoke-SshScript {
    param(
        [string]$SshPath,
        [string]$Target,
        [string]$Script,
        [string]$Operation
    )

    $normalizedScript = $Script.Replace("`r`n", "`n").Replace("`r", "`n").TrimEnd("`n") + "`n"
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $SshPath
    $startInfo.Arguments = "$Target sh -s"
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo

    try {
        if (-not $process.Start()) {
            throw 'No se pudo iniciar el proceso SSH.'
        }

        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $process.StandardInput.Write($normalizedScript)
        $process.StandardInput.Close()
        $process.WaitForExit()
        $stdoutTask.Wait()
        $stderrTask.Wait()

        $exitCode = $process.ExitCode
        $output = @()
        if (-not [string]::IsNullOrWhiteSpace($stdoutTask.Result)) {
            $output += @($stdoutTask.Result -split '\r?\n' | Where-Object { $_ -ne '' })
        }
        if (-not [string]::IsNullOrWhiteSpace($stderrTask.Result)) {
            $output += @($stderrTask.Result -split '\r?\n' | Where-Object { $_ -ne '' })
        }
    }
    finally {
        $process.Dispose()
    }
    $lines = @($output | ForEach-Object { $_.ToString() })

    if ($exitCode -ne 0) {
        $detail = ($lines -join [Environment]::NewLine).Trim()
        if ([string]::IsNullOrWhiteSpace($detail)) {
            $detail = "ssh termino con exit code $exitCode."
        }

        throw "$Operation fallo: $detail"
    }

    return $lines
}

function Get-MetadataMap {
    param([string[]]$Lines)

    $result = @{}
    foreach ($line in $Lines) {
        $separator = $line.IndexOf('=')
        if ($separator -le 0) {
            continue
        }

        $key = $line.Substring(0, $separator).Trim()
        $value = $line.Substring($separator + 1).Trim()
        $result[$key] = $value
    }

    return $result
}

function Assert-FileUnlocked {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return
    }

    try {
        $stream = [System.IO.File]::Open(
            $Path,
            [System.IO.FileMode]::Open,
            [System.IO.FileAccess]::Read,
            [System.IO.FileShare]::None)
        $stream.Dispose()
    }
    catch {
        throw "El archivo '$Path' esta en uso. Detenga la API local y vuelva a ejecutar la sincronizacion."
    }
}

function Remove-FileIfPresent {
    param([string]$Path)

    if (Test-Path -LiteralPath $Path -PathType Leaf) {
        Remove-Item -LiteralPath $Path -Force
    }
}

function Remove-FileBestEffort {
    param([string]$Path)

    try {
        Remove-FileIfPresent -Path $Path
    }
    catch {
        Write-Warning "No se pudo limpiar el temporal '$Path': $($_.Exception.Message)"
    }
}

function Get-GitValue {
    param(
        [string]$Root,
        [string[]]$Arguments,
        [string]$Fallback
    )

    try {
        $git = Get-Command 'git' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -eq $git) {
            return $Fallback
        }

        $value = (& $git.Source -C $Root @Arguments 2>$null)
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace("$value")) {
            return $Fallback
        }

        return "$value".Trim()
    }
    catch {
        return $Fallback
    }
}

function Assert-PathInsideRoot {
    param(
        [string]$Path,
        [string]$Root
    )

    $fullPath = [System.IO.Path]::GetFullPath($Path)
    $fullRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd(
        [System.IO.Path]::DirectorySeparatorChar,
        [System.IO.Path]::AltDirectorySeparatorChar)
    $prefix = $fullRoot + [System.IO.Path]::DirectorySeparatorChar

    if (-not $fullPath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "El path '$fullPath' queda fuera de la raiz permitida '$fullRoot'."
    }

    return $fullPath
}

Assert-SafeSshTarget -Value $SshTarget
Assert-SafeRemotePath -Value $RemoteDatabasePath

$ssh = Get-RequiredCommandPath -Name 'ssh'
$scp = Get-RequiredCommandPath -Name 'scp'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localDatabasePath = Assert-PathInsideRoot -Path (Join-Path $repoRoot 'gymchall.db') -Root $repoRoot
$localWalPath = Assert-PathInsideRoot -Path "$localDatabasePath-wal" -Root $repoRoot
$localShmPath = Assert-PathInsideRoot -Path "$localDatabasePath-shm" -Root $repoRoot
$artifactRoot = Assert-PathInsideRoot -Path (Join-Path $repoRoot '.artifacts\production-db') -Root $repoRoot
$incomingDirectory = Assert-PathInsideRoot -Path (Join-Path $artifactRoot 'incoming') -Root $repoRoot
$manifestPath = Assert-PathInsideRoot -Path (Join-Path $artifactRoot 'last-sync.json') -Root $repoRoot

$remoteDirectoryEnd = $RemoteDatabasePath.LastIndexOf('/')
$remoteDatabaseDirectory = $RemoteDatabasePath.Substring(0, $remoteDirectoryEnd)
$remoteSnapshotDirectory = "$remoteDatabaseDirectory/.gymchall-sync"
$timeoutMilliseconds = $BusyTimeoutSeconds * 1000

$preflightScript = @"
set -eu
db='$RemoteDatabasePath'
command -v sqlite3 >/dev/null 2>&1 || { echo 'sqlite3 no esta instalado en la VM.' >&2; exit 10; }
command -v sha256sum >/dev/null 2>&1 || { echo 'sha256sum no esta disponible en la VM.' >&2; exit 11; }
command -v stat >/dev/null 2>&1 || { echo 'stat no esta disponible en la VM.' >&2; exit 12; }
command -v docker >/dev/null 2>&1 || { echo 'docker no esta disponible en la VM.' >&2; exit 13; }
[ -r "`$db" ] || { echo "No se puede leer `$db." >&2; exit 14; }
docker inspect gymquest >/dev/null 2>&1 || { echo 'No se encontro el contenedor gymquest.' >&2; exit 15; }
printf 'PREFLIGHT=ok\n'
"@

$preflightOutput = Invoke-SshScript `
    -SshPath $ssh `
    -Target $SshTarget `
    -Script $preflightScript `
    -Operation 'El preflight remoto'

$preflightMetadata = Get-MetadataMap -Lines $preflightOutput
if ($preflightMetadata['PREFLIGHT'] -ne 'ok') {
    throw 'El preflight remoto no devolvio la confirmacion esperada.'
}

if ($PreflightOnly) {
    Write-Host "Preflight correcto para '$SshTarget'."
    Write-Host "Base remota: $RemoteDatabasePath"
    exit 0
}

Write-Warning "La sincronizacion reemplazara '$localDatabasePath' y descartara sus datos locales."

$syncId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$remoteSnapshotPath = "$remoteSnapshotDirectory/gymchall-$syncId.db"
$incomingPath = Assert-PathInsideRoot -Path (Join-Path $incomingDirectory "$syncId.db.partial") -Root $repoRoot
$previousDatabasePath = Assert-PathInsideRoot -Path (Join-Path $incomingDirectory "$syncId.previous.db") -Root $repoRoot
$previousWalPath = Assert-PathInsideRoot -Path (Join-Path $incomingDirectory "$syncId.previous.db-wal") -Root $repoRoot
$previousShmPath = Assert-PathInsideRoot -Path (Join-Path $incomingDirectory "$syncId.previous.db-shm") -Root $repoRoot
$failedDatabasePath = Assert-PathInsideRoot -Path (Join-Path $incomingDirectory "$syncId.failed.db") -Root $repoRoot

New-Item -ItemType Directory -Path $incomingDirectory -Force | Out-Null

$snapshotAttempted = $false
$replacementCompleted = $false
$rollbackCompleted = $false
$installationCommitted = $false
$hadLocalDatabase = Test-Path -LiteralPath $localDatabasePath -PathType Leaf
$hadLocalWal = Test-Path -LiteralPath $localWalPath -PathType Leaf
$hadLocalShm = Test-Path -LiteralPath $localShmPath -PathType Leaf

try {
    $snapshotScript = @"
set -eu
export LC_ALL=C
db='$RemoteDatabasePath'
snapshot_dir='$remoteSnapshotDirectory'
snapshot='$remoteSnapshotPath'
mkdir -p "`$snapshot_dir"
cleanup() { rm -f -- "`$snapshot"; }
trap cleanup 0
trap 'exit 129' 1
trap 'exit 130' 2
trap 'exit 143' 15
sqlite3 "`$db" ".timeout $timeoutMilliseconds" ".backup '`$snapshot'"
quick_check=`$(sqlite3 "`$snapshot" 'PRAGMA quick_check;')
[ "`$quick_check" = 'ok' ] || { printf 'PRAGMA quick_check fallo: %s\n' "`$quick_check" >&2; exit 20; }
checksum=`$(sha256sum "`$snapshot" | awk '{print `$1}')
size=`$(stat -c '%s' "`$snapshot")
image_ref=`$(docker inspect --format '{{.Config.Image}}' gymquest)
image_id=`$(docker inspect --format '{{.Image}}' gymquest)
captured_at=`$(date -u '+%Y-%m-%dT%H:%M:%SZ')
printf 'QUICK_CHECK=%s\n' "`$quick_check"
printf 'SHA256=%s\n' "`$checksum"
printf 'SIZE=%s\n' "`$size"
printf 'IMAGE_REF=%s\n' "`$image_ref"
printf 'IMAGE_ID=%s\n' "`$image_id"
printf 'CAPTURED_AT_UTC=%s\n' "`$captured_at"
trap - 0 1 2 15
"@

    Write-Host 'Creando backup consistente en la VM...'
    $snapshotAttempted = $true
    $snapshotOutput = Invoke-SshScript `
        -SshPath $ssh `
        -Target $SshTarget `
        -Script $snapshotScript `
        -Operation 'La creacion del backup remoto'
    $metadata = Get-MetadataMap -Lines $snapshotOutput
    $remoteChecksum = $metadata['SHA256'].ToLowerInvariant()
    if ($remoteChecksum -notmatch '^[a-f0-9]{64}$') {
        throw 'La VM no devolvio un SHA-256 valido.'
    }

    [long]$remoteSize = 0
    if (-not [long]::TryParse($metadata['SIZE'], [ref]$remoteSize) -or $remoteSize -le 0) {
        throw 'La VM no devolvio un tamano de backup valido.'
    }

    if ($metadata['QUICK_CHECK'] -ne 'ok') {
        throw 'El backup remoto no supero PRAGMA quick_check.'
    }

    Write-Host 'Descargando backup validado...'
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $scp "$($SshTarget):$remoteSnapshotPath" $incomingPath
        $scpExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($scpExitCode -ne 0) {
        throw "SCP termino con exit code $scpExitCode."
    }

    $incomingFile = Get-Item -LiteralPath $incomingPath
    if ($incomingFile.Length -ne $remoteSize) {
        throw "El tamano descargado ($($incomingFile.Length)) no coincide con el remoto ($remoteSize)."
    }

    $localChecksum = (Get-FileHash -LiteralPath $incomingPath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($localChecksum -ne $remoteChecksum) {
        throw 'El SHA-256 local no coincide con el remoto. La base local no fue modificada.'
    }

    Assert-FileUnlocked -Path $localDatabasePath
    Assert-FileUnlocked -Path $localWalPath
    Assert-FileUnlocked -Path $localShmPath

    if ($hadLocalWal) {
        Copy-Item -LiteralPath $localWalPath -Destination $previousWalPath
    }

    if ($hadLocalShm) {
        Copy-Item -LiteralPath $localShmPath -Destination $previousShmPath
    }

    Write-Host 'Reemplazando gymchall.db local...'
    if ($hadLocalDatabase) {
        $localDatabaseItem = Get-Item -LiteralPath $localDatabasePath
        if ($localDatabaseItem.IsReadOnly) {
            $localDatabaseItem.IsReadOnly = $false
        }

        [System.IO.File]::Replace($incomingPath, $localDatabasePath, $previousDatabasePath, $true)
    }
    else {
        [System.IO.File]::Move($incomingPath, $localDatabasePath)
    }
    $replacementCompleted = $true

    Remove-FileIfPresent -Path $localWalPath
    Remove-FileIfPresent -Path $localShmPath

    $installedChecksum = (Get-FileHash -LiteralPath $localDatabasePath -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($installedChecksum -ne $remoteChecksum) {
        throw 'El SHA-256 de gymchall.db no coincide despues del reemplazo.'
    }

    $gitCommit = Get-GitValue -Root $repoRoot -Arguments @('rev-parse', 'HEAD') -Fallback 'unknown'
    $gitBranch = Get-GitValue -Root $repoRoot -Arguments @('branch', '--show-current') -Fallback 'detached-or-unknown'

    $manifest = [ordered]@{
        formatVersion = 1
        capturedAtUtc = $metadata['CAPTURED_AT_UTC']
        installedAtUtc = (Get-Date).ToUniversalTime().ToString('o')
        sshTarget = $SshTarget
        remoteDatabasePath = $RemoteDatabasePath
        localDatabasePath = $localDatabasePath
        sizeBytes = $remoteSize
        sha256 = $remoteChecksum
        quickCheck = 'ok'
        productionImage = $metadata['IMAGE_REF']
        productionImageId = $metadata['IMAGE_ID']
        localGitCommit = "$gitCommit".Trim()
        localGitBranch = "$gitBranch".Trim()
    }

    $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
    $installationCommitted = $true

    Remove-FileBestEffort -Path $previousDatabasePath
    Remove-FileBestEffort -Path $previousWalPath
    Remove-FileBestEffort -Path $previousShmPath

    Write-Host 'Sincronizacion completada.'
    Write-Host "Base local: $localDatabasePath"
    Write-Host "SHA-256: $remoteChecksum"
    Write-Host "Imagen productiva: $($metadata['IMAGE_REF'])"
}
catch {
    $originalError = $_

    if ($replacementCompleted -and -not $installationCommitted) {
        try {
            if ($hadLocalDatabase) {
                if (-not (Test-Path -LiteralPath $previousDatabasePath -PathType Leaf)) {
                    throw 'No se encontro el backup transitorio de la base anterior.'
                }

                if (Test-Path -LiteralPath $localDatabasePath -PathType Leaf) {
                    [System.IO.File]::Replace($previousDatabasePath, $localDatabasePath, $failedDatabasePath, $true)
                    Remove-FileIfPresent -Path $failedDatabasePath
                }
                else {
                    [System.IO.File]::Move($previousDatabasePath, $localDatabasePath)
                }
            }
            else {
                Remove-FileIfPresent -Path $localDatabasePath
            }

            if ($hadLocalWal -and (Test-Path -LiteralPath $previousWalPath -PathType Leaf)) {
                Copy-Item -LiteralPath $previousWalPath -Destination $localWalPath -Force
            }
            else {
                Remove-FileIfPresent -Path $localWalPath
            }

            if ($hadLocalShm -and (Test-Path -LiteralPath $previousShmPath -PathType Leaf)) {
                Copy-Item -LiteralPath $previousShmPath -Destination $localShmPath -Force
            }
            else {
                Remove-FileIfPresent -Path $localShmPath
            }

            $rollbackCompleted = $true
        }
        catch {
            throw "La sincronizacion fallo y el rollback local no pudo completarse. Conserve los archivos en '$incomingDirectory'. Error original: $($originalError.Exception.Message). Error de rollback: $($_.Exception.Message)"
        }
    }

    throw $originalError
}
finally {
    Remove-FileBestEffort -Path $incomingPath

    if (-not $replacementCompleted -or $rollbackCompleted -or $installationCommitted) {
        Remove-FileBestEffort -Path $previousDatabasePath
        Remove-FileBestEffort -Path $previousWalPath
        Remove-FileBestEffort -Path $previousShmPath
        Remove-FileBestEffort -Path $failedDatabasePath
    }

    if ($snapshotAttempted) {
        $cleanupScript = @"
set -eu
rm -f -- '$remoteSnapshotPath'
"@

        try {
            Invoke-SshScript `
                -SshPath $ssh `
                -Target $SshTarget `
                -Script $cleanupScript `
                -Operation 'La limpieza del backup remoto' | Out-Null
        }
        catch {
            Write-Warning $_.Exception.Message
        }
    }
}
