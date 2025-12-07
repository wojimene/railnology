@echo off
echo --- Starting Railnology Search Test ---

:: ----------------------------------------------------------------------
:: SECURITY WARNING: DO NOT COMMIT REAL KEYS TO GIT
:: ----------------------------------------------------------------------

if "%MONGO_URI%"=="" set MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true^&w=majority
if "%OPENAI_API_KEY%"=="" set OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE

echo Environment variables checked.
echo Starting Python Search Test...
echo.

:: %~dp0 refers to the directory where this batch file is located.
:: This ensures it finds the python script regardless of where you run this command from.
python "%~dp0test_search.py"

pause