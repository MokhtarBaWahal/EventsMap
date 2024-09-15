from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()

# Association table for likes
likes = db.Table('likes',
                 db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
                 db.Column('pin_id', db.Integer, db.ForeignKey('pin.id'), primary_key=True),
                 db.Column('timestamp', db.DateTime, default=datetime.utcnow)  # Optional
                 )

# Association table for seen pins
seen_pins = db.Table('seen_pins',
                     db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
                     db.Column('pin_id', db.Integer, db.ForeignKey('pin.id'), primary_key=True),
                     db.Column('timestamp', db.DateTime, default=datetime.utcnow)
                     )


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password = db.Column(db.String(150), nullable=False)
    coordinates = db.Column(db.String(100), nullable=True)

    # Relationship to Pin (pins opened by the user)
    pins_opened = db.relationship('Pin', backref='user', lazy=True)

    # Relationship to liked pins
    liked_pins = db.relationship(
        'Pin',
        secondary=likes,
        backref=db.backref('liked_by', lazy='dynamic'),
        lazy='dynamic'
    )

    seen_pins = db.relationship(
        'Pin',
        secondary=seen_pins,
        backref=db.backref('seen_by', lazy='dynamic'),
        lazy='dynamic'
    )

    # Relationship to comments made by the user
    comments = db.relationship('Comment', backref='author', lazy=True)

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
    no_of_likes = db.Column(db.Integer, default=0)  # Optional
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'),
                        nullable=False)  # Reference to the user who created the pin
    images = db.relationship('Image', backref='pin', lazy=True)  # Relationship to Image
    year = db.Column(db.Integer, nullable=False)  # Year column, allowing negative values for BCE years

    # New date field
    date_created = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to comments on the pin
    comments = db.relationship('Comment', backref='pin', lazy=True)


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Foreign key to reference the user who made the comment
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Foreign key to reference the pin the comment belongs to
    pin_id = db.Column(db.Integer, db.ForeignKey('pin.id'), nullable=False)
