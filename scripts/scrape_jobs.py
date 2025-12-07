import requests
import json
import os
import time
import logging
from datetime import datetime
from dotenv import load_dotenv # Import dotenv

# Load environment variables from .env file
load_dotenv()

# ==========================================
# 🚂 RAILNOLOGY PRODUCTION JOB SCRAPER
# ==========================================

# CONFIGURATION
# Now loads strictly from .env or system environment
API_URL = "https://railnology-api.onrender.com/api/jobs"

# RAPID API CONFIGURATION (JSearch)
RAPID_API_KEY = os.getenv("RAPID_API_KEY")
RAPID_API_HOST = "jsearch.p.rapidapi.com"
RAPID_API_URL = f"https://{RAPID_API_HOST}/search"

# LOGGING SETUP
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class RailScraper:
    def __init__(self):
        self.session = requests.Session()
        self.jobs_found = []

    def fetch_jobs_from_rapidapi(self, query="Railroad", location="USA"):
        """
        Fetches structured job data using RapidAPI (JSearch).
        This aggregates from LinkedIn, Indeed, Glassdoor, etc.
        """
        if not RAPID_API_KEY:
            logger.error("❌ RAPID_API_KEY is missing. Cannot fetch premium job data.")
            logger.error("   Please ensure RAPID_API_KEY is set in your .env file.")
            return

        logger.info(f"🚀 Fetching jobs via RapidAPI for query: '{query}' in '{location}'...")

        headers = {
            "X-RapidAPI-Key": RAPID_API_KEY,
            "X-RapidAPI-Host": RAPID_API_HOST
        }
        
        params = {
            "query": f"{query} in {location}",
            "page": "1",
            "num_pages": "1",
            "date_posted": "week" # Only fresh jobs
        }

        try:
            response = self.session.get(RAPID_API_URL, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            raw_jobs = data.get("data", [])
            logger.info(f"   Found {len(raw_jobs)} raw job listings.")

            for item in raw_jobs:
                self.normalize_and_add_job(item)

        except Exception as e:
            logger.error(f"⚠️ RapidAPI Request Failed: {e}")

    def normalize_and_add_job(self, item):
        """
        Maps JSearch JSON schema to Railnology Database Schema.
        """
        try:
            # Extract Salary if available (JSearch structure)
            salary = "Competitive"
            if item.get("job_min_salary") and item.get("job_max_salary"):
                period = item.get("job_salary_period", "yr").upper()
                salary = f"${item['job_min_salary']} - ${item['job_max_salary']} / {period}"

            # Create clean job object
            job = {
                "title": item.get("job_title", "Railroad Professional"),
                "company": item.get("employer_name", "Confidential"),
                "location": f"{item.get('job_city', '')}, {item.get('job_state', '')}".strip(", "),
                "salary": salary,
                "description": (item.get("job_description", "")[:500] + "..."), # Truncate for preview
                "externalLink": item.get("job_apply_link", "#"),
                "tags": ["External", item.get("job_employment_type", "Fulltime")],
                "source": "RapidAPI / JSearch",
                "postedAt": datetime.utcnow().isoformat()
            }
            
            # Simple deduplication or validation could go here
            self.jobs_found.append(job)

        except Exception as e:
            logger.warning(f"Error normalizing job item: {e}")

    def post_jobs_to_api(self):
        """Sends collected jobs to the Railnology Backend."""
        if not self.jobs_found:
            logger.warning("No jobs to upload.")
            return

        logger.info(f"--- Uploading {len(self.jobs_found)} jobs to Railnology API ---")
        
        success_count = 0
        for job in self.jobs_found:
            try:
                # Add a delay to be polite to our own API
                time.sleep(0.2)
                response = requests.post(API_URL, json=job)
                
                if response.status_code in [200, 201]:
                    success_count += 1
                    logger.info(f"✅ Posted: {job['title']} at {job['company']}")
                else:
                    logger.error(f"❌ API Error {response.status_code}: {response.text}")
            except Exception as e:
                logger.error(f"⚠️ Network Error posting job: {e}")
        
        logger.info(f"--- Finished. Successfully posted {success_count}/{len(self.jobs_found)} jobs. ---")

def main():
    scraper = RailScraper()
    
    print(f"--- 🕵️‍♀️ Starting Production Job Scraper at {datetime.now()} ---")
    
    # 1. FETCH FROM RAPID API
    # We search for a few key terms to populate the board
    search_terms = ["Railroad Conductor", "Locomotive Engineer", "Rail Signal", "Track Inspector"]
    
    for term in search_terms:
        scraper.fetch_jobs_from_rapidapi(query=term, location="USA")
        time.sleep(1) # Respect Rate Limits
            
    # 2. UPLOAD TO DB
    if scraper.jobs_found:
        scraper.post_jobs_to_api()
    else:
        logger.warning("No jobs found in this run. Check API Key or Limits.")

if __name__ == "__main__":
    main()