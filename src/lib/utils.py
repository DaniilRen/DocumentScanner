import glob
import os
from werkzeug.utils import secure_filename
import secrets


def allowed_file(filename, app):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]


def random_filename(original_filename):
	ext = os.path.splitext(original_filename)[1]
	random_hash = secrets.token_urlsafe(16)
	return f"{random_hash}{ext}"


def cleanup_storage_on_startup(app):
	storage_path = app.config["STORAGE"]
	if not os.path.exists(storage_path):
		return
	
	file_pattern = os.path.join(storage_path, "*")
	files = glob.glob(file_pattern)
	
	for file_path in files:
		if os.path.isfile(file_path):
			try:
				os.remove(file_path)
			except:
				pass