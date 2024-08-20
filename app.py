from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import json
import os
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads/'
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Ensure upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)
    coordinates = db.Column(db.String(100), nullable=True)  # Added coordinates field

    # Add these properties to satisfy Flask-Login requirements

    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True  # If you want to implement user activation, you can change this logic

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)  # Flask-Login expects the ID to be a string


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Event loading and saving functions
def load_events():
    with open('events.json') as f:
        return json.load(f)


def save_events(events_data):
    with open('events.json', 'w') as f:
        json.dump(events_data, f, indent=4)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/events/<int:year>')
def get_events(year):
    events_data = load_events()
    events = events_data.get(str(year), [])
    return jsonify(events)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/add_event', methods=['GET', 'POST'])
@login_required
def add_event():
    if request.method == 'POST':
        title = request.form.get('title')
        year = request.form.get('year')
        description = request.form.get('description')
        coordinates = request.form.get('coordinates')  # Assuming coordinates are submitted as a list of strings
        print(coordinates)
        coordinates = coordinates.split('and')  # Convert to float

        # Handling the file upload
        image = request.files.get('image')
        if image and allowed_file(image.filename):
            # Secure the filename
            filename = secure_filename(image.filename)
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(image_path)

            # Generate the URL for the uploaded image
            image_url = url_for('static', filename='uploads/' + filename)
        else:
            return "Invalid image file.", 400

        # Load existing events data
        events_data = load_events()

        # Create a new event
        new_event = {
            "year": int(year),
            "title": title,
            "description": description,
            "coordinates": coordinates,
            "image": image_url
        }

        # Add the new event to the specified year
        if year in events_data:
            events_data[year].append(new_event)
        else:
            events_data[year] = [new_event]

        # Save the updated events data
        save_events(events_data)

        # Redirect or return success message
        return redirect(url_for('index'))

    return render_template('add-event.html')


@app.route('/drop_pin', methods=['GET', 'POST'])
def drop_pin():
    if request.method == 'POST':
        # Handle logic for dropped pins (e.g., storing coordinates)
        return redirect(url_for('index'))
    return render_template('drop-pin.html')


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
        print(username)
        user = User.query.filter_by(username=username).first()
        print(user)
        if user and check_password_hash(user.password, password):
            print("Correct")
            login_user(user)
            return redirect(url_for('index'))
        else:
            print("Wrong")
            flash('Login Unsuccessful. Please check email and password', 'danger')
    return render_template('login.html')


# User logout
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True, port=5001)
