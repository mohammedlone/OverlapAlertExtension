# PowerShell script to help load Chrome extension
Write-Host "Loading Chrome Extensions page..." -ForegroundColor Green
Start-Process "chrome://extensions/"

Write-Host ""
Write-Host "Follow these steps:" -ForegroundColor Yellow
Write-Host "1. Enable 'Developer mode' (toggle in top right)" -ForegroundColor White
Write-Host "2. Click 'Load unpacked'" -ForegroundColor White
Write-Host "3. Navigate to this folder: $PWD" -ForegroundColor White
Write-Host "4. Select this folder and click 'Select Folder'" -ForegroundColor White
Write-Host ""
Write-Host "Your extension should now be loaded!" -ForegroundColor Green

# Optional: Keep PowerShell window open
Read-Host "Press Enter to close"

