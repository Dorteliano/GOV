from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import base64
import secrets
import string

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

# Governor secret code
GOVERNOR_SECRET = os.environ.get('GOVERNOR_SECRET', 'GOV-SEATTLE-2024')

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# === MODELS ===

# Permissions model
class RolePermissions(BaseModel):
    can_manage_ministries: bool = False
    can_manage_news: bool = False
    can_manage_legislation: bool = False
    can_manage_roles: bool = False
    can_manage_leadership: bool = False
    can_delete: bool = False

class RoleCreate(BaseModel):
    name: str
    permissions: RolePermissions

class RoleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    permissions: RolePermissions
    access_code: str
    created_at: str
    created_by: str

# Leadership (Руководство штата)
class LeadershipCreate(BaseModel):
    name: str
    surname: str
    position: str
    photo: Optional[str] = None
    email: Optional[str] = None
    passport_number: Optional[str] = None
    appointed_date: str
    order: int = 0

class LeadershipResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    surname: str
    position: str
    photo: Optional[str] = None
    email: Optional[str] = None
    passport_number: Optional[str] = None
    appointed_date: str
    order: int
    created_at: str

class UserCreate(BaseModel):
    username: str
    access_code: str

class GovernorCreate(BaseModel):
    username: str
    password: str
    governor_secret: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    role_name: str
    permissions: RolePermissions
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
    role_id: Optional[str] = None
    appointed_date: str
    contact: Optional[str] = None

class MinisterModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    photo: Optional[str] = None
    role_id: Optional[str] = None
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
    is_archive: bool = False

class NewsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    image: Optional[str] = None
    is_archive: bool = False
    created_at: str

# Senate amendments (Поправки Сената)
class AmendmentCreate(BaseModel):
    number: str
    title: str
    content: str
    status: str = "Принято"

class AmendmentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    number: str
    title: str
    content: str
    status: str
    created_at: str

# === HELPER FUNCTIONS ===

def generate_access_code(length: int = 8) -> str:
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
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

async def get_user_permissions(user: dict) -> RolePermissions:
    if user.get("role") == "governor":
        return RolePermissions(
            can_manage_ministries=True,
            can_manage_news=True,
            can_manage_legislation=True,
            can_manage_roles=True,
            can_manage_leadership=True,
            can_delete=True
        )
    
    role = await db.roles.find_one({"id": user.get("role")}, {"_id": 0})
    if role:
        return RolePermissions(**role.get("permissions", {}))
    
    return RolePermissions()

def require_permission(permission: str):
    async def check_permission(current_user: dict = Depends(get_current_user)):
        permissions = await get_user_permissions(current_user)
        if current_user.get("role") == "governor":
            return current_user
        if not getattr(permissions, permission, False):
            raise HTTPException(status_code=403, detail="Permission denied")
        return current_user
    return check_permission

# === AUTH ROUTES ===

@api_router.post("/auth/register-governor", response_model=TokenResponse)
async def register_governor(data: GovernorCreate):
    if data.governor_secret != GOVERNOR_SECRET:
        raise HTTPException(status_code=403, detail="Invalid governor secret")
    
    existing_governor = await db.users.find_one({"role": "governor"})
    if existing_governor:
        raise HTTPException(status_code=400, detail="Governor already registered")
    
    existing_user = await db.users.find_one({"username": data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(data.password)
    created_at = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "username": data.username,
        "password": hashed_pw,
        "role": "governor",
        "role_name": "Губернатор",
        "created_at": created_at
    }
    await db.users.insert_one(user_doc)
    
    permissions = RolePermissions(
        can_manage_ministries=True,
        can_manage_news=True,
        can_manage_legislation=True,
        can_manage_roles=True,
        can_manage_leadership=True,
        can_delete=True
    )
    
    token = create_token(user_id, data.username, "governor")
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id, 
            username=data.username, 
            role="governor",
            role_name="Губернатор",
            permissions=permissions,
            created_at=created_at
        )
    )

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_with_code(data: UserCreate):
    role = await db.roles.find_one({"access_code": data.access_code}, {"_id": 0})
    if not role:
        raise HTTPException(status_code=400, detail="Invalid access code")
    
    existing_user = await db.users.find_one({"username": data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "username": data.username,
        "password": hash_password(data.access_code),
        "role": role["id"],
        "role_name": role["name"],
        "created_at": created_at
    }
    await db.users.insert_one(user_doc)
    
    permissions = RolePermissions(**role.get("permissions", {}))
    
    token = create_token(user_id, data.username, role["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id, 
            username=data.username, 
            role=role["id"],
            role_name=role["name"],
            permissions=permissions,
            created_at=created_at
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    permissions = await get_user_permissions(user)
    
    token = create_token(user["id"], user["username"], user.get("role", ""))
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"], 
            username=user["username"], 
            role=user.get("role", ""),
            role_name=user.get("role_name", ""),
            permissions=permissions,
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    permissions = await get_user_permissions(current_user)
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        role=current_user.get("role", ""),
        role_name=current_user.get("role_name", ""),
        permissions=permissions,
        created_at=current_user["created_at"]
    )

@api_router.get("/auth/check-governor")
async def check_governor():
    existing = await db.users.find_one({"role": "governor"})
    return {"exists": existing is not None}

# === ROLE MANAGEMENT ===

@api_router.get("/roles", response_model=List[RoleResponse])
async def get_roles(current_user: dict = Depends(require_permission("can_manage_roles"))):
    roles = await db.roles.find({}, {"_id": 0}).to_list(100)
    return roles

@api_router.get("/roles/all")
async def get_all_roles():
    """Get all roles (public - for ministry assignment)"""
    roles = await db.roles.find({}, {"_id": 0, "access_code": 0}).to_list(100)
    return roles

@api_router.post("/roles", response_model=RoleResponse)
async def create_role(role: RoleCreate, current_user: dict = Depends(require_permission("can_manage_roles"))):
    role_id = str(uuid.uuid4())
    access_code = generate_access_code()
    created_at = datetime.now(timezone.utc).isoformat()
    
    role_doc = {
        "id": role_id,
        "name": role.name,
        "permissions": role.permissions.model_dump(),
        "access_code": access_code,
        "created_at": created_at,
        "created_by": current_user["id"]
    }
    await db.roles.insert_one(role_doc)
    role_doc.pop("_id", None)
    return role_doc

@api_router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(role_id: str, role: RoleCreate, current_user: dict = Depends(require_permission("can_manage_roles"))):
    existing = await db.roles.find_one({"id": role_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Role not found")
    
    update_data = {
        "name": role.name,
        "permissions": role.permissions.model_dump()
    }
    await db.roles.update_one({"id": role_id}, {"$set": update_data})
    
    updated = await db.roles.find_one({"id": role_id}, {"_id": 0})
    return updated

@api_router.delete("/roles/{role_id}")
async def delete_role(role_id: str, current_user: dict = Depends(require_permission("can_manage_roles"))):
    users_with_role = await db.users.count_documents({"role": role_id})
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete: {users_with_role} users have this role")
    
    result = await db.roles.delete_one({"id": role_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"message": "Role deleted"}

@api_router.post("/roles/{role_id}/regenerate-code", response_model=RoleResponse)
async def regenerate_access_code(role_id: str, current_user: dict = Depends(require_permission("can_manage_roles"))):
    existing = await db.roles.find_one({"id": role_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Role not found")
    
    new_code = generate_access_code()
    await db.roles.update_one({"id": role_id}, {"$set": {"access_code": new_code}})
    
    updated = await db.roles.find_one({"id": role_id}, {"_id": 0})
    return updated

@api_router.get("/users", response_model=List[dict])
async def get_users(current_user: dict = Depends(require_permission("can_manage_roles"))):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_permission("can_manage_roles"))):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == "governor":
        raise HTTPException(status_code=403, detail="Cannot delete governor")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted"}

# === LEADERSHIP (Руководство штата) ===

@api_router.get("/leadership", response_model=List[LeadershipResponse])
async def get_leadership():
    leaders = await db.leadership.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return leaders

@api_router.post("/leadership", response_model=LeadershipResponse)
async def create_leader(leader: LeadershipCreate, current_user: dict = Depends(require_permission("can_manage_leadership"))):
    leader_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    leader_doc = {
        "id": leader_id,
        **leader.model_dump(),
        "created_at": created_at
    }
    await db.leadership.insert_one(leader_doc)
    leader_doc.pop("_id", None)
    return leader_doc

@api_router.put("/leadership/{leader_id}", response_model=LeadershipResponse)
async def update_leader(leader_id: str, leader: LeadershipCreate, current_user: dict = Depends(require_permission("can_manage_leadership"))):
    existing = await db.leadership.find_one({"id": leader_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Leader not found")
    
    await db.leadership.update_one({"id": leader_id}, {"$set": leader.model_dump()})
    updated = await db.leadership.find_one({"id": leader_id}, {"_id": 0})
    return updated

@api_router.delete("/leadership/{leader_id}")
async def delete_leader(leader_id: str, current_user: dict = Depends(require_permission("can_delete"))):
    result = await db.leadership.delete_one({"id": leader_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Leader not found")
    return {"message": "Leader deleted"}

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
async def create_ministry(ministry: MinistryCreate, current_user: dict = Depends(require_permission("can_manage_ministries"))):
    ministry_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    ministry_doc = {
        "id": ministry_id,
        **ministry.model_dump(),
        "created_at": created_at
    }
    await db.ministries.insert_one(ministry_doc)
    ministry_doc.pop("_id", None)
    return ministry_doc

@api_router.put("/ministries/{ministry_id}", response_model=MinistryResponse)
async def update_ministry(ministry_id: str, ministry: MinistryCreate, current_user: dict = Depends(require_permission("can_manage_ministries"))):
    existing = await db.ministries.find_one({"id": ministry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ministry not found")
    
    await db.ministries.update_one({"id": ministry_id}, {"$set": ministry.model_dump()})
    updated = await db.ministries.find_one({"id": ministry_id}, {"_id": 0})
    return updated

@api_router.delete("/ministries/{ministry_id}")
async def delete_ministry(ministry_id: str, current_user: dict = Depends(require_permission("can_delete"))):
    result = await db.ministries.delete_one({"id": ministry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ministry not found")
    return {"message": "Ministry deleted"}

# === NEWS ROUTES ===

@api_router.get("/news", response_model=List[NewsResponse])
async def get_news(archive: bool = False):
    query = {"is_archive": archive}
    news = await db.news.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return news

@api_router.get("/news/{news_id}", response_model=NewsResponse)
async def get_news_item(news_id: str):
    news = await db.news.find_one({"id": news_id}, {"_id": 0})
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news

@api_router.post("/news", response_model=NewsResponse)
async def create_news(news: NewsCreate, current_user: dict = Depends(require_permission("can_manage_news"))):
    news_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    news_doc = {
        "id": news_id,
        **news.model_dump(),
        "created_at": created_at
    }
    await db.news.insert_one(news_doc)
    news_doc.pop("_id", None)
    return news_doc

@api_router.put("/news/{news_id}", response_model=NewsResponse)
async def update_news(news_id: str, news: NewsCreate, current_user: dict = Depends(require_permission("can_manage_news"))):
    existing = await db.news.find_one({"id": news_id})
    if not existing:
        raise HTTPException(status_code=404, detail="News not found")
    
    await db.news.update_one({"id": news_id}, {"$set": news.model_dump()})
    updated = await db.news.find_one({"id": news_id}, {"_id": 0})
    return updated

@api_router.delete("/news/{news_id}")
async def delete_news(news_id: str, current_user: dict = Depends(require_permission("can_delete"))):
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

# === AMENDMENTS (Поправки Сената) ===

@api_router.get("/amendments", response_model=List[AmendmentResponse])
async def get_amendments():
    amendments = await db.amendments.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return amendments

@api_router.get("/amendments/{amendment_id}", response_model=AmendmentResponse)
async def get_amendment(amendment_id: str):
    amendment = await db.amendments.find_one({"id": amendment_id}, {"_id": 0})
    if not amendment:
        raise HTTPException(status_code=404, detail="Amendment not found")
    return amendment

@api_router.post("/amendments", response_model=AmendmentResponse)
async def create_amendment(amendment: AmendmentCreate, current_user: dict = Depends(require_permission("can_manage_legislation"))):
    amendment_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    amendment_doc = {
        "id": amendment_id,
        **amendment.model_dump(),
        "created_at": created_at
    }
    await db.amendments.insert_one(amendment_doc)
    amendment_doc.pop("_id", None)
    return amendment_doc

@api_router.put("/amendments/{amendment_id}", response_model=AmendmentResponse)
async def update_amendment(amendment_id: str, amendment: AmendmentCreate, current_user: dict = Depends(require_permission("can_manage_legislation"))):
    existing = await db.amendments.find_one({"id": amendment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Amendment not found")
    
    await db.amendments.update_one({"id": amendment_id}, {"$set": amendment.model_dump()})
    updated = await db.amendments.find_one({"id": amendment_id}, {"_id": 0})
    return updated

@api_router.delete("/amendments/{amendment_id}")
async def delete_amendment(amendment_id: str, current_user: dict = Depends(require_permission("can_delete"))):
    result = await db.amendments.delete_one({"id": amendment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Amendment not found")
    return {"message": "Amendment deleted"}

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
    return {"message": "Seattle Government API"}

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
