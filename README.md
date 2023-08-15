# Spotify Album Tracker Webapp

This is a basic web-app that uses a flask backend and pure JS frontend that allows for users to track what albums they listend to and when, using SQLAlchmey toolkit to host a database to store user entries. You can search for albums, mark them as listened to, review, rate, and timestamp them, along with the ability to remove unwanted entries. It also has basic infinite scrolling.

## Installation

1. Clone the repository:
```
https://github.com/DaKoolest/spotify-app
```
2. Navigate to the project directory:
```
cd spotify-app
```
3. Create a virtual environment:
```
python3 -m venv env
```
4. Activate the virtual environment:
- On macOS and Linux:
  ```
  source env/bin/activate
  ```
- On Windows:
  ```
  env\Scripts\activate
  ```

5. Install the required packages:
```
pip install -r requirements.txt
```

## Configuration

Before running the app, you need to set the following environment variables:

- `FLASK_APP`: The entry point of your Flask app (usually `app.py`).
- `FLASK_RUN_PORT`: The port on which the Flask app will run (e.g., `5000`).

You also need to set the following Spotify API credentials as environment variables:

- `SPOTIPY_CLIENT_ID`: Your Spotify API client ID.
- `SPOTIPY_CLIENT_SECRET`: Your Spotify API client secret.
- `SPOTIPY_REDIRECT_URI`: The redirect URI for Spotify authorization (e.g., `http://localhost:5000/authorize`).

## Usage

1. Run the app:
```
flask run
```
2. Open a web browser and go to the specified address (usually `http://localhost:5000`).

3. Follow the on-screen instructions to log in with your Spotify account and use the app.



