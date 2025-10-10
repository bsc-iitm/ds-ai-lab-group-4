### Milestone 2: Dataset Preparation

We have used the following datasets :

| **Dataset**                                                    | **Objective**                                                                                                             |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |                 
| **Digital Soil Map of the World (SoilWise / FAO-UNESCO)**               | Global 1:5,000,000 scale soil dataset representing dominant soil types per region for environmental and agricultural modeling.       |
| **Open-Meteo API**                                                      | Provides global historical and forecasted weather data (temperature, rainfall, humidity, etc.) via REST API.                         |
| **Google Earth Engine – Unsupervised Classification Embedding Dataset** | Satellite-based unsupervised feature embeddings capturing land-cover and spectral characteristics for geospatial analysis.           |
| **Agmarknet – Mandi Price Trend**                                       | Provides daily prices and arrivals of agricultural commodities across Indian mandis for monitoring market trends.                    |                         |
| **Nominatim (OpenStreetMap API)**                                       | Geocoding service to convert market or location names into geographic coordinates and administrative boundaries.    |

Data - https://developers.google.com/earth-engine/tutorials/community/satellite-embedding-02-unsupervised-classification

## 1. Dataset Overview

| **Item**                | **Description**                                                      |
| ----------------------- | -------------------------------------------------------------------- |
| **Dataset Name**        | `GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL`                               |
| **Type**                | Earth Engine ImageCollection (multiband embedding vectors)           |
| **Spatial Coverage**    | Global                                                               |
| **Temporal Resolution** | Annual composites (e.g. 2020–2023)                                   |
| **Spatial Resolution**  | ~30 m (derived from Sentinel-2 & Landsat harmonization)              |
| **Features**            | Embedding bands (64–128 dims) summarizing spectral–temporal behavior |
| **Labels (optional)**   | From crop maps (e.g. USDA CDL) or generated via clustering           |
| **Purpose**             | Unsupervised or supervised classification of land cover / crop type  |

### Key Supplementary Data

| **Dataset**                       | **Purpose**                          |
| --------------------------------- | ------------------------------------ |
| `USDA/NASS/CDL`                   | Ground-truth crop labels (U.S. only) |
| `ESA/WorldCover`                  | Cropland mask for filtering          |
| County / regional crop statistics | For unsupervised cluster labeling    |

---

## 2. Preprocessing Steps

| **Step**                                   | **Description**                                 | **Output**        |
| ------------------------------------------ | ----------------------------------------------- | ----------------- |
| **1. Define ROI and Year**                 | Select region and year of interest              | Polygon geometry  |
| **2. Load Embeddings**                     | Filter and mosaic the embedding ImageCollection | Multi-band image  |
| **3. Apply Cropland Mask**                 | Restrict to relevant agricultural pixels        | Masked image      |
| **4. Sample Embedding Points**             | Stratified sampling within ROI                  | FeatureCollection |
| **5. Export / Load Samples**               | Export samples to CSV or DataFrame              | Training dataset  |
| **6. Clean & Normalize**                   | Drop nulls, standardize embedding vectors       | Scaled dataset    |
| **7. Dimensionality Reduction** | Apply PCA to reduce embedding size              | Compact features  |
| **8. Split for Training / Validation**     | Spatial or random split                         | Train/test sets   |

---

## 3. Code

```python

#  Satellite Embedding Preprocessing
import ee
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split

# Initialize Earth Engine
ee.Initialize()

# 1. Define Region and Year
year = 2022
roi = ee.FeatureCollection('TIGER/2018/Counties') \
           .filter(ee.Filter.eq('NAME', 'Cerro Gordo')).geometry()

# 2. Load Embeddings
embedding_ic = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL') \
                  .filterDate(f'{year}-01-01', f'{year}-12-31') \
                  .filterBounds(roi)
embedding_img = embedding_ic.mosaic()

# 3. Cropland Mask
mask = ee.ImageCollection('ESA/WorldCover/v200').first().select('Map').eq(40)
masked_img = embedding_img.updateMask(mask)

# 4. Sampling Points
sample_points = masked_img.addBands(mask.rename('mask')).stratifiedSample(
    numPoints=1000,
    classBand='mask',
    region=roi,
    scale=30,
    geometries=True,
    seed=42
)

# 5. Convert to Pandas DataFrame
features = sample_points.getInfo()['features']
records = []
for f in features:
    props = f['properties']
    coords = f['geometry']['coordinates']
    props.update({'lon': coords[0], 'lat': coords[1]})
    records.append(props)

df = pd.DataFrame(records)

# 6. Cleaning & Standardization
df = df.dropna()
embedding_cols = [c for c in df.columns if c.startswith('b') or c.startswith('embed')]
X = df[embedding_cols].values
y = df['mask'].values

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 7. Optional Dimensionality Reduction
pca = PCA(n_components=32)
X_pca = pca.fit_transform(X_scaled)

# 8. Train / Validation Split
X_train, X_val, y_train, y_val = train_test_split(
    X_pca, y, test_size=0.2, random_state=42
)

# 9. Save Outputs
np.savez('satellite_embeddings_train.npz', X=X_train, y=y_train)
np.savez('satellite_embeddings_val.npz', X=X_val, y=y_val)
df.to_csv('satellite_embedding_points.csv', index=False)

```

---


Data - https://open-meteo.com/en/docs?bounding_box=-90,-180,90,180#location_and_time

## 1. Dataset 

| **Item**                 | **Description**                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Dataset / API Name**   | Open-Meteo Weather Forecast / Historical API                                                                  |
| **Type**                 | REST API returning JSON                                                                                          |
| **Spatial Domain**       | Global (latitude, longitude)                                                                                  |
| **Temporal Domain**      | Forecast (up to 16 days), historical / past days (up to ~92 days)                                          |
| **Temporal Resolution**  | Hourly (default), 15-minute (in regions where supported), daily aggregates                                   |
| **Variables / Features** | Temperature, humidity, wind speed/direction, precipitation, solar radiation, soil moisture, etc.               |
| **Units & Timezones**    | Units configurable (°C, mm, etc.); timestamps in ISO8601, can specify timezone offset or auto local timezone.   |
| **Use Case**             | Provide weather / climate contextual data for locations or time periods  |

### Key API Parameters / Endpoints

* `latitude` / `longitude` — coordinate(s) for which weather data is requested. 
* `hourly` — list of hourly weather variables to return. 
* `daily` — list of daily aggregate variables (e.g. daily max/min temperature, precipitation sum). 
* `forecast_days` (0–16) — number of forecast days to request. 
* `past_days` (0–92) — how many past days of data to return.
* `start_date` / `end_date` — specify arbitrary time window.
* `timezone` — timezone for result timestamps .
* `models` — optionally choose specific weather models or leave default “auto.” 
* `cell_selection` — choose how the grid cell is selected. 

## 3. Preprocessing Steps

| **Step**                               | **Description**                                                                                        | **Output / Purpose**              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **1. Define spatial & temporal query** | Choose location(s) (lat/lon), time window (start, end, forecast_days, past_days)                       | Query parameters                  |
| **2. Request from API**                | Send HTTP GET request with `hourly`, `daily`, etc.                                                     | JSON response                     |
| **3. Parse & validate**                | Assert presence of time arrays, variable arrays, units, lengths                                        | Structured dict / DataFrame       |
| **4. Convert timestamps**              | From ISO8601 + UTC offset → your desired timezone, convert to datetime objects                         | Timestamps aligned to your system |
| **5. Handle missing values**           | Some variables may be missing or null — impute, fill, or drop                                          | Cleaned dataset                   |
| **6. Feature engineering**             | Compute derived features (e.g. temperature differences, rolling means, lags, cumulative precipitation) | New variables                     |
| **7. Train/validation split**          | E.g. chronological split: older data for training, recent for validation                               | Train/test sets                   |
| **8. Scaling / normalization**         | Normalize features (e.g. standard scaling) as needed for your ML model                                 | Scaled features                   |

---

## 4. Code

```python
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def fetch_open_meteo(
    lat, lon,
    hourly_vars=None,
    daily_vars=None,
    start_date=None,
    end_date=None,
    forecast_days=7,
    past_days=0,
    timezone_str="auto"
):
    """
    Fetch weather data from Open-Meteo API for a given location & time parameters.
    Returns parsed JSON response.
    """
    base = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "timezone": timezone_str,
        "forecast_days": forecast_days,
        "past_days": past_days
    }
    if hourly_vars:
        params["hourly"] = ",".join(hourly_vars)
    if daily_vars:
        params["daily"] = ",".join(daily_vars)
    if start_date:
        params["start_date"] = start_date
    if end_date:
        params["end_date"] = end_date

    resp = requests.get(base, params=params)
    resp.raise_for_status()
    return resp.json()

def parse_open_meteo(json_resp):
    """
    Parse the JSON into a pandas DataFrame with timestamp + variables.
    """
    # hourly part
    hourly = json_resp.get("hourly", {})
    times = hourly.get("time", [])
    if not times:
        raise ValueError("No hourly time series in response")
    dt_series = pd.to_datetime(times)
    df = pd.DataFrame({"time": dt_series})
    for var, arr in hourly.items():
        if var == "time":
            continue
        df[var] = arr

    # daily part (merged on date)
    daily = json_resp.get("daily", {})
    if daily:
        # create a daily DataFrame
        times_d = pd.to_datetime(daily.get("time", []))
        df_d = pd.DataFrame({"date": times_d})
        for var, arr in daily.items():
            if var == "time":
                continue
            df_d[var] = arr
        # merge daily aggregates by date
        df["date"] = df["time"].dt.date
        df = df.merge(df_d, how="left", left_on="date", right_on="date")
        df = df.drop(columns=["date"])
    return df

def preprocess_weather_df(df):
    """
    Example cleaning / feature engineering.
    """
    # Drop rows with missing data
    df = df.dropna()

    if "temperature_2m_max" in df.columns and "temperature_2m_min" in df.columns:
        df["temp_range"] = df["temperature_2m_max"] - df["temperature_2m_min"]

    # Example lag features (1-hour lag)
    df["temp_2m_lag1"] = df["temperature_2m"].shift(1)
    df = df.dropna()

    return df


if __name__ == "__main__":
    lat, lon = 28.6139, 77.2090  # New Delhi
    hourly_vars = ["temperature_2m", "relative_humidity_2m", "precipitation"]
    daily_vars = ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"]
    j = fetch_open_meteo(lat, lon, hourly_vars, daily_vars, past_days=2, forecast_days=7)
    df = parse_open_meteo(j)
    df_clean = preprocess_weather_df(df)
    train, val = train_test_split(df_clean, test_size=0.2, shuffle=False)
    train.to_csv("weather_train.csv", index=False)
    val.to_csv("weather_val.csv", index=False)
```

data : https://repository.soilwise-he.eu/cat/collections/metadata:main/items/446ed430-8383-11db-b9b2-000d939bc5d8 

---

### Description

* It is a vector dataset based on the FAO-UNESCO Soil Map of the World, digitized at scale 1:5,000,000. 
* The soil polygons have been intersected with country boundaries (World Data Bank II, or FAO country boundaries) to align with political boundaries.
* The dataset excludes ocean, lakes, glaciers, and uses a template with water features (coastlines, rivers) to clip/mask. 

## 1. Dataset 
| **Item**                       | **Description**                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Dataset Name**               | Digital Soil Map of the World (DSMW)                                                                                  |
| **Source / Custodian**         | FAO / UNESCO, served via SoilWise HE repository                                                                       |
| **Type / Format**              | Vector (polygon) shapefile, also available as WMS, PDF, raster conversions                                            |
| **Spatial Scale / Resolution** | 1:5,000,000 scale; polygons representing soil units globally                      |
| **Spatial Coverage**           | Global land areas, excluding (or masked) water bodies, coastlines, glaciers etc.    |
| **Temporal / Versioning**      | Updated / published version 3.6, last updated 2022-02-14                          |
| **Projection / CRS**           | Geographic latitude-longitude                             |
| **Attributes / Variables**     | Soil mapping units, dominant soil classes, descriptive fields  |
| **Supplementary Formats**      | ESRI Shapefile, WMS (map server), PDF, Erdas, IDRISI etc.                          |                                          |

---

## 2. Preprocessing Pipeline & Steps

Below is a suggested preprocessing pipeline to ingest DSMW into your ML / embedding pipeline.

| **Step**                                     | **Description**                                                                                             | **Output / Use**                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **1. Download / ingest vector**              | Download the shapefile or WMS, ingest into GIS / spatial environment                                        | Polygon dataset in memory or PostGIS   |
| **2. Reproject / transform CRS**             | convert to the target projection (e.g. WGS84 or match raster)                                    | Soil polygons in target CRS            |
| **3. Validate & clean geometry**             | Remove invalid geometries, fix self-intersections, dissolve slivers                                         | Clean polygon dataset                  |
| **4. Filter / select attributes**            | Keep only relevant fields (e.g. dominant soil class, soil ID)                                               | Smaller attribute table                |
| **5. Rasterization / vector ⇒ grid mapping** | Convert soil polygons into a raster aligned with your embedding raster grid (e.g. same pixel size & tiling) | Soil-class raster map                  |
| **6. Join / overlay with embedding grid**    | At each raster cell or sample point, assign the soil class or attribute                                     | Embedding + soil class feature table   |
| **7. Handle no-data / null**                 | Some raster cells may fall outside any soil polygon (e.g. water, gaps)                                      | Mask or assign “unknown / fill value”  |
| **8. Encode categorical soil classes**       | One-hot encoding, ordinal labels, embedding of soil class                                                   | Soil class features ready for ML model |
| **9. Split train / validation**              | split by region or random sampling                                            | Training / validation sets             |

---

## 3. Code

```python
import geopandas as gpd
import rasterio
from rasterio import features
import numpy as np
import pandas as pd
from shapely.ops import unary_union
from sklearn.model_selection import train_test_split

# --- 1. Load vector
soil_gdf = gpd.read_file("DSM_World_shapefile.shp")

# --- 2. Reproject to target CRS (e.g. WGS84)
soil_gdf = soil_gdf.to_crs("EPSG:4326")  # or match your embedding CRS

# --- 3. Clean geometry
soil_gdf = soil_gdf[soil_gdf.is_valid]
soil_gdf = soil_gdf.buffer(0)  # fix minor issues
soil_gdf = soil_gdf.dissolve(by="dominant_soil")  # optional merging by class

# --- 4. Select attributes
soil_gdf = soil_gdf[["dominant_soil", "geometry"]].dropna()

# --- 5. Rasterization — align with embedding raster
with rasterio.open("embedding_raster.tif") as emb_src:
    meta = emb_src.meta.copy()
    transform = meta["transform"]
    out_shape = (meta["height"], meta["width"])

# Prepare (geometry, value) pairs
shapes = ((geom, value) for geom, value in zip(
    soil_gdf.geometry, soil_gdf["dominant_soil"]
))

soil_raster = features.rasterize(
    shapes=shapes,
    out_shape=out_shape,
    transform=transform,
    fill=0,  # or some “no data” code
    dtype="int32"
)

# Save soil map
meta.update({"count": 1, "dtype": "int32"})
with rasterio.open("soil_map.tif", "w", **meta) as dst:
    dst.write(soil_raster, 1)

# --- 6. Join with embedding samples
import rasterio.sample

with rasterio.open("soil_map.tif") as soil_src:
    # get soil value for each sample point
    coords = [(x, y) for x, y in zip(df_points["lon"], df_points["lat"])]
    soil_vals = list(soil_src.sample(coords))
    df_points["soil_class"] = [v[0] for v in soil_vals]

# --- 7. Handle no-data
df_points = df_points.dropna(subset=["soil_class"])
df_points = df_points[df_points["soil_class"] != 0]

# --- 8. Encode soil class
df_points["soil_class_code"] = pd.factorize(df_points["soil_class"])[0]

# --- 9. Train / validation split
train_df, val_df = train_test_split(df_points, test_size=0.2, random_state=42)

# --- 10. Save
train_df.to_csv("soil_embedding_train.csv", index=False)
val_df.to_csv("soil_embedding_val.csv", index=False)

```

---

Data :
Mandi Price Trend
	https://agmarknet.gov.in/
	https://enam.gov.in/web/ 
Markets Across Region
	https://agmarknet.gov.in/New/TotalMarkets_Covered.aspx 
Commodity Information 
	(https://agmarknet.gov.in/OtherPages/CommodityList.aspx) 
Area Information- (Nominatim)
(https://nominatim.org/release-docs/latest/) 

---

## 1. Dataset 

| **Source**                                                    | **Purpose / Role**                                                                              | **Type / Format**                             | **Spatial / Temporal Coverage**                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ |
| **Agmarknet – Mandi Price Trend & Arrivals**                  | Daily wholesale prices, arrivals, trends of commodities in agricultural markets (mandis)        | Web portal, HTML / CSV / API / web pages      | India, many markets, daily time series                 |
| **eNAM / Enam Portal**                                        | Integration / dashboard combining mandi and digital trading data                                | Web / dashboard / API                         | Indian markets, provides linkages, dashboard features  |
| **Markets Across Region (Agmarknet “Total Markets Covered”)** | Information about which markets / mandis are active in a region                                 | Web table / listing                           | India, states, market codes                            |
| **Commodity Information (Agmarknet Commodity List)**          | Details of which commodities are tracked, their codes, varieties                                | Web listing / table                           | India-wide commodity catalog                          |
| **Nominatim (OpenStreetMap geocoding / reverse geocoding)**   | To map markets / locations to coordinates, administrative boundaries, bounding boxes, addresses | REST API (JSON, GeoJSON)  | Global coverage                                                          |

---

## 2. Preprocessing & Data Preparation Steps

| **Step**                                       | **Description / Action**                                                                                                                                 | **Output / Role**                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **1. Market & commodity catalog ingestion**    | Scrape or download the commodity list and market listing from Agmarknet (market names, codes, states)                                                    | Master tables: `markets`, `commodities`                                |
| **2. Price & arrivals time series extraction** | For each (market, commodity), fetch daily price & arrivals (min, max, modal, etc.) from Agmarknet / Data.gov India API | Time series table: `market_id, commodity_id, date, price, arrival`     |
| **3. Data cleaning & missing handling**        | Remove invalid entries, fill or flag missing days, remove outliers                                                                                       | Cleaned time series                                                    |
| **4. Geocoding markets**                       | Use Nominatim API (or a local geocoder) to get lat/lon, bounding boxes, administrative address details of each market name                               | Add `latitude`, `longitude`, `bbox`, `display_name` to `markets` table |
| **5. Linking time series with spatial data**   | Join price time series with market spatial table (by market ID)                                                                                          | Spatio-temporal table: each record has price + location + date         |
| **6. Feature engineering**                     | Compute price moving averages, seasonality indices, lag features, growth rates, etc.                                                                     | Extended feature columns                                               |
| **7. Temporal splitting**                      | Split timeline into training / validation / test periods (e.g. older data for training)                                                                  | Partitioned datasets                                                   |                                                                   | Combined multi-modal dataset                                           |
| **8. Normalization / scaling**                 | Scale numeric features (price, arrivals) appropriately (e.g. log transform, z-score)                                                                     | Scaled features                                                        |

---

## 3. Code

```python
import requests
import pandas as pd
import time
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

def fetch_price_for_market(market_code, commodity_code, start_date, end_date):
    url = "https://www.agmarknet.gov.in/PriceAndArrivals/DatewiseCommodityReport.aspx"
    params = {
        "comm": commodity_code,
        "state": "",  # may restrict by state
        "market": market_code,
        "from_date": start_date,
        "to_date": end_date
    }
    resp = requests.get(url, params=params)
    df = pd.DataFrame(resp.json())  # placeholder
    df["market_code"] = market_code
    df["commodity_code"] = commodity_code
    return df

records = []
for _, m in markets_df.iterrows():
    for _, c in commodities_df.iterrows():
        dfm = fetch_price_for_market(m["market_code"], c["commodity_code"], "2023-01-01", "2023-12-31")
        records.append(dfm)
price_df = pd.concat(records, ignore_index=True)

price_df = price_df.dropna(subset=["price"])
price_df["date"] = pd.to_datetime(price_df["date"])
price_df["price"] = pd.to_numeric(price_df["price"], errors="coerce")
price_df = price_df.dropna()

geolocator = Nominatim(user_agent="your_app_name")
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)

def geocode_market(market_name, state=None):
    query = market_name + (", " + state if state else "")
    try:
        loc = geocode(query)
        if loc:
            return loc.latitude, loc.longitude, loc.address
    except Exception as e:
        print("Geocode error:", e)
    return None, None, None

markets_df["lat"], markets_df["lon"], markets_df["address"] = zip(
    *markets_df.apply(lambda row: geocode_market(row["market_name"], row.get("state")), axis=1)
)

merged = price_df.merge(markets_df, how="left", on="market_code")

merged = merged.sort_values(["market_code", "commodity_code", "date"])
merged["price_ma7"] = merged.groupby(["market_code", "commodity_code"])["price"].transform(lambda x: x.rolling(7).mean())

train = merged[merged["date"] < "2023-10-01"]
val = merged[merged["date"] >= "2023-10-01"]

train.to_csv("mandi_price_train.csv", index=False)
val.to_csv("mandi_price_val.csv", index=False)
markets_df.to_csv("markets_geocoded.csv", index=False)

```
