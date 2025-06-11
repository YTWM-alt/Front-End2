from app import create_app
from app.app_config import get_config

app = create_app()
config = get_config()
 
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3003, debug=True) 