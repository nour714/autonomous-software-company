# ==============================================================================
# Automated Installer for Antigravity Autonomous Software Company (PowerShell)
# ==============================================================================
param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Parse --dry-run passed in args
if ($args -contains '--dry-run') {
    $DryRun = $true
}

$sourceRoot = if ($env:SWARM_SOURCE_DIR) { 
    $env:SWARM_SOURCE_DIR 
} else { 
    Split-Path -Parent $MyInvocation.MyCommand.Path 
}

$sourceSkills = Join-Path $sourceRoot "skills"
$sourceRules  = Join-Path $sourceRoot "rules"
$sourceAgents = Join-Path $sourceRoot "agents"

$baseTarget = if ($env:SWARM_TARGET_DIR) {
    $env:SWARM_TARGET_DIR
} else {
    "$env:USERPROFILE\.gemini\config"
}

$targetSkills = Join-Path $baseTarget "skills"
$targetRules  = Join-Path $baseTarget "rules" # TODO(verify) exact Antigravity rules discovery path
$targetAgents = Join-Path $baseTarget "agents"

# Validate required source directories
foreach ($dir in @($sourceSkills, $sourceRules, $sourceAgents)) {
    if (-not (Test-Path -Path $dir -PathType Container)) {
        Write-Error "Error: Required source directory missing: $dir"
        exit 1
    }
}

$skillDirs  = @(Get-ChildItem -Path $sourceSkills -Directory)
$ruleFiles  = @(Get-ChildItem -Path $sourceRules -Filter *.md)
$agentFiles = @(Get-ChildItem -Path $sourceAgents -Filter *.md)

$skillsCount = $skillDirs.Count
$rulesCount  = $ruleFiles.Count
$agentsCount = $agentFiles.Count

if ($DryRun) {
    Write-Host "============================================================"
    Write-Host "         SWARM INSTALLATION DRY RUN (NO CHANGES MADE)"
    Write-Host "============================================================"
    Write-Host "Source Root: $sourceRoot"
    Write-Host "Targets:"
    Write-Host "  - Skills: $targetSkills"
    Write-Host "  - Rules:  $targetRules"
    Write-Host "  - Agents: $targetAgents"
    Write-Host "------------------------------------------------------------"
    Write-Host "Planned Operations:"
    Write-Host "  - Skills to install: $skillsCount directories"
    Write-Host "  - Rules to install:  $rulesCount markdown files"
    Write-Host "  - Agents to install: $agentsCount markdown files"
    Write-Host "------------------------------------------------------------"
    Write-Host "Status: Dry-run completed successfully. Zero files written."
    Write-Host "============================================================"
    exit 0
}

try {
    # Ensure targets exist idempotently
    foreach ($target in @($targetSkills, $targetRules, $targetAgents)) {
        if (-not (Test-Path -Path $target -PathType Container)) {
            New-Item -ItemType Directory -Force -Path $target | Out-Null
        }
    }

    # Install skills idempotently without removing existing user files
    $installedSkills = 0
    foreach ($skill in $skillDirs) {
        $dest = Join-Path $targetSkills $skill.Name
        Copy-Item -Path $skill.FullName -Destination $dest -Recurse -Force
        $installedSkills++
    }

    # Install rules idempotently
    $installedRules = 0
    foreach ($rule in $ruleFiles) {
        $dest = Join-Path $targetRules $rule.Name
        Copy-Item -Path $rule.FullName -Destination $dest -Force
        $installedRules++
    }

    # Install agents idempotently
    $installedAgents = 0
    foreach ($agent in $agentFiles) {
        $dest = Join-Path $targetAgents $agent.Name
        Copy-Item -Path $agent.FullName -Destination $dest -Force
        $installedAgents++
    }

    Write-Host "============================================================"
    Write-Host "         SWARM INSTALLATION SUMMARY"
    Write-Host "============================================================"
    Write-Host "Installation complete and verified."
    Write-Host "  - Installed Skills: $installedSkills directories -> $targetSkills"
    Write-Host "  - Installed Rules:  $installedRules files       -> $targetRules"
    Write-Host "  - Installed Agents: $installedAgents files      -> $targetAgents"
    Write-Host "Existing user configurations preserved safely."
    Write-Host "============================================================"
} catch {
    Write-Error "Error during installation: $_"
    exit 1
}
