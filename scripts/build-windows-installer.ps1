#!/usr/bin/env pwsh

param(
    [string]$Version,
    [ValidateSet('x64', 'arm64')]
    [string]$Arch,
    [string]$Binary = 'dist/smdu.exe',
    [string]$WixSource = 'packaging/windows/smdu.wxs',
    [string]$OutputPrefix
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-PackageVersion {
    $packageJson = Get-Content -Raw -Path 'package.json' | ConvertFrom-Json
    return [string]$packageJson.version
}

if (-not $Version) {
    $Version = Get-PackageVersion
}

$VersionNoPrefix = $Version.TrimStart('v')

if (-not $Arch) {
    throw 'Arch is required. Use -Arch x64 or -Arch arm64.'
}

if (-not $OutputPrefix) {
    $OutputPrefix = "dist/smdu-v$VersionNoPrefix-windows-$Arch"
}

if (-not (Test-Path -LiteralPath $Binary)) {
    throw "Windows binary was not found at '$Binary'."
}

if (-not (Test-Path -LiteralPath $WixSource)) {
    throw "WiX source was not found at '$WixSource'."
}

$wix = Get-Command wix -ErrorAction SilentlyContinue
if (-not $wix) {
    throw "The 'wix' CLI was not found in PATH. Install WiX Toolset v4 and retry."
}

$msiOutput = "$OutputPrefix.msi"

wix build $WixSource `
    -arch $Arch `
    -d BinarySource="$Binary" `
    -d ProductVersion="$VersionNoPrefix" `
    -out $msiOutput

if (-not (Test-Path -LiteralPath $msiOutput)) {
    throw "MSI output was not generated at '$msiOutput'."
}

$hash = (Get-FileHash -Path $msiOutput -Algorithm SHA256).Hash.ToLowerInvariant()
"$hash  $(Split-Path -Leaf $msiOutput)" | Out-File -FilePath "$msiOutput.sha256" -Encoding ascii

Write-Host "Built $msiOutput"
