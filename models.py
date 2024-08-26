from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)
    coordinates = db.Column(db.String(100), nullable=True)
    pins_opened = db.relationship('Pin', backref='user', lazy=True)  # Relationship to Pin

    @property
    def is_authenticated(self):
        return True

    @property
    def is_active(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.id)


class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image_data = db.Column(db.LargeBinary, nullable=False)  # Stores raw image data
    pin_id = db.Column(db.Integer, db.ForeignKey('pin.id'))  # Reference to the associated pin


class Pin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(500), nullable=True)
    coordinates = db.Column(db.String(100), nullable=True)
    no_of_likes = db.Column(db.Integer, default=0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)  # Reference to the user who created the pin
    images = db.relationship('Image', backref='pin', lazy=True)  # Relationship to Image
    year = db.Column(db.Integer, nullable=False)  # Year column, allowing negative values for BCE years
