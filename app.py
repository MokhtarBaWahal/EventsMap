import io

import zipfile

from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

# Import models and db from models.py
from models import db, User, Pin, Image, Comment

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
        if image and allowed_file(image.filename):
            # Secure the filename and read the image data
            image_data = image.read()

            # Create a new Image object and store it in the database
            new_image = Image(image_data=image_data)
            db.session.add(new_image)
            db.session.commit()

            # Create a new Pin (Event) and associate it with the uploaded image
            new_event = Pin(
                title=title,
                year=year,
                category=category,  # Use the selected category
                description=description,
                coordinates=','.join(coordinates),
                user_id=current_user.id
            )
            new_event.images.append(new_image)  # Associate the image with the event
            db.session.add(new_event)
            db.session.commit()

            # Redirect or return success message
            print("Commited")
            return redirect(url_for('index'))

        else:
            return "Invalid image file.", 400

    return render_template('add-event.html')


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
@login_required
def like_pin(pin_id):
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


@app.route('/download_images')
def download_images():
    # Create an in-memory zip file
    zip_buffer = io.BytesIO()

    # Create a zip file object
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Query all the images from the database
        images = Image.query.all()

        # Loop over all the images and add them to the zip file
        for image in images:
            # For each image, create a filename (you can customize this format)
            image_filename = f"pin_{image.pin_id}_image_{image.id}.jpg"

            # Add the image data to the zip file with the generated filename
            zip_file.writestr(image_filename, image.image_data)

    # Set the buffer's position to the start
    zip_buffer.seek(0)

    # Send the zip file as a response
    return send_file(zip_buffer, as_attachment=True, download_name='pin_images.zip', mimetype='application/zip')


@app.route('/get_comments/<int:pin_id>', methods=['GET'])
def get_comments(pin_id):
    comments = Comment.query.filter_by(pin_id=pin_id).all()
    comments_data = []

    # Convert comment objects to JSON-serializable dictionaries
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'text': comment.text,
            'timestamp': comment.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'user': comment.user_id  # You can modify this to include user name if necessary
        })

    return jsonify(comments_data)


@app.route('/submit_comment', methods=['POST'])
def submit_comment():
    data = request.get_json()
    pin_id = data.get('pin_id')
    text = data.get('text')

    if not text or not pin_id:
        return jsonify({'error': 'Invalid input'}), 400

    # Assuming user_id is available (e.g., from session or JWT token)
    user_id = 1  # Replace with logic to get the actual user ID

    # Create a new comment and save it to the database
    new_comment = Comment(text=text, pin_id=pin_id, user_id=user_id)
    db.session.add(new_comment)
    db.session.commit()

    return jsonify({'message': 'Comment submitted successfully!'})
# Function to initialize the database
def initialize_database():
    with app.app_context():
        # Create all the tables from models.py
        db.create_all()
        print("Database initialized and tables created.")


if __name__ == '__main__':
    initialize_database()
    app.run(debug=True)
