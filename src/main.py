from __init__ import create_app
import threading
import webbrowser
import urllib.request
import urllib.error


app = create_app()


def _open_browser(port: int = 5000):
	url = f"http://127.0.0.1:{port}/"
	try:
		webbrowser.open_new_tab(url)
	except Exception:
		pass


def _is_server_running(port: int = 5000) -> bool:
	"""Return True if the local server is already running on the given port."""
	url = f"http://127.0.0.1:{port}/"
	try:
		with urllib.request.urlopen(url, timeout=1):
			return True
	except (urllib.error.URLError, TimeoutError, ConnectionError, OSError):
		return False


if __name__ == "__main__":
	port = 51337

	if _is_server_running(port):
		_open_browser(port)
	else:
		threading.Timer(1.0, _open_browser, args=(port,)).start()
		app.run(host="127.0.0.1", port=port)