@echo off
title Order-to-Audit System - South Indian Snacks Manufacturing
echo =========================================================================
echo       ORDER-TO-AUDIT SYSTEM (South Indian Snacks Manufacturing)
echo       Murukku ^| Mixture ^| Banana Chips ^| Traditional Sweets
echo =========================================================================
echo.
echo Starting FastAPI Backend and Serving Built React Application on Port 8000...
echo.
set DISABLE_SQLALCHEMY_CEXT=1
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
pause
