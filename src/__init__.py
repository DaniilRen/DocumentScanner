from flask import Flask
import routing, config
import os
from lib.utils import cleanup_storage_on_startup


def _detect_base_dir() -> str:
	"""
	Return the base directory where templates/static/configs live.
	Supports both normal execution and PyInstaller onefile (sys._MEIPASS).
	"""
	import sys

	if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
		return sys._MEIPASS
	return os.path.dirname(__file__)


def create_app():
	base_dir = _detect_base_dir()

	app = Flask(
		__name__,
		template_folder=os.path.join(base_dir, "templates"),
		static_folder=os.path.join(base_dir, "static"),
	)

	app.config.from_object(config.DefaultConfig())

	# Ensure storage directory exists (path already absolute in DefaultConfig)
	os.makedirs(app.config["STORAGE"], exist_ok=True)
	cleanup_storage_on_startup(app=app)

	app.register_blueprint(routing.bp)

	app.add_url_rule("/", endpoint="index")

	return app