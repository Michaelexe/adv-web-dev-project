from flask import Blueprint, jsonify
from sqlalchemy import func
from .. import db
from ..models import TimeSlot, Course

bp = Blueprint('calendar', __name__, url_prefix='/calendar')


@bp.route('/heatmap', methods=['GET'])
def get_heatmap_data():
	"""
	Get calendar heatmap data showing student density by day/time
	Returns aggregated data for visualization
	"""
	try:
		# Aggregate students by day and time slot
		heatmap_data = db.session.query(
			TimeSlot.day_of_week,
			TimeSlot.start_time,
			TimeSlot.end_time,
			func.sum(TimeSlot.students_count).label('total_students'),
			func.count(TimeSlot.id).label('course_count')
		).group_by(
			TimeSlot.day_of_week,
			TimeSlot.start_time,
			TimeSlot.end_time
		).order_by(
			TimeSlot.start_time
		).all()

		# Format data for frontend
		result = []
		for slot in heatmap_data:
			result.append({
				'day': slot.day_of_week,
				'start_time': slot.start_time.strftime('%H:%M'),
				'end_time': slot.end_time.strftime('%H:%M'),
				'total_students': slot.total_students,
				'course_count': slot.course_count,
				'density': slot.total_students  # Used for heatmap intensity
			})

		return jsonify({
			'success': True,
			'data': result,
			'total_slots': len(result)
		}), 200

	except Exception as e:
		return jsonify({'error': str(e)}), 500


@bp.route('/optimal-times', methods=['GET'])
def get_optimal_times():
	"""
	Get optimal times for events (times with LEAST student activity)
	"""
	try:
		# Get all possible days
		days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
		
		# Get busy times
		busy_times = db.session.query(
			TimeSlot.day_of_week,
			TimeSlot.start_time,
			TimeSlot.end_time,
			func.sum(TimeSlot.students_count).label('total_students')
		).group_by(
			TimeSlot.day_of_week,
			TimeSlot.start_time,
			TimeSlot.end_time
		).all()

		# Convert to dict for easy lookup
		busy_dict = {}
		for slot in busy_times:
			key = f"{slot.day_of_week}_{slot.start_time.strftime('%H:%M')}"
			busy_dict[key] = slot.total_students

		# Find least busy times per day
		optimal_times = []
		for day in days:
			day_slots = [s for s in busy_times if s.day_of_week == day]
			if day_slots:
				# Sort by student count (ascending)
				sorted_slots = sorted(day_slots, key=lambda x: x.total_students)
				best_slot = sorted_slots[0]
				
				optimal_times.append({
					'day': day,
					'start_time': best_slot.start_time.strftime('%H:%M'),
					'end_time': best_slot.end_time.strftime('%H:%M'),
					'student_count': best_slot.total_students,
					'recommendation': 'Optimal time - lowest student activity'
				})

		return jsonify({
			'success': True,
			'optimal_times': optimal_times
		}), 200

	except Exception as e:
		return jsonify({'error': str(e)}), 500


@bp.route('/stats', methods=['GET'])
def get_stats():
	"""
	Get overall statistics about scraped course data
	"""
	try:
		total_courses = Course.query.count()
		total_slots = TimeSlot.query.count()
		total_students = db.session.query(func.sum(TimeSlot.students_count)).scalar() or 0
		
		# Get busiest day
		busiest_day = db.session.query(
			TimeSlot.day_of_week,
			func.sum(TimeSlot.students_count).label('total')
		).group_by(TimeSlot.day_of_week).order_by(func.sum(TimeSlot.students_count).desc()).first()

		# Get busiest time
		busiest_time = db.session.query(
			TimeSlot.start_time,
			func.sum(TimeSlot.students_count).label('total')
		).group_by(TimeSlot.start_time).order_by(func.sum(TimeSlot.students_count).desc()).first()

		return jsonify({
			'success': True,
			'stats': {
				'total_courses': total_courses,
				'total_time_slots': total_slots,
				'total_students_tracked': total_students,
				'busiest_day': busiest_day.day_of_week if busiest_day else None,
				'busiest_time': busiest_time.start_time.strftime('%H:%M') if busiest_time else None
			}
		}), 200

	except Exception as e:
		return jsonify({'error': str(e)}), 500
