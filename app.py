import spotipy
from flask import Flask, render_template, url_for, session, request, redirect, jsonify
import os
from datetime import timedelta
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import PrimaryKeyConstraint

from dotenv import load_dotenv
load_dotenv()


# App config
app = Flask(__name__)
app.secret_key = os.urandom(64)

app.config['album-tracker'] = 'spotify-login-session'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///user_albums.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# UserAlbum entry model for SQL
class UserAlbum(db.Model):
    __tablename__ = 'user_albums'
    user_id = db.Column(db.String, primary_key=True)
    album_id = db.Column(db.String, primary_key=True)
    date = db.Column(db.String)
    rating = db.Column(db.Integer)
    review = db.Column(db.String)

    __table_args__ = (
        PrimaryKeyConstraint("user_id", "album_id"),
    )

# index auto routes to /library
@app.route('/')
def index():
    return redirect('/library')

# displays library where user can view entries
@app.route('/library')
def library():
    return render_template('library.html', session=session)

# displays search where use can find new albums to add
@app.route('/search')
def search():
    return render_template('search.html', session=session)

# displays album view, where users can add/edit entries
@app.route('/album-view')
def album_view():
    return render_template('album-view.html', albumid=request.args.get('albumid'))

# logs user in through spotify
@app.route('/login')
def login():
    _, auth_manager = get_spotify_auth_manager()

    # passes the caller of login as the state to redirect user to correct page after logging in
    auth_url = auth_manager.get_authorize_url(state=request.referrer)
    return redirect(auth_url)

# called on succesfully authorization/login via spotify
@app.route('/authorize')
def authorize():
    _, auth_manager = get_spotify_auth_manager()
    auth_manager.get_access_token(request.args.get("code"))

    # saves user id as cookie
    session["user"] = get_spotify_obj().current_user().get("id")
    print(session["user"])

    referrer_url = request.args.get("state")
    return redirect(referrer_url or '/')

# logs user out
@app.route('/logout')
def logout():
    session.clear()
    for key in list(session.keys()):
        session.pop(key)
    
    print(session)
    return redirect('/')

# returns json about current users profile information
@app.route('/getUserInfo')
def get_user_info():
    spotify = get_spotify_obj()
    
    return spotify.current_user()

# searchs spotify api for albums and returns a list of them in json
@app.route('/searchAlbums', methods=['POST'])
def search_albums():
    post_data = request.get_json()
    search_query = post_data.get('query')
    search_type = post_data.get('type')
    search_limit = post_data.get('limit')

    # checks that user is not only searches whitespace
    if len(search_query.strip()) != 0:
        spotify = get_spotify_obj()
        data = spotify.search(q=search_query, type=search_type, limit=search_limit)

        return jsonify(data['albums']['items'])
    else:
        return jsonify([])

# adds a user entry if the user is signed in
@app.route('/addUserAlbum', methods=['POST'])
def add_user_album():
    data = request.json

    # check that user is signed in
    if "user" in session:

        user_id = session['user']
        album_id = data.get('albumId')
        new_date = data.get('date')
        new_rating = data.get('rating')
        new_review = data.get('review')
        
        # gets the current entry with the provided user and album ids
        existing_entry = UserAlbum.query.filter_by(user_id=user_id, album_id=album_id).first()

        # if an entry doesnt exist, creates a new one
        if existing_entry is not None:
            existing_entry.date = new_date
            existing_entry.rating = new_rating
            existing_entry.review = new_review
        # else, edits the existing one
        else:
            new_entry = UserAlbum(user_id=user_id, album_id=album_id, date=new_date,
                              rating=new_rating, review=new_review)
            db.session.add(new_entry)

        db.session.commit()
        return jsonify({'message': 'Album added'})
        
    else:
        return jsonify({'message': 'User not logged in'})

# gets entry with given album and user id
@app.route('/getUserAlbum', methods=['POST'])
def get_user_album():
    data = request.json

    # checks that user is logged in
    if "user" in session:
        user_id = session['user']
        album_id = data.get('albumId')

        # gets entry
        existing_entry = UserAlbum.query.filter_by(user_id=user_id, album_id=album_id).first()

        # if it exists, get the entry's data to be returned
        if existing_entry is not None:
            album_info = {
                "date": existing_entry.date,
                "rating": existing_entry.rating,
                "review": existing_entry.review
            }
            return jsonify(album_info)
        else:
            return jsonify({"message": "Album entry not found."})
        
    return jsonify({"message": "User not logged in."})
            
# returns a certain amount of userAlbum entries, specified by the post requests
# limit and offset
@app.route('/getUserAlbums', methods=['POST'])
def get_user_albums():
    data = request.json
    offset = data.get('offset')
    limit = data.get('limit')

    if "user" in session:
        user_id = session['user']

        entries = UserAlbum.query.filter_by(user_id=user_id).offset(offset).limit(limit).all()

        entries_list = []

        # iterates through UserAlbum's and converts them to dictionaries to be returned as json
        for entry in entries:
            entry_dict = {
                'user_id': entry.user_id,
                'album_id': entry.album_id,
                'date': entry.date,
                'rating': entry.rating,
                'review': entry.review
            }
            entries_list.append(entry_dict)
            
        return jsonify(entries_list)
        
    return jsonify({"message": "User not logged in."})

# gets album information and returns json
@app.route('/getAlbum', methods=['POST'])
def get_album():
    album_id = request.json.get('albumId')
    spotify = get_spotify_obj()

    return spotify.album(album_id=album_id)

# deletes userAlbum entry with given user and album id
@app.route('/deleteUserAlbum', methods=['POST'])
def delete_user_album():
    album_id = request.json.get('albumId')
    user_id = session['user']

    # if user is signed in
    if user_id:
        entry_to_delete = UserAlbum.query.filter_by(user_id=user_id, album_id=album_id).first()

        if entry_to_delete:
            db.session.delete(entry_to_delete)
            db.session.commit()
            return jsonify({'message': 'Album entry deleted successfully'})
        else:
            return jsonify({'message': 'Album entry not found'})
    
    return jsonify({"message": "User not logged in."})
    
# gets a spotify object to make api calls
def get_spotify_obj():
    cache_handler, auth_manager = get_spotify_auth_manager()

    if not auth_manager.validate_token(cache_handler.get_cached_token()):
        return redirect('/')
    else:
        return spotipy.Spotify(auth_manager=auth_manager)

# creates and returns a cache handler and SpotifyOAuth object
def get_spotify_auth_manager():

    cache_handler = spotipy.cache_handler.FlaskSessionCacheHandler(session)
    auth_manager = spotipy.oauth2.SpotifyOAuth(scope='user-read-private user-top-read',
                                               cache_handler=cache_handler,
                                               show_dialog=True)

    return cache_handler, auth_manager

if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()
            print("Database schema created successfully.")
        except Exception as e:
            print("An error occurred while creating the database schema:", e)
    app.run(port=os.getenv('FLASK_RUN_PORT'))