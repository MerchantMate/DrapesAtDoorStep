import os

bind = "0.0.0.0:" + os.environ.get("PORT", "8000")
# Rate limits and retry deduplication are process-local: use one worker.
workers = 1
threads = 4
timeout = 60
accesslog = None
