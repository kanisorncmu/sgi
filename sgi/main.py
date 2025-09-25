from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/read_sentiment")
def read_sentiment(limit: int = 0):
    df = pd.read_csv("sentiment_geo_full 4.csv")
    
    # Convert to datetime and sort by date descending
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by='date', ascending=False)

    if limit > 0:
        df = df.head(limit) # Use head() now since it's sorted descending
    
    # Replace NaN with None for JSON compatibility
    df = df.replace({np.nan: None})
    return df.to_dict(orient="records")
