# One-command deploy from your Windows terminal.
#
#   .\deploy\deploy.ps1 "commit message"
#   .\deploy\deploy.ps1              # auto-generates a timestamped message
#
# Commits local changes, pushes to origin/main, then runs the server-side
# deploy (deploy/deploy.sh) on the VPS over SSH. Requires the built-in
# Windows OpenSSH client and an SSH key set up for root@187.124.131.175.

param(
  [string]$Message = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$VPS    = "root@187.124.131.175"
$REPO   = "/var/www/guzellikmerkezi"
$BRANCH = "main"

# 1. Commit local changes (skip cleanly if there's nothing to commit)
$status = git status --porcelain
if ($status) {
  git add -A
  git commit -m $Message
  if ($LASTEXITCODE -ne 0) { Write-Error "git commit failed"; exit 1 }
} else {
  Write-Host "No local changes to commit — deploying current HEAD."
}

# 2. Push to GitHub
git push origin $BRANCH
if ($LASTEXITCODE -ne 0) { Write-Error "git push failed"; exit 1 }

# 3. Run the server-side deploy over SSH
Write-Host "Pushed. Running server deploy on $VPS ..."
ssh $VPS "cd $REPO && bash deploy/deploy.sh"
if ($LASTEXITCODE -ne 0) { Write-Error "Server deploy failed — check output above"; exit 1 }

Write-Host "`n✓ Deploy complete → https://ntbeauty.shop"
