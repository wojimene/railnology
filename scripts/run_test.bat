@echo off
echo --- Setting up Railnology Environment Variables ---

:: ----------------------------------------------------------------------
:: SECURITY WARNING: DO NOT COMMIT REAL KEYS TO GIT
:: Replace these values locally only, or set them in your system environment
:: ----------------------------------------------------------------------

if "%MONGO_URI%"=="" set MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true^&w=majority
if "%OPENAI_API_KEY%"=="" set OPENAI_API_KEY=sk-YOUR_OPENAI_KEY_HERE

echo Environment variables checked.
echo Starting Python Ingestion Script...
echo.

:: %~dp0 refers to the directory where this batch file is located.
:: This ensures it finds the python script regardless of where you run this command from.
python "%~dp0ingest_rail_content.py"

echo.
echo Script finished.
pause