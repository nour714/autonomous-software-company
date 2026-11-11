# Automated Installer for Antigravity Autonomous Software Company

$targetSkills = "$env:USERPROFILE\.gemini\config\skills"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceSkills = Join-Path $scriptDir "skills"

if (-not (Test-Path $targetSkills)) {
    New-Item -ItemType Directory -Force -Path $targetSkills | Out-Null
}

Get-ChildItem -Path $sourceSkills -Directory | ForEach-Object {
    $dest = Join-Path $targetSkills $_.Name
    Copy-Item -Path $_.FullName -Destination $dest -Recurse -Force
    Write-Host "Installed: $($_.Name)"
}

Write-Host "Installation completed successfully. 40 skills installed to $targetSkills."
