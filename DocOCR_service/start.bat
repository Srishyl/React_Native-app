@echo off
echo Starting GramHealth DocOCR Service on port 8083...
call .\venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8083 --reload
