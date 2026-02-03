import PyInstaller.__main__
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
MAIN_APP = BASE_DIR / "main.py"

for dir_name in ['templates', 'static', 'uploads', 'lib']:
    (BASE_DIR / dir_name).mkdir(exist_ok=True)

print("Building Document Scanner...")

# Windows/Mac separator
sep = ';' if os.name == 'nt' else ':'

args = [
    str(MAIN_APP),
    "--onefile",
    "--windowed",
    "--name", "DocumentScanner",
    "--distpath", str(BASE_DIR / "dist"),
    "--workpath", str(BASE_DIR / "build"),
    
    # ALL static files
    "--add-data", f"templates{sep}templates",
    "--add-data", f"static{sep}static",
    "--add-data", f"lib{sep}lib",
    "--add-data", f"configs{sep}configs",
    "--add-data", f"config.py{sep}config.py",
    
    # Flask + dependencies
    "--hidden-import", "flask",
    "--hidden-import", "jinja2", 
    "--hidden-import", "werkzeug",
    "--hidden-import", "click",
    "--hidden-import", "lib.utils",
    "--hidden-import", "lib.scan",
    "--hidden-import", "config",
    
    # Performance
    "--noupx",
    "--clean",
]

PyInstaller.__main__.run(args)
print(f"EXE: dist/DocumentScanner{'.exe' if os.name == 'nt' else ''}")
