import io

import zipfile
from datetime import datetime

from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

# Import models and db from models.py
from models import db, User, Pin, Image, Comment

import io
import zipfile
import json
from flask import send_file
from models import User, Pin, Image, Comment  # Assuming models are in a separate file
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Ensure upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/events/<year>')
def get_events(year):
    try:
        # Convert the year to an integer, including handling for negative values (BC years)
        year = int(year)
    except ValueError:
        return jsonify({"error": "Invalid year format"}), 400

    # Query events for the specified year
    events = Pin.query.filter(Pin.year == year).all()

    # Prepare the events data
    events_data = [
        {"id": event.id,
         "title": event.title,
         "description": event.description,
         "coordinates": event.coordinates.split(','),
         "image": url_for('get_image', image_id=event.images[0].id) if event.images else None,
         "year": event.year,
         "category": event.category,
         "author": User.query.get(event.user_id). username,
         'is_author': event.user_id == current_user.id if current_user.is_authenticated else False,
         "no_of_likes": event.no_of_likes,
         "is_liked": event in current_user.liked_pins if current_user.is_authenticated else False,
         "like_state": "btn btn-outline-danger" if current_user.is_authenticated and event in current_user.liked_pins else "btn btn-danger",
         "date": event.date_created.strftime('%Y/%m/%d') if event.date_created else None
         }
        for event in events
    ]

    # Return the events as JSON
    return jsonify(events_data)


# New add_event function using database
@app.route('/add_event', methods=['GET', 'POST'])
@login_required
def add_event():
    if request.method == 'POST':
        title = request.form.get('title')
        year = request.form.get('year')
        description = request.form.get('description')
        coordinates = request.form.get('coordinates')  # Assuming coordinates are submitted as a string
        coordinates = coordinates.split('and')  # Convert to a string of coordinates separated by a comma
        # Retrieve the selected category from the form
        category = request.form.get('category')

        # Handling the file upload
        image = request.files.get('image')

        # Create a new Pin (Event) and associate it with the uploaded image
        new_event = Pin(
            title=title,
            year=year,
            category=category,  # Use the selected category
            description=description,
            coordinates=','.join(coordinates),
            user_id=current_user.id
        )

        if image:
            if allowed_file(image.filename):
                # Secure the filename and read the image data
                image_data = image.read()

                # Create a new Image object and store it in the database
                new_image = Image(image_data=image_data)
                db.session.add(new_image)
                db.session.commit()
                new_event.images.append(new_image)  # Associate the image with the event
            else:
                flash("Image should be in the png, jpg, jpeg, gif format ", "error")
                return render_template('add-event.html')

        db.session.add(new_event)
        db.session.commit()

        # Redirect or return success message
        print("Commited")
        return redirect(url_for('index'))

    return render_template('add-event.html')


from flask import render_template, redirect, url_for, flash

@app.route('/delete_pin/<int:pin_id>', methods=['POST'])
@login_required
def delete_pin(pin_id):
    pin = Pin.query.get_or_404(pin_id)

    if pin.user_id != current_user.id:
        # flash('You do not have permission to delete this pin.')
        return redirect(url_for('index'))  # Redirect to index or another page

    # Delete all comments associated with the pin
    Comment.query.filter_by(pin_id=pin_id).delete()
    db.session.delete(pin)
    db.session.commit()
    # flash('Pin has been deleted successfully.')
    return redirect(url_for('index'))  # Redirect to index or another page



@app.route('/filter_pins', methods=['POST'])
def filter_pins():
    filters = request.json
    categories = filters.get('categories', [])
    visibility = filters.get('visibility', 'all')

    query = Pin.query

    # Filter by categories
    if categories:
        query = query.filter(Pin.category.in_(categories))

    # Filter by visibility
    if visibility == 'unseen':
        # Example logic for unseen pins (replace with actual implementation)
        query = query.filter_by(seen=False)

    filtered_pins = query.all()

    pins_data = [
        {
            "title": pin.title,
            "description": pin.description,
            "coordinates": pin.coordinates.split(','),
            "image": url_for('get_image', image_id=pin.images[0].id) if pin.images else None,
            "year": pin.year,
            "category": pin.category
        }
        for pin in filtered_pins
    ]

    return jsonify(pins_data)


@app.route('/signup', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form['password']
        confirm_password = request.form.get('confirm-password')
        coordinates = request.form.get('coordinates')  # Capture coordinates

        # Check if passwords match
        if password != confirm_password:
            flash("Passwords do not match", "error")
            return redirect(url_for('register'))

        # Check if the username already exists in the database
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash("Username already exists. Please choose another.", "error")
            return redirect(url_for('register'))

        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            flash("Email already exists. Please use another.", "error")
            return redirect(url_for('register'))

        hashed_password = generate_password_hash(password, method='pbkdf2')
        user = User(username=username, email=email, password=hashed_password, coordinates=coordinates)
        db.session.add(user)
        db.session.commit()
        coordinates = coordinates.split('and')

        # Create a Pin saying the user joined while here
        pin = Pin(
            title="New member joined us!",
            category="Users",
            description=f"{username} joined us while they were here!",
            coordinates=','.join(coordinates),
            user_id=user.id,
            year=datetime.utcnow().year  # Store the current year
        )
        db.session.add(pin)
        db.session.commit()

        login_user(user)
        return redirect(url_for('index'))

    return render_template('register.html')


# User login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
    return render_template('login.html')


# User logout
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


# Image serving route
@app.route('/image/<int:image_id>')
def get_image(image_id):
    image = Image.query.get_or_404(image_id)
    return send_file(io.BytesIO(image.image_data), mimetype='image/jpeg')


@app.route('/like/<int:pin_id>', methods=['POST'])
def like_pin(pin_id):

    if not current_user.is_authenticated:
        return jsonify({'success': False, 'error':'current_user is not authenticated'})
    pin = Pin.query.get_or_404(pin_id)

    if pin in current_user.liked_pins:
        current_user.liked_pins.remove(pin)
        pin.no_of_likes -= 1
        liked = False
    else:
        current_user.liked_pins.append(pin)
        pin.no_of_likes += 1
        liked = True

    db.session.commit()

    return jsonify({
        'success': True,
        'liked': liked,
        'new_like_count': pin.no_of_likes
    })


@app.route('/back_up')
def back_up():
    # Create an in-memory zip file
    zip_buffer = io.BytesIO()

    # Create a zip file object
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:

        # 1. Backup Users
        users = User.query.all()
        users_data = []
        for user in users:
            users_data.append({
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "coordinates": user.coordinates,
                "pins_opened": [pin.id for pin in user.pins_opened],
                "liked_pins": [pin.id for pin in user.liked_pins],
                "comments": [comment.id for comment in user.comments]
            })
        zip_file.writestr("users.json", json.dumps(users_data, default=str))

        # 2. Backup Pins
        pins = Pin.query.all()
        pins_data = []
        for pin in pins:
            pins_data.append({
                "id": pin.id,
                "title": pin.title,
                "category": pin.category,
                "description": pin.description,
                "coordinates": pin.coordinates,
                "no_of_likes": pin.no_of_likes,
                "user_id": pin.user_id,
                "year": pin.year,
                "date_created": pin.date_created,
                "comments": [comment.id for comment in pin.comments],
                "images": [image.id for image in pin.images]
            })
        zip_file.writestr("pins.json", json.dumps(pins_data, default=str))

        # 3. Backup Comments
        comments = Comment.query.all()
        comments_data = []
        for comment in comments:
            comments_data.append({
                "id": comment.id,
                "text": comment.text,
                "timestamp": comment.timestamp,
                "user_id": comment.user_id,
                "pin_id": comment.pin_id
            })
        zip_file.writestr("comments.json", json.dumps(comments_data, default=str))

        # 4. Backup Images
        images = Image.query.all()
        for image in images:
            image_filename = f"pin_{image.pin_id}_image_{image.id}.jpg"
            zip_file.writestr(image_filename, image.image_data)

    # Set the buffer's position to the start
    zip_buffer.seek(0)

    # Send the zip file as a response
    return send_file(zip_buffer, as_attachment=True, download_name=f'backup_{datetime.utcnow().strftime("%Y%m%d")}.zip',
                     mimetype='application/zip')


@app.route('/get_comments/<int:pin_id>', methods=['GET'])
def get_comments(pin_id):
    comments = Comment.query.filter_by(pin_id=pin_id).all()
    comments_data = []

    # Convert comment objects to JSON-serializable dictionaries
    for comment in comments:
        user = User.query.get(comment.user_id)
        comments_data.append({
            'id': comment.id,
            'text': comment.text,
            'timestamp': comment.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'user': user.username  # You can modify this to include user name if necessary
        })

    return jsonify(comments_data)


@app.route('/submit_comment', methods=['POST'])
def submit_comment():
    data = request.get_json()
    pin_id = data.get('pin_id')
    text = data.get('text')

    if not text or not pin_id:
        return jsonify({'error': 'Invalid input'}), 400

    # Create a new comment and save it to the database
    new_comment = Comment(text=text, pin_id=pin_id, user_id=current_user.id)
    db.session.add(new_comment)
    db.session.commit()

    return jsonify({'message': 'Comment submitted successfully!'})


def get_unseen_pins(user):
    unseen_pins = Pin.query.filter(~Pin.seen_by.any(id=user.id)).all()
    return unseen_pins


@app.route('/unseen_pins')
@login_required
def unseen_pins():
    unseen_pins = Pin.query.filter(~Pin.seen_by.any(id=current_user.id)).all()
    unseen_pin_ids = [pin.id for pin in unseen_pins]
    return jsonify({'unseen_pin_ids': unseen_pin_ids})


@app.route('/mark_as_seen', methods=['POST'])
def mark_as_seen():
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'error': 'current_user is not authenticated'})
    data = request.get_json()
    event_id = data.get('event_id')

    if event_id:
        # Fetch the pin by ID
        pin = Pin.query.get(event_id)
        if pin:
            # Mark the pin as seen for the current user
            if not current_user.seen_pins.filter_by(id=pin.id).first():
                current_user.seen_pins.append(pin)
                db.session.commit()
                return jsonify({'success': True})
            else:
                return jsonify({'success': False, 'error': 'Pin already marked as seen.'})
        else:
            return jsonify({'success': False, 'error': 'Pin not found.'})
    else:
        return jsonify({'success': False, 'error': 'Invalid event ID.'})

# Function to initialize the database
def initialize_database():
    with app.app_context():
        # Create all the tables from models.py
        db.create_all()
        print("Database initialized and tables created.")


if __name__ == '__main__':
    initialize_database()
    app.run(debug=True)
