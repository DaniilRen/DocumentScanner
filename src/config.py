# To use your own config just create it on config/ dir and specify 'name' argument in open_config() or create a separate config class


import json
import os
import sys


# Detect base directory both in normal and PyInstaller-frozen mode
if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
	BASE_DIR = sys._MEIPASS  # type: ignore[attr-defined]
else:
	BASE_DIR = os.path.dirname(__file__)


# name: "public" (by default) / "<your config name>"
def open_config(name: str = "public_config"):
	"""
	Open JSON config file from the bundled configs directory.
	Works both when running from source and from a PyInstaller onefile build.
	"""
	try:
		config_path = os.path.join(BASE_DIR, "configs", f"{name}.json")
		with open(config_path, encoding="utf-8") as file:
			return json.load(file)
	except Exception as e:
		# In frozen exe failures here will usually surface as a 500 error;
		print(e)
		return e


class DefaultConfig:
	SECRET_KEY = None
	STORAGE = None
	MAX_CONTENT_LENGTH = None
	ALLOWED_EXTENSIONS = ["docx", "pdf"]

	def __init__(self):
		CONFIG_FILE = open_config()
		self.SECRET_KEY = CONFIG_FILE["SECRET_KEY"]
		self.STORAGE = os.path.abspath(os.path.join(BASE_DIR, CONFIG_FILE["STORAGE"]))
		self.MAX_CONTENT_LENGTH = CONFIG_FILE["MAX_CONTENT_LENGTH"] * 1024 * 1024  # MB

