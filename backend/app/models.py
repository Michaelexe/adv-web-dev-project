import uuid
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from . import db


def generate_uuid():
	return str(uuid.uuid4())


class User(db.Model):
	__tablename__ = 'users'
	uid = db.Column(db.String(36), primary_key=True, default=generate_uuid)
	name = db.Column(db.String(128), nullable=False)
	email = db.Column(db.String(255), unique=True, nullable=False, index=True)
	password_hash = db.Column(db.String(255), nullable=False)

	# relationships
	clubs = db.relationship('ClubMember', back_populates='user', cascade='all, delete-orphan')

	def set_password(self, password):
		self.password_hash = generate_password_hash(password)

	def check_password(self, password):
		return check_password_hash(self.password_hash, password)

	def __repr__(self):
		return f"<User {self.email}>"


class Club(db.Model):
	__tablename__ = 'clubs'
	uid = db.Column(db.String(36), primary_key=True, default=generate_uuid)
	name = db.Column(db.String(255), nullable=False)
	description = db.Column(db.Text, nullable=True)
	budget = db.Column(db.Numeric(12, 2), nullable=False, default=500)
	# Optional media
	icon_url = db.Column(db.String(1024), nullable=True)
	# store social media links as JSON: {"twitter": "...", "facebook": "..."}
	social_links = db.Column(db.JSON, nullable=True)
	status = db.Column(db.String(50), nullable=False, default='Approved')
	members = db.relationship('ClubMember', back_populates='club', cascade='all, delete-orphan')

	def __repr__(self):
		return f"<Club {self.name}>"


class ClubMember(db.Model):
	__tablename__ = 'club_members'
	id = db.Column(db.Integer, primary_key=True)
	user_uid = db.Column(db.String(36), db.ForeignKey('users.uid'), nullable=False)
	club_uid = db.Column(db.String(36), db.ForeignKey('clubs.uid'), nullable=False)
	type = db.Column(db.String(50), nullable=False, default='member')  # 'member' or 'exec'
	role = db.Column(db.String(255), nullable=True)  # role when exec (e.g., 'president')
	joined_at = db.Column(db.DateTime, default=datetime.utcnow)

	user = db.relationship('User', back_populates='clubs')
	club = db.relationship('Club', back_populates='members')

	def __repr__(self):
		return f"<ClubMember user={self.user_uid} club={self.club_uid} type={self.type}>"


class Event(db.Model):
	__tablename__ = 'events'
	uid = db.Column(db.String(36), primary_key=True, default=generate_uuid)
	name = db.Column(db.String(255), nullable=False)
	start_datetime = db.Column(db.DateTime, nullable=False)
	end_datetime = db.Column(db.DateTime, nullable=True)
	# link event to a club (optional). Only execs of the club can manage linked events.
	club_uid = db.Column(db.String(36), db.ForeignKey('clubs.uid'), nullable=True, index=True)
	description = db.Column(db.Text, nullable=True)
	location = db.Column(db.String(255), nullable=True)
	limit = db.Column(db.Integer, nullable=True)
	type = db.Column(db.String(50), nullable=False)  # 'in-person' or 'online'
	status = db.Column(db.String(50), nullable=False, default='scheduled')

	# Optional media
	banner_url = db.Column(db.String(1024), nullable=True)

	participants = db.relationship('EventParticipant', back_populates='event', cascade='all, delete-orphan')

	club = db.relationship('Club', backref=db.backref('events', cascade='all, delete-orphan'))

	def __repr__(self):
		return f"<Event {self.name} ({self.uid})>"


class EventParticipant(db.Model):
	__tablename__ = 'event_participants'
	id = db.Column(db.Integer, primary_key=True)
	user_uid = db.Column(db.String(36), db.ForeignKey('users.uid'), nullable=False)
	event_uid = db.Column(db.String(36), db.ForeignKey('events.uid'), nullable=False)
	type = db.Column(db.String(50), nullable=False)  # 'inperson' or 'online'
	joined_at = db.Column(db.DateTime, default=datetime.utcnow)

	user = db.relationship('User', backref=db.backref('event_participations', cascade='all, delete-orphan'))
	event = db.relationship('Event', back_populates='participants')

	def __repr__(self):
		return f"<EventParticipant user={self.user_uid} event={self.event_uid} type={self.type}>"


class Course(db.Model):
	"""Scraped course data for calendar heatmap analysis"""
	__tablename__ = 'courses'
	id = db.Column(db.Integer, primary_key=True)
	course_code = db.Column(db.String(50), unique=True, nullable=False, index=True)
	course_name = db.Column(db.String(255), nullable=False)
	schedule_raw = db.Column(db.String(255))  # Raw schedule string from portal
	students_enrolled = db.Column(db.Integer, default=0)
	created_at = db.Column(db.DateTime, default=datetime.utcnow)
	updated_at = db.Column(db.DateTime, default=datetime.utcnow)
	
	# Relationship to time slots
	time_slots = db.relationship('TimeSlot', back_populates='course', cascade='all, delete-orphan')

	def __repr__(self):
		return f"<Course {self.course_code} - {self.course_name}>"


class TimeSlot(db.Model):
	"""Individual time slots for calendar heatmap visualization"""
	__tablename__ = 'time_slots'
	id = db.Column(db.Integer, primary_key=True)
	course_code = db.Column(db.String(50), db.ForeignKey('courses.course_code'), nullable=False)
	day_of_week = db.Column(db.String(20), nullable=False)  # Monday, Tuesday, etc.
	start_time = db.Column(db.Time, nullable=False)  # e.g., 10:00
	end_time = db.Column(db.Time, nullable=False)  # e.g., 11:30
	students_count = db.Column(db.Integer, default=0)  # Number of students in this slot
	
	# Relationship to course
	course = db.relationship('Course', back_populates='time_slots')

	def __repr__(self):
		return f"<TimeSlot {self.course_code} {self.day_of_week} {self.start_time}-{self.end_time}>"


class Comment(db.Model):
	"""Comments on events for discussions"""
	__tablename__ = 'comments'
	uid = db.Column(db.String(36), primary_key=True, default=generate_uuid)
	event_uid = db.Column(db.String(36), db.ForeignKey('events.uid'), nullable=False, index=True)
	user_uid = db.Column(db.String(36), db.ForeignKey('users.uid'), nullable=False)
	parent_uid = db.Column(db.String(36), db.ForeignKey('comments.uid'), nullable=True)  # For replies
	content = db.Column(db.Text, nullable=False)
	created_at = db.Column(db.DateTime, default=datetime.utcnow)
	
	# Relationships
	user = db.relationship('User', backref=db.backref('comments', cascade='all, delete-orphan'))
	event = db.relationship('Event', backref=db.backref('comments', cascade='all, delete-orphan'))
	# Self-referential relationship for replies
	replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[uid]), cascade='all, delete-orphan')

	def __repr__(self):
		return f"<Comment {self.uid} by {self.user_uid} on {self.event_uid}>"
