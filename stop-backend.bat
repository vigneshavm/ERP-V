@echo off
echo Stopping all Backend services...

set PORTS=4000 5000 5001

for %%p in (%PORTS%) do (
    echo Checking port %%p...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p ^| findstr LISTENING') do (
        echo Killing process %%a on port %%p...
        taskkill /F /PID %%a
    )
)

echo Done.
