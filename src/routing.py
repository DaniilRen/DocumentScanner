from flask import render_template, g, Blueprint, request, current_app, jsonify
from lib.utils import allowed_file, random_filename
from lib.scan import DocxScanner, PDFScanner
import os
import threading
import json


bp = Blueprint('routing', __name__)


@bp.route('/')
def index():
	return render_template("home.html")


@bp.route('/api/upload', methods=['POST'])
def upload_file():
	"""
	Upload one or more files and store them in the configured STORAGE directory.
	Returns a list of stored filenames so the client can later request scanning.
	"""
	files = request.files.getlist("files")

	if not files:
		return jsonify({'error': 'No files selected'}), 400

	saved_files = []

	for file in files:
		original_name = file.filename
		if original_name == '' or not allowed_file(original_name, current_app):
			return jsonify({'error': f'Invalid file: {original_name or "Unnamed"}'}), 400

		filename = random_filename(original_name)
		filepath = os.path.join(current_app.config['STORAGE'], filename)
		file.save(filepath)
		saved_files.append({
			'stored': filename,
			'original': original_name
		})

	return jsonify({'success': True, 'files': saved_files})


@bp.route('/api/scan', methods=['POST'])
def scan_file():
	filenames_raw = request.form.get('filenames')
	keywords = request.form.get('keywords', '').split(',')
	keywords = [kw.strip() for kw in keywords if kw.strip()]

	if not filenames_raw:
		return jsonify({'error': 'No files specified for scanning'}), 400

	try:
		filenames = json.loads(filenames_raw)
	except (TypeError, json.JSONDecodeError):
		return jsonify({'error': 'Invalid filenames payload'}), 400

	if not isinstance(filenames, list) or not filenames:
		return jsonify({'error': 'No files specified for scanning'}), 400

	all_results = {}

	for filename in filenames:
		filepath = os.path.join(current_app.config['STORAGE'], filename)
		if not os.path.exists(filepath):
			return jsonify({'error': f'File not found: {filename}'}), 400

		if filename.endswith('.docx'):
			doc_format = 'DOCX'
			scanner = DocxScanner(filepath, keywords)
			results = scanner.process_data()
		else:
			doc_format = 'PDF'
			scanner = PDFScanner(filepath, keywords)
			results = scanner.process_data()

		print(f"format = {doc_format}; file = {filename}; "
		      f"{[f'{k}: {len(val)}' for k, val in results.items()]}")
		all_results[filename] = results

	return jsonify({'success': True, 'results': all_results})


@bp.route('/api/reset', methods=['POST'])
def reset_files():
	"""
	Remove given files from the STORAGE directory.
	Used by the client when the user presses the Clean button
	to fully reset state.
	"""
	filenames_raw = request.form.get('filenames')

	if not filenames_raw:
		return jsonify({'success': True})

	try:
		filenames = json.loads(filenames_raw)
	except (TypeError, json.JSONDecodeError):
		return jsonify({'error': 'Invalid filenames payload'}), 400

	if not isinstance(filenames, list):
		return jsonify({'error': 'Invalid filenames payload'}), 400

	for filename in filenames:
		filepath = os.path.join(current_app.config['STORAGE'], filename)
		if os.path.exists(filepath):
			try:
				os.remove(filepath)
			except OSError:
				# If a file cannot be removed, continue with others.
				continue

	return jsonify({'success': True})


@bp.route('/api/shutdown', methods=['POST'])
def shutdown():
	"""
	Stop the running process from an HTTP call.
	We avoid Werkzeug internals and just exit the process shortly after
	sending the HTTP response so the EXE can terminate reliably.
	"""
	def _delayed_exit():
		import time
		import os as _os

		time.sleep(0.5)
		_os._exit(0)

	threading.Thread(target=_delayed_exit, daemon=True).start()
	return jsonify({"success": True})