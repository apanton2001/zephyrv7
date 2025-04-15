@echo off
REM Zephyr Deployment Startup Script for Windows
REM This script sets up and runs the Zephyr API server

echo ================================================
echo          Zephyr LLM Deployment Setup
echo ================================================

REM Check for Python
echo.
echo Checking for Python...
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set python_cmd=python
    echo Python is installed!
) else (
    echo Python is not installed. Please install Python 3.8 or higher and try again.
    exit /b 1
)

REM Check Python version
for /f "tokens=*" %%i in ('%python_cmd% -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"') do set python_version=%%i
echo Python version: %python_version%

REM Check for pip and install requirements
echo.
echo Installing required packages...
%python_cmd% -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo Failed to install required packages. Please check your internet connection and try again.
    exit /b 1
)
echo Packages installed successfully!

REM Check for CUDA
echo.
echo Checking for CUDA...
where nvidia-smi >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo CUDA is available!
    nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
    set use_cuda=yes
) else (
    echo CUDA not detected. Will run in CPU mode (much slower).
    echo For better performance, consider running on a machine with a CUDA-compatible GPU.
    set use_cuda=no
)

REM Download model if needed
echo.
echo Checking for model files...
if exist "%USERPROFILE%\.cache\huggingface\hub\models--HuggingFaceH4--zephyr-7b-beta" (
    echo Model files found locally!
) else (
    echo Model files not found. Downloading model...
    %python_cmd% download_model.py
    if %ERRORLEVEL% neq 0 (
        echo Failed to download model. Please check your internet connection and try again.
        exit /b 1
    )
)

REM Create static directory if it doesn't exist
if not exist "static" (
    echo.
    echo Creating static directory...
    mkdir static
)

REM Start the server
echo.
echo ================================================
echo          Starting Zephyr API Server
echo ================================================
echo.
echo The server will be available at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

%python_cmd% main.py
