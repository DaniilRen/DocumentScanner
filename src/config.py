# To use your own config just create it on config/ dir and specify 'name' argument in open_config() or create a separate config class


import json
import os


# name: "public" (by default) / "<your config name>"
def open_config(name: str="public_config"):
	try:
		config_path = os.path.join(os.path.dirname(__file__), "configs", f"{name}.json")
		with open(config_path) as file:
			return json.load(file)
	except Exception as e:
		print(e)
		return e


class ProductionConfig():
	SECRET_KEY = None
	STORAGE = None
	MAX_CONTENT_LENGTH = None
	ALLOWED_EXTENSIONS = ["docx", "pdf"]

	def __init__(self):
		CONFIG_FILE = open_config()
		self.SECRET_KEY = CONFIG_FILE["SECRET_KEY"]
		self.STORAGE = os.path.abspath(os.path.join(os.path.dirname(__file__), CONFIG_FILE["STORAGE"]))
		self.MAX_CONTENT_LENGTH = CONFIG_FILE["MAX_CONTENT_LENGTH"] * 1024 * 1024 # MB


