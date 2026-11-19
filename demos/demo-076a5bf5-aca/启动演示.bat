@echo off
chcp 65001 >nul
cd /d "%~dp0"
title SENTINEL - Patrol Management Demo
if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
  "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" "%~dp0bootstrap.py"
  goto done
)
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 "%~dp0bootstrap.py"
  goto done
)
where python >nul 2>&1
if %errorlevel%==0 (
  python "%~dp0bootstrap.py"
  goto done
)
echo Python 3.10+ is required. Recommended: Python 3.13 x64.
echo Install from https://www.python.org/downloads/windows/
:done
if errorlevel 1 pause
