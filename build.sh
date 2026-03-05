#!/bin/bash
cd frontend
npm install
npm run build
cd ..
pip install -r backend/requirements.txt