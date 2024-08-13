from flask import Flask, render_template, jsonify, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'


# User model
class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)


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
    # if not current_user.is_authenticated:
    #     return redirect(url_for('login'))
    return render_template('index.html')



@app.route('/events/<int:year>')
def get_events(year):
    events_data = load_events()
    events = events_data.get(str(year), [])
    return jsonify(events)


@app.route('/add_event', methods=['POST'])
@login_required
def add_event():
    new_event = request.json
    events_data = load_events()
    year = str(new_event['year'])
    if year in events_data:
        events_data[year].append(new_event)
    else:
        events_data[year] = [new_event]
    save_events(events_data)
    return jsonify({'status': 'success'}), 201


# User registration
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        user = User(username=username, email=email, password=password)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return redirect(url_for('index'))
    return render_template('register.html')


# User login
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email, password=password).first()
        if user:
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


if __name__ == '__main__':
    app.run(debug=True, port=5001)
