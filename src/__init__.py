from flask import Flask
import routing, config
import os
from lib.utils import cleanup_storage_on_startup


def create_app():
	app = Flask(__name__)
	app.config.from_object(config.ProductionConfig())
	os.makedirs(os.path.abspath(os.path.join(os.path.dirname(__file__), app.config['STORAGE'])), exist_ok=True)
	cleanup_storage_on_startup(app=app)

	app.register_blueprint(routing.bp)

	app.add_url_rule("/", endpoint="index")
	
	return app