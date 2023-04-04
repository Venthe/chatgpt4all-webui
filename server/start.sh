#!/usr/bin/env bash

# export FLASK_APP=server.py
# flask run
python3 server.py

# gunicorn --thread 50 server:app