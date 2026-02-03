@echo off
echo 🚀 Building Document Scanner...
pip install -r requirements.txt
python build.py
echo ✅ Complete! Check dist/DocumentScanner.exe
pause
