import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask import Flask, render_template, url_for, session, request, redirect, jsonify
import time
import os


# App config
app = Flask(__name__)

app.secret_key = os.getenv('FLASK_SECRET_KEY')
app.config['album-tracker'] = 'spotify-login-session'

@app.route('/')
def home():
    return render_template('home.html', session=session)

@app.route('/login')
def login():
    sp_oauth = create_spotify_oauth()
    auth_url = sp_oauth.get_authorize_url()
    print(auth_url)
    return redirect(auth_url)

@app.route('/authorize')
def authorize():
    sp_oauth = create_spotify_oauth()
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    
    print(token_info)

    session["token_info"] = token_info
    return redirect("/")

@app.route('/logout')
def logout():
    session.clear()
    for key in list(session.keys()):
        session.pop(key)
    
    print(session)
    return redirect('/')

@app.route('/getUserInfo')
def get_user_info():
    session['token_info'], authorized = get_token()
    session.modified = True

    if not authorized:
        return redirect('/login')
    sp = spotipy.Spotify(auth=session.get('token_info').get('access_token'))
    data = sp.current_user()

    return data

@app.route('/getTopTen')
def get_top_ten():
    session['token_info'], authorized = get_token()
    session.modified = True

    if not authorized:
        return redirect('/login')
    sp = spotipy.Spotify(auth=session.get('token_info').get('access_token'))
    data = sp.current_user_top_tracks(10, 0, "short_term")
 
    return jsonify(data['items'])

@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()  # Get the JSON data from the POST request
    search_query = data.get('query')
    search_type = data.get('type')
    search_limit = data.get('limit')

    if search_query != '':
        session['token_info'], authorized = get_token()
        session.modified = True

        if not authorized:
            return redirect('/login')
        
        sp = spotipy.Spotify(auth=session.get('token_info').get('access_token'))
        data = sp.search(q=search_query, type=search_type, limit=search_limit)

        return jsonify(data['albums']['items'])
    else:
        return jsonify([])

def get_token():
    token_valid = False
    token_info = session.get("token_info", {})

    # Checking if the session already has a token stored
    if not (session.get('token_info', False)):
        token_valid = False
        return token_info, token_valid

    # Checking if token has expired
    now = int(time.time())
    is_token_expired = session.get('token_info').get('expires_at') - now < 60

    # Refreshing token if it has expired
    if (is_token_expired):
        sp_oauth = create_spotify_oauth()
        token_info = sp_oauth.refresh_access_token(session.get('token_info').get('refresh_token'))

    token_valid = True
    print(token_info)
    return token_info, token_valid


def create_spotify_oauth():
    return SpotifyOAuth(
            client_id=os.getenv('CLIENT_ID'),
            client_secret=os.getenv('CLIENT_SECRET'),
            redirect_uri=url_for('authorize', _external=True),
            scope='user-top-read',
            show_dialog=True)