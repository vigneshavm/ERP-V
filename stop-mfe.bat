@echo off
echo Stopping all MFE services...

set ports=3000 3001 3002 3003 3004 3005 3006

for %%p in (%ports%) do (
    echo Checking port %%p...
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p ^| findstr LISTENING') do (
        echo Killing process %%a on port %%p...
        taskkill /F /PID %%a
    )
)

echo Done.
