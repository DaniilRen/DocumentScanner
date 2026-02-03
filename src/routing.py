from flask import render_template, g, Blueprint, request, current_app, jsonify
from lib.utils import allowed_file, random_filename
from lib.scan import DocxScanner, PDFScanner
import os
import threading


bp = Blueprint('routing', __name__)


@bp.route('/')
def index():
	return render_template("home.html")


@bp.route('/api/upload', methods=['POST'])
def upload_file():
	if 'file' not in request.files:
			return jsonify({'error': 'No file selected'}), 400
	
	file = request.files['file']
	if file.filename == '' or not allowed_file(file.filename, current_app):
			return jsonify({'error': 'Invalid file'}), 400
	
	filename = random_filename(file.filename) 
	filepath = os.path.join(current_app.config['STORAGE'], filename)
	file.save(filepath)
	
	return jsonify({'success': True, 'filename': filename})


@bp.route('/api/scan', methods=['POST'])
def scan_file():
	filename = request.form.get('filename')
	keywords = request.form.get('keywords', '').split(',')
	keywords = [kw.strip() for kw in keywords if kw.strip()]
	
	filepath = os.path.join(current_app.config['STORAGE'], filename)
	if not os.path.exists(filepath):
		return jsonify({'error': 'File not found'}), 400
	
	if filename.endswith('.docx'):
		doc_format = 'DOCX'
		scanner = DocxScanner(filepath, keywords)
		results = scanner.process_data()
	else:
		doc_format = 'PDF'
		scanner = PDFScanner(filepath, keywords)
		results = scanner.process_data()
	
	print(f"format = {doc_format}; {[f'{k}: {len(val)}' for k, val in results.items()]}")
	return jsonify({'success': True, 'results': results})


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