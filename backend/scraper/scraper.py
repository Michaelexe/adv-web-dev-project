"""
Course schedule scraper for calendar heatmap
Scrapes course times and student counts to determine optimal event scheduling
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import os
import sys
from dotenv import load_dotenv
from datetime import datetime, time
import time as time_module
import json

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Course, TimeSlot

load_dotenv()


class CourseScheduleScraper:
    def __init__(self, headless=True):
        self.portal_url = os.getenv('PORTAL_URL')
        self.username = os.getenv('PORTAL_USERNAME')
        self.password = os.getenv('PORTAL_PASSWORD')
        
        # Setup Chrome options
        chrome_options = Options()
        if headless:
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)
        self.courses = []

    def login(self):
        """
        Login to the student portal
        MODIFY: Update selectors based on your portal's login form
        """
        try:
            print(f"Navigating to {self.portal_url}/login")
            self.driver.get(f"{self.portal_url}/login")
            
            # TODO: Update these selectors for your portal
            # Option 1: By ID
            username_field = self.wait.until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            password_field = self.driver.find_element(By.ID, "password")
            submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            
            # Option 2: By name attribute
            # username_field = self.wait.until(
            #     EC.presence_of_element_located((By.NAME, "username"))
            # )
            
            # Option 3: By CSS selector
            # username_field = self.wait.until(
            #     EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text']"))
            # )
            
            # Enter credentials
            username_field.clear()
            username_field.send_keys(self.username)
            password_field.clear()
            password_field.send_keys(self.password)
            
            # Submit
            submit_button.click()
            time_module.sleep(2)
            
            print("✓ Login successful")
            return True
                
        except TimeoutException:
            print("✗ Timeout waiting for login page elements")
            self.driver.save_screenshot('login_error.png')
            return False
        except Exception as e:
            print(f"✗ Login error: {e}")
            self.driver.save_screenshot('login_error.png')
            return False

    def navigate_to_courses(self):
        """Navigate to courses/schedule page"""
        # TODO: Update this URL to your portal's courses page
        courses_url = f"{self.portal_url}/courses"
        
        print(f"Navigating to courses: {courses_url}")
        self.driver.get(courses_url)
        time_module.sleep(2)

    def scrape_courses(self):
        """
        Scrape course schedule information
        MODIFY: Update selectors based on your portal's structure
        """
        try:
            # TODO: Update this selector to match your portal's course list
            # Option 1: By class name
            self.wait.until(
                EC.presence_of_element_located((By.CLASS_NAME, "course-item"))
            )
            
            # Scroll to load all courses (if lazy loading)
            self._scroll_to_bottom()
            
            # TODO: Update selector to find all course elements
            course_elements = self.driver.find_elements(By.CLASS_NAME, "course-item")
            
            # Alternative selectors to try:
            # course_elements = self.driver.find_elements(By.CSS_SELECTOR, "tr.course-row")
            # course_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'course')]")
            # course_elements = self.driver.find_elements(By.TAG_NAME, "tr")
            
            print(f"Found {len(course_elements)} course entries")
            
            for element in course_elements:
                course_data = self._extract_course_data(element)
                if course_data:
                    self.courses.append(course_data)
            
            return self.courses
            
        except TimeoutException:
            print("✗ Timeout waiting for courses to load")
            self.driver.save_screenshot('courses_error.png')
            return []
        except Exception as e:
            print(f"✗ Error scraping courses: {e}")
            self.driver.save_screenshot('courses_error.png')
            return []

    def _extract_course_data(self, element):
        """
        Extract course data from a web element
        MODIFY: Update selectors based on your portal's structure
        
        Target data for calendar heatmap:
        - Day of week (Monday, Tuesday, etc.)
        - Start time (e.g., 10:00)
        - End time (e.g., 11:30)
        - Number of students enrolled
        """
        try:
            # TODO: Update these selectors to match your portal
            
            # Course name
            course_name = element.find_element(By.CLASS_NAME, "course-name").text
            
            # Course time/schedule - THIS IS CRITICAL for heatmap
            # Examples: "MWF 10:00-11:30" or "TR 14:00-15:30"
            try:
                schedule = element.find_element(By.CLASS_NAME, "course-time").text
            except NoSuchElementException:
                schedule = element.find_element(By.CSS_SELECTOR, ".time, .schedule").text
            
            # Number of students enrolled
            try:
                enrollment = element.find_element(By.CLASS_NAME, "enrollment").text
            except NoSuchElementException:
                enrollment = element.find_element(By.CSS_SELECTOR, ".enrolled, .students").text
            
            # Course code (optional but helpful)
            try:
                course_code = element.get_attribute('data-course-code') or \
                              element.find_element(By.CLASS_NAME, "course-code").text
            except:
                course_code = "UNKNOWN"
            
            # Parse the schedule into structured data
            parsed_schedule = self._parse_schedule(schedule)
            
            return {
                'course_name': course_name.strip(),
                'course_code': course_code.strip(),
                'schedule_raw': schedule.strip(),
                'days': parsed_schedule['days'],
                'start_time': parsed_schedule['start_time'],
                'end_time': parsed_schedule['end_time'],
                'students_enrolled': self._parse_enrollment(enrollment),
                'scraped_at': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error extracting course data: {e}")
            return None

    def _parse_schedule(self, schedule_str):
        """
        Parse schedule string into days and times
        Example: "MWF 10:00-11:30" -> {days: [M, W, F], start: 10:00, end: 11:30}
        
        TODO: Adjust this based on your portal's time format
        """
        result = {'days': [], 'start_time': None, 'end_time': None}
        
        if not schedule_str:
            return result
        
        # Extract day codes (M, T, W, R, F, S, U)
        day_map = {
            'M': 'Monday',
            'T': 'Tuesday',
            'W': 'Wednesday',
            'R': 'Thursday',
            'F': 'Friday',
            'S': 'Saturday',
            'U': 'Sunday'
        }
        
        # Find day letters at start of string
        import re
        days_match = re.search(r'^([MTWRFSU]+)', schedule_str.upper())
        if days_match:
            day_codes = days_match.group(1)
            result['days'] = [day_map.get(d, d) for d in day_codes]
        
        # Extract time range (handles both 24hr and 12hr formats)
        # Patterns: "10:00-11:30" or "10:00am-11:30am" or "2:00pm-3:15pm"
        time_match = re.search(r'(\d{1,2}:\d{2}(?:am|pm)?)\s*-\s*(\d{1,2}:\d{2}(?:am|pm)?)', 
                              schedule_str.lower())
        if time_match:
            start = time_match.group(1)
            end = time_match.group(2)
            
            # Convert to 24-hour format if needed
            result['start_time'] = self._convert_to_24hour(start)
            result['end_time'] = self._convert_to_24hour(end)
        
        return result

    def _convert_to_24hour(self, time_str):
        """Convert 12-hour time to 24-hour format"""
        try:
            if 'am' in time_str or 'pm' in time_str:
                dt = datetime.strptime(time_str, '%I:%M%p')
                return dt.strftime('%H:%M')
            return time_str
        except:
            return time_str

    def _parse_enrollment(self, enrollment_str):
        """
        Parse enrollment string to get student count
        Examples: "45/50" -> 45, "45 of 50" -> 45, "45" -> 45
        """
        import re
        if not enrollment_str:
            return 0
        
        # Match patterns like "45/50" or "45 of 50"
        match = re.search(r'(\d+)', enrollment_str)
        if match:
            return int(match.group(1))
        return 0

    def _scroll_to_bottom(self):
        """Scroll to bottom to load lazy-loaded content"""
        last_height = self.driver.execute_script("return document.body.scrollHeight")
        
        while True:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time_module.sleep(1)
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

    def save_to_database(self):
        """Save scraped courses to database for calendar heatmap"""
        app = create_app()
        
        with app.app_context():
            print("\n💾 Saving to database...")
            saved_count = 0
            
            for course_data in self.courses:
                try:
                    # Check if course already exists
                    existing = Course.query.filter_by(
                        course_code=course_data['course_code']
                    ).first()
                    
                    if existing:
                        # Update existing course
                        existing.course_name = course_data['course_name']
                        existing.schedule_raw = course_data['schedule_raw']
                        existing.students_enrolled = course_data['students_enrolled']
                        existing.updated_at = datetime.utcnow()
                        print(f"  Updated: {course_data['course_code']}")
                    else:
                        # Create new course
                        course = Course(
                            course_code=course_data['course_code'],
                            course_name=course_data['course_name'],
                            schedule_raw=course_data['schedule_raw'],
                            students_enrolled=course_data['students_enrolled']
                        )
                        db.session.add(course)
                        print(f"  Added: {course_data['course_code']}")
                    
                    # Create time slots for calendar heatmap
                    if existing:
                        # Delete old time slots
                        TimeSlot.query.filter_by(course_code=existing.course_code).delete()
                    
                    for day in course_data['days']:
                        if course_data['start_time'] and course_data['end_time']:
                            time_slot = TimeSlot(
                                course_code=course_data['course_code'],
                                day_of_week=day,
                                start_time=datetime.strptime(course_data['start_time'], '%H:%M').time(),
                                end_time=datetime.strptime(course_data['end_time'], '%H:%M').time(),
                                students_count=course_data['students_enrolled']
                            )
                            db.session.add(time_slot)
                    
                    saved_count += 1
                    
                except Exception as e:
                    print(f"  ✗ Error saving {course_data.get('course_code', 'UNKNOWN')}: {e}")
            
            db.session.commit()
            print(f"\n✓ Saved {saved_count} courses to database")

    def save_to_json(self, filename='courses_data.json'):
        """Save to JSON file as backup"""
        with open(filename, 'w') as f:
            json.dump(self.courses, f, indent=2)
        print(f"✓ Saved to {filename}")

    def close(self):
        """Close the browser"""
        self.driver.quit()


def main():
    """Main execution function"""
    print("=" * 60)
    print("Course Schedule Scraper for Calendar Heatmap")
    print("=" * 60)
    
    # Set headless=False to see the browser (useful for debugging)
    scraper = CourseScheduleScraper(headless=False)
    
    try:
        # Step 1: Login
        print("\n📝 Step 1: Logging in...")
        if not scraper.login():
            print("✗ Login failed. Check credentials in .env file")
            return
        
        # Step 2: Navigate to courses
        print("\n📚 Step 2: Navigating to courses...")
        scraper.navigate_to_courses()
        
        # Step 3: Scrape courses
        print("\n🔍 Step 3: Scraping course schedules...")
        scraper.scrape_courses()
        
        if not scraper.courses:
            print("✗ No courses found. Check selectors in scraper.py")
            return
        
        # Step 4: Save to database
        print(f"\n💾 Step 4: Saving {len(scraper.courses)} courses to database...")
        scraper.save_to_database()
        
        # Step 5: Save backup
        print("\n📄 Step 5: Creating JSON backup...")
        scraper.save_to_json()
        
        # Print summary
        print("\n" + "=" * 60)
        print("✓ Scraping complete!")
        print(f"  Total courses: {len(scraper.courses)}")
        print(f"  Data saved to database and courses_data.json")
        print("=" * 60)
        
        # Show sample data
        if scraper.courses:
            print("\n📊 Sample course:")
            sample = scraper.courses[0]
            print(f"  Course: {sample['course_name']}")
            print(f"  Code: {sample['course_code']}")
            print(f"  Schedule: {sample['schedule_raw']}")
            print(f"  Days: {', '.join(sample['days'])}")
            print(f"  Time: {sample['start_time']} - {sample['end_time']}")
            print(f"  Students: {sample['students_enrolled']}")
        
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("\n🔒 Closing browser...")
        scraper.close()


if __name__ == "__main__":
    main()
