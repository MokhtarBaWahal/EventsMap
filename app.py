import io

from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

# Import models and db from models.py
from models import db, User, Pin, Image

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


# New get_events function using database
@app.route('/events/<int:year>')
def get_events(year):
    events = Pin.query.filter(Pin.year == int(year)).all()
    events_data = [
        {
            "title": event.title,
            "description": event.description,
            "coordinates": event.coordinates.split(','),
            "image": url_for('get_image', image_id=event.images[0].id) if event.images else None,
            "year": event.year,
            "category": event.category
        }
        for event in events
    ]
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
            return "Passwords do not match", 400

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


# Function to initialize the database
def initialize_database():
    with app.app_context():
        # Create all the tables from models.py
        db.create_all()
        print("Database initialized and tables created.")


if __name__ == '__main__':
    initialize_database()
    app.run(debug=True)
