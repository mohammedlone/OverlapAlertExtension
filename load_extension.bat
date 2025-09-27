@echo off
echo Opening Chrome Extensions page...
start chrome://extensions/
echo.
echo Instructions:
echo 1. Enable "Developer mode" (toggle in top right)
echo 2. Click "Load unpacked"
echo 3. Navigate to: %cd%
echo 4. Select this folder and click "Select Folder"
echo.
echo Your extension should now be loaded!
pause

