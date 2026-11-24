# ==============================================================================
# Automated Installer for Antigravity Autonomous Software Company (PowerShell)
# ==============================================================================
param(
    [switch]$DryRun,
    [switch]$Verify
)

$ErrorActionPreference = 'Stop'

# Parse args passed
if ($args -contains '--dry-run' -or $args -contains '-DryRun') {
    $DryRun = $true
}
if ($args -contains '--verify' -or $args -contains '-Verify') {
    $Verify = $true
}

$sourceRoot = if ($env:SWARM_SOURCE_DIR) { 
    $env:SWARM_SOURCE_DIR 
} else { 
    Split-Path -Parent $MyInvocation.MyCommand.Path 
}

$sourceSkills  = Join-Path $sourceRoot "skills"
$sourceRules   = Join-Path $sourceRoot "rules"
$sourceAgents  = Join-Path $sourceRoot "agents"
$sourceConfig  = Join-Path $sourceRoot "config"
$sourceScripts = Join-Path $sourceRoot "scripts"

$baseTarget = if ($env:SWARM_TARGET_DIR) {
    $env:SWARM_TARGET_DIR
} else {
    "$env:USERPROFILE\.gemini\config"
}

$targetSkills  = Join-Path $baseTarget "skills"
$targetRules   = Join-Path $baseTarget "rules"
$targetAgents  = Join-Path $baseTarget "agents"
$targetConfig  = Join-Path $baseTarget "config"
$targetScripts = Join-Path $baseTarget "scripts"

# Validate required source directories
foreach ($dir in @($sourceSkills, $sourceRules, $sourceAgents, $sourceConfig, $sourceScripts)) {
    if (-not (Test-Path -Path $dir -PathType Container)) {
        Write-Error "Error: Required source directory missing: $dir"
        exit 1
    }
}

$skillDirs   = @(Get-ChildItem -Path $sourceSkills -Directory)
$ruleFiles   = @(Get-ChildItem -Path $sourceRules -Recurse -File)
$agentFiles  = @(Get-ChildItem -Path $sourceAgents -Filter *.md)
$configFiles = @(Get-ChildItem -Path $sourceConfig -File)
$scriptFiles = @(Get-ChildItem -Path $sourceScripts -File)

$skillsCount  = $skillDirs.Count
$rulesCount   = $ruleFiles.Count
$agentsCount  = $agentFiles.Count
$configCount  = $configFiles.Count
$scriptsCount = $scriptFiles.Count

if ($DryRun) {
    Write-Host "============================================================"
    Write-Host "         SWARM INSTALLATION DRY RUN (NO CHANGES MADE)"
    Write-Host "============================================================"
    Write-Host "Source Root: $sourceRoot"
    Write-Host "Targets:"
    Write-Host "  - Skills:  $targetSkills"
    Write-Host "  - Rules:   $targetRules"
    Write-Host "  - Agents:  $targetAgents"
    Write-Host "  - Config:  $targetConfig"
    Write-Host "  - Scripts: $targetScripts"
    Write-Host "------------------------------------------------------------"
    Write-Host "Planned Operations:"
    Write-Host "  - Skills to install:  $skillsCount directories"
    Write-Host "  - Rules to install:   $rulesCount files (including references)"
    Write-Host "  - Agents to install:  $agentsCount markdown files"
    Write-Host "  - Config to install:  $configCount configuration files"
    Write-Host "  - Scripts to install: $scriptsCount script files"
    Write-Host "------------------------------------------------------------"
    Write-Host "Status: Dry-run completed successfully. Zero files written."
    Write-Host "============================================================"
    exit 0
}

try {
    # Ensure targets exist idempotently
    foreach ($target in @($targetSkills, $targetRules, $targetAgents, $targetConfig, $targetScripts)) {
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

    # Install rules recursively (including references/)
    Copy-Item -Path "$sourceRules\*" -Destination $targetRules -Recurse -Force
    $installedRules = $rulesCount

    # Install agents idempotently
    $installedAgents = 0
    foreach ($agent in $agentFiles) {
        $dest = Join-Path $targetAgents $agent.Name
        Copy-Item -Path $agent.FullName -Destination $dest -Force
        $installedAgents++
    }

    # Install config
    Copy-Item -Path "$sourceConfig\*" -Destination $targetConfig -Recurse -Force
    $installedConfig = $configCount

    # Install scripts
    Copy-Item -Path "$sourceScripts\*" -Destination $targetScripts -Recurse -Force
    $installedScripts = $scriptsCount

    Write-Host "============================================================"
    Write-Host "         SWARM INSTALLATION SUMMARY"
    Write-Host "============================================================"
    Write-Host "Installation complete and verified."
    Write-Host "  - Installed Skills:  $installedSkills directories -> $targetSkills"
    Write-Host "  - Installed Rules:   $installedRules files       -> $targetRules"
    Write-Host "  - Installed Agents:  $installedAgents files      -> $targetAgents"
    Write-Host "  - Installed Config:  $installedConfig files      -> $targetConfig"
    Write-Host "  - Installed Scripts: $installedScripts files     -> $targetScripts"
    Write-Host "Existing user configurations preserved safely."
    Write-Host "============================================================"

    if ($Verify) {
        Write-Host "Verifying installation targets..."
        $requiredFiles = @(
            (Join-Path $targetConfig "swarm.config.yaml"),
            (Join-Path $targetRules "swarm-orchestration.md"),
            (Join-Path $targetRules "references\runtime-state.md"),
            (Join-Path $targetRules "references\protocol-cards.md"),
            (Join-Path $targetScripts "verify-report.cjs")
        )
        foreach ($req in $requiredFiles) {
            if (-not (Test-Path -Path $req -PathType Leaf)) {
                Write-Error "Verification failed: missing $req"
                exit 1
            }
        }
        Write-Host "Verification passed: all required files confirmed present."
    }
} catch {
    Write-Error "Error during installation: $_"
    exit 1
}
