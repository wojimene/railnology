@echo off
echo --- Starting Railnology Job Scraper ---

:: ----------------------------------------------------------------------
:: 1. LOCATE REQUIREMENTS FILE
:: ----------------------------------------------------------------------
set REQ_PATH="%~dp0requirements.txt"

:: ----------------------------------------------------------------------
:: 2. INSTALL DEPENDENCIES (Robust Method)
:: ----------------------------------------------------------------------
echo Checking Python environment...
python --version

if defined REQ_PATH (
    echo Found requirements at: %REQ_PATH%
    echo Installing dependencies...
    :: Use 'python -m pip' to ensure we install to the CURRENT python environment
    python -m pip install -r "%REQ_PATH%"
    
    if %errorlevel% neq 0 (
        echo ⚠️ Batch install failed. Attempting direct install of critical libs...
        python -m pip install python-dotenv requests beautifulsoup4
    )
) else (
    echo ⚠️ WARNING: requirements.txt not found. Attempting manual install...
    python -m pip install python-dotenv requests beautifulsoup4
)

:: ----------------------------------------------------------------------
:: 3. RUN SCRAPER
:: ----------------------------------------------------------------------
echo.
echo Environment loading from .env...
python "%~dp0scrape_jobs.py"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Scraper failed. See error above.
) else (
    echo.
    echo ✅ Scraper finished successfully.
)

pause