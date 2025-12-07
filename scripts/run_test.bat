@echo off
echo --- Starting Railnology Search Test ---

:: ----------------------------------------------------------------------
:: SECURITY WARNING: DO NOT COMMIT REAL KEYS TO GIT
:: ----------------------------------------------------------------------

:: This batch file relies on the root .env file.
:: It will output debug info if keys are missing in the Python script.

echo Environment variables checked.
echo Starting Python Search Test...
echo.

:: %~dp0 refers to the directory where this batch file is located.
python "%~dp0test_search.py"

pause