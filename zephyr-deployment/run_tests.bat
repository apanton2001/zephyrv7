@echo off
echo Running Zephyr API tests...
python test_api.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Tests completed successfully!
) else (
    echo.
    echo Tests failed with errors.
)

pause
