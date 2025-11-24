# Course Schedule Scraper

Scrapes course schedules from student portal to generate calendar heatmap data for optimal event scheduling.

## Purpose

This scraper collects:

- **Course times** (day of week, start/end time)
- **Student enrollment counts**

This data helps clubs identify the **best times to host events** by showing when students are busiest with classes.

## Setup

1. **Install dependencies:**

   ```bash
   cd backend/scraper
   pip install -r requirements.txt
   ```

2. **Configure credentials:**

   ```bash
   cp .env.example .env
   # Edit .env with your portal credentials
   ```

3. **Download ChromeDriver:**
   - Visit: https://chromedriver.chromium.org/downloads
   - Match your Chrome browser version
   - Place `chromedriver.exe` in PATH or this folder

## Customization Required

You **MUST** update the following in `scraper.py`:

### 1. Login Selectors (Line ~46)

```python
# Update these to match your portal's login form
username_field = self.wait.until(
    EC.presence_of_element_located((By.ID, "username"))  # Change "username"
)
password_field = self.driver.find_element(By.ID, "password")  # Change "password"
```

**How to find:**

1. Open your portal login page
2. Right-click username field → Inspect
3. Look for `id="..."` or `name="..."` attributes
4. Update the selectors accordingly

### 2. Courses URL (Line ~71)

```python
courses_url = f"{self.portal_url}/courses"  # Change "/courses" to your URL
```

### 3. Course List Selector (Line ~86)

```python
course_elements = self.driver.find_elements(By.CLASS_NAME, "course-item")
```

**How to find:**

1. Open courses page
2. Right-click on a course → Inspect
3. Look for common class/tag wrapping each course
4. Update selector

### 4. Course Data Selectors (Lines ~107-125)

```python
# Course name
course_name = element.find_element(By.CLASS_NAME, "course-name").text

# Schedule - THIS IS CRITICAL
schedule = element.find_element(By.CLASS_NAME, "course-time").text

# Enrollment count
enrollment = element.find_element(By.CLASS_NAME, "enrollment").text
```

**Expected schedule format:** `"MWF 10:00-11:30"` or `"TR 14:00-15:30"`

- M/T/W/R/F = Monday/Tuesday/Wednesday/Thursday/Friday
- Time in 24-hour or 12-hour format

## Running the Scraper

```bash
cd backend/scraper
python scraper.py
```

**Set headless mode:**

```python
# In scraper.py main() function:
scraper = CourseScheduleScraper(headless=False)  # Shows browser (for debugging)
scraper = CourseScheduleScraper(headless=True)   # Hidden browser (for production)
```

## Output

### Database Tables

**`courses` table:**

- `course_code` - Unique identifier (e.g., "CS-401")
- `course_name` - Course title
- `schedule_raw` - Raw schedule string from portal
- `students_enrolled` - Total enrollment

**`time_slots` table:**

- `course_code` - Foreign key to courses
- `day_of_week` - Monday, Tuesday, etc.
- `start_time` - Class start (TIME format)
- `end_time` - Class end (TIME format)
- `students_count` - Number of students

### JSON Backup

Creates `courses_data.json` with all scraped data.

## API Endpoints

After scraping, these endpoints become available:

### GET `/calendar/heatmap`

Returns aggregated data for calendar visualization:

```json
{
  "success": true,
  "data": [
    {
      "day": "Monday",
      "start_time": "10:00",
      "end_time": "11:30",
      "total_students": 450,
      "course_count": 10,
      "density": 450
    }
  ]
}
```

### GET `/calendar/optimal-times`

Returns best times to host events (lowest student activity):

```json
{
  "success": true,
  "optimal_times": [
    {
      "day": "Friday",
      "start_time": "16:00",
      "end_time": "17:30",
      "student_count": 45,
      "recommendation": "Optimal time - lowest student activity"
    }
  ]
}
```

### GET `/calendar/stats`

Returns overall statistics:

```json
{
  "success": true,
  "stats": {
    "total_courses": 120,
    "total_time_slots": 340,
    "total_students_tracked": 5420,
    "busiest_day": "Tuesday",
    "busiest_time": "10:00"
  }
}
```

## Debugging

### Common Issues

**Login fails:**

- Check credentials in `.env`
- Verify login selectors match your portal
- Check `login_error.png` screenshot

**No courses found:**

- Set `headless=False` to watch scraper
- Update course list selector
- Check `courses_error.png` screenshot

**Time parsing errors:**

- Update `_parse_schedule()` method
- Check your portal's time format
- Add print statements to debug

### Debug Mode

```python
# Add these for debugging:
print(self.driver.page_source)  # See full HTML
self.driver.save_screenshot('debug.png')  # Take screenshot
```

## Schedule Format Examples

Your portal might use different formats. Adjust `_parse_schedule()` accordingly:

```
"MWF 10:00-11:30"     → Monday/Wednesday/Friday, 10am-11:30am
"TR 14:00-15:30"      → Tuesday/Thursday, 2pm-3:30pm
"M 9:00am-10:30am"    → Monday only, 9am-10:30am
"MTWRF 08:00-09:00"   → Weekdays, 8am-9am
```

## Next Steps

After scraping:

1. Data is stored in database
2. Create frontend heatmap visualization
3. Use `/calendar/optimal-times` to suggest event times
4. Set up cron job to run scraper weekly

## Security

⚠️ **Important:**

- Add `.env` to `.gitignore`
- Never commit portal credentials
- Check your university's terms of service
- Respect rate limits
