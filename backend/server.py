from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'majestic-gov-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# === MODELS ===

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DeputyModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    photo: Optional[str] = None
    position: str
    appointed_date: str
    contact: Optional[str] = None

class MinisterModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    photo: Optional[str] = None
    appointed_date: str
    contact: Optional[str] = None
    deputies: List[DeputyModel] = []

class MinistryCreate(BaseModel):
    name: str
    description: str
    logo: Optional[str] = None
    minister: Optional[MinisterModel] = None
    staff: List[str] = []
    contact_info: Optional[str] = None

class MinistryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    logo: Optional[str] = None
    minister: Optional[MinisterModel] = None
    staff: List[str] = []
    contact_info: Optional[str] = None
    created_at: str

class NewsCreate(BaseModel):
    title: str
    content: str
    image: Optional[str] = None

class NewsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    image: Optional[str] = None
    created_at: str

class LegislationCreate(BaseModel):
    decree_number: str
    title: str
    content: str
    status: str = "Pending"

class LegislationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    decree_number: str
    title: str
    content: str
    status: str
    created_at: str

# === AUTH FUNCTIONS ===

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, username: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# === AUTH ROUTES ===

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user_data.password)
    created_at = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "password": hashed_pw,
        "created_at": created_at
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.username)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, username=user_data.username, created_at=created_at)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["username"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], username=user["username"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        created_at=current_user["created_at"]
    )

# === MINISTRY ROUTES ===

@api_router.get("/ministries", response_model=List[MinistryResponse])
async def get_ministries():
    ministries = await db.ministries.find({}, {"_id": 0}).to_list(100)
    return ministries

@api_router.get("/ministries/{ministry_id}", response_model=MinistryResponse)
async def get_ministry(ministry_id: str):
    ministry = await db.ministries.find_one({"id": ministry_id}, {"_id": 0})
    if not ministry:
        raise HTTPException(status_code=404, detail="Ministry not found")
    return ministry

@api_router.post("/ministries", response_model=MinistryResponse)
async def create_ministry(ministry: MinistryCreate, current_user: dict = Depends(get_current_user)):
    ministry_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    ministry_doc = {
        "id": ministry_id,
        **ministry.model_dump(),
        "created_at": created_at
    }
    await db.ministries.insert_one(ministry_doc)
    del ministry_doc["_id"] if "_id" in ministry_doc else None
    return ministry_doc

@api_router.put("/ministries/{ministry_id}", response_model=MinistryResponse)
async def update_ministry(ministry_id: str, ministry: MinistryCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.ministries.find_one({"id": ministry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ministry not found")
    
    update_data = ministry.model_dump()
    await db.ministries.update_one({"id": ministry_id}, {"$set": update_data})
    
    updated = await db.ministries.find_one({"id": ministry_id}, {"_id": 0})
    return updated

@api_router.delete("/ministries/{ministry_id}")
async def delete_ministry(ministry_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.ministries.delete_one({"id": ministry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ministry not found")
    return {"message": "Ministry deleted"}

# === NEWS ROUTES ===

@api_router.get("/news", response_model=List[NewsResponse])
async def get_news():
    news = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return news

@api_router.get("/news/{news_id}", response_model=NewsResponse)
async def get_news_item(news_id: str):
    news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news

@api_router.post("/news", response_model=NewsResponse)
async def create_news(news: NewsCreate, current_user: dict = Depends(get_current_user)):
    news_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    news_doc = {
        "id": news_id,
        **news.model_dump(),
        "created_at": created_at
    }
    await db.news.insert_one(news_doc)
    del news_doc["_id"] if "_id" in news_doc else None
    return news_doc

@api_router.put("/news/{news_id}", response_model=NewsResponse)
async def update_news(news_id: str, news: NewsCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.news.find_one({"id": news_id})
    if not existing:
        raise HTTPException(status_code=404, detail="News not found")
    
    await db.news.update_one({"id": news_id}, {"$set": news.model_dump()})
    updated = await db.news.find_one({"id": news_id}, {"_id": 0})
    return updated

@api_router.delete("/news/{news_id}")
async def delete_news(news_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

# === LEGISLATION ROUTES ===

@api_router.get("/legislation", response_model=List[LegislationResponse])
async def get_legislation():
    laws = await db.legislation.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return laws

@api_router.get("/legislation/{law_id}", response_model=LegislationResponse)
async def get_legislation_item(law_id: str):
    law = await db.legislation.find_one({"id": law_id}, {"_id": 0})
    if not law:
        raise HTTPException(status_code=404, detail="Legislation not found")
    return law

@api_router.post("/legislation", response_model=LegislationResponse)
async def create_legislation(law: LegislationCreate, current_user: dict = Depends(get_current_user)):
    law_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    law_doc = {
        "id": law_id,
        **law.model_dump(),
        "created_at": created_at
    }
    await db.legislation.insert_one(law_doc)
    del law_doc["_id"] if "_id" in law_doc else None
    return law_doc

@api_router.put("/legislation/{law_id}", response_model=LegislationResponse)
async def update_legislation(law_id: str, law: LegislationCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.legislation.find_one({"id": law_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Legislation not found")
    
    await db.legislation.update_one({"id": law_id}, {"$set": law.model_dump()})
    updated = await db.legislation.find_one({"id": law_id}, {"_id": 0})
    return updated

@api_router.delete("/legislation/{law_id}")
async def delete_legislation(law_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.legislation.delete_one({"id": law_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Legislation not found")
    return {"message": "Legislation deleted"}

# === IMAGE UPLOAD ===

@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    contents = await file.read()
    encoded = base64.b64encode(contents).decode()
    mime_type = file.content_type or "image/png"
    data_url = f"data:{mime_type};base64,{encoded}"
    return {"url": data_url}

# === ROOT ===

@api_router.get("/")
async def root():
    return {"message": "Majestic Government API"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
