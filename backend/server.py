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

# Governor secret code (супер-админ)
GOVERNOR_SECRET = os.environ.get('GOVERNOR_SECRET', 'GOV-MAJESTIC-2024')

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

class UserCreate(BaseModel):
    username: str
    access_code: str  # Changed from password to access_code

class GovernorCreate(BaseModel):
    username: str
    password: str
    governor_secret: str

class UserLogin(BaseModel):
    username: str
    password: str  # This will be access_code for regular users

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

# === HELPER FUNCTIONS ===

def generate_access_code(length: int = 8) -> str:
    """Generate a random access code"""
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
    """Get user permissions based on role"""
    if user.get("role") == "governor":
        return RolePermissions(
            can_manage_ministries=True,
            can_manage_news=True,
            can_manage_legislation=True,
            can_manage_roles=True,
            can_delete=True
        )
    
    role = await db.roles.find_one({"id": user.get("role")}, {"_id": 0})
    if role:
        return RolePermissions(**role.get("permissions", {}))
    
    return RolePermissions()

def require_permission(permission: str):
    """Dependency to check specific permission"""
    async def check_permission(current_user: dict = Depends(get_current_user)):
        permissions = await get_user_permissions(current_user)
        
        # Governor has all permissions
        if current_user.get("role") == "governor":
            return current_user
        
        if not getattr(permissions, permission, False):
            raise HTTPException(status_code=403, detail="Permission denied")
        return current_user
    return check_permission

# === AUTH ROUTES ===

@api_router.post("/auth/register-governor", response_model=TokenResponse)
async def register_governor(data: GovernorCreate):
    """Register the Governor (super admin) - only one allowed"""
    # Check governor secret
    if data.governor_secret != GOVERNOR_SECRET:
        raise HTTPException(status_code=403, detail="Invalid governor secret")
    
    # Check if governor already exists
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
    """Register a new user with access code"""
    # Find role by access code
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
        "password": hash_password(data.access_code),  # Use access code as password
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
    """Login with username and password/access_code"""
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
    """Check if governor is already registered"""
    existing = await db.users.find_one({"role": "governor"})
    return {"exists": existing is not None}

# === ROLE MANAGEMENT ROUTES ===

@api_router.get("/roles", response_model=List[RoleResponse])
async def get_roles(current_user: dict = Depends(require_permission("can_manage_roles"))):
    roles = await db.roles.find({}, {"_id": 0}).to_list(100)
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
    # Check if any users have this role
    users_with_role = await db.users.count_documents({"role": role_id})
    if users_with_role > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role: {users_with_role} users have this role")
    
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
    """Get all users (for role management)"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(100)
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_permission("can_manage_roles"))):
    """Delete a user"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == "governor":
        raise HTTPException(status_code=403, detail="Cannot delete governor")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted"}

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
    
    update_data = ministry.model_dump()
    await db.ministries.update_one({"id": ministry_id}, {"$set": update_data})
    
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
async def create_legislation(law: LegislationCreate, current_user: dict = Depends(require_permission("can_manage_legislation"))):
    law_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    
    law_doc = {
        "id": law_id,
        **law.model_dump(),
        "created_at": created_at
    }
    await db.legislation.insert_one(law_doc)
    law_doc.pop("_id", None)
    return law_doc

@api_router.put("/legislation/{law_id}", response_model=LegislationResponse)
async def update_legislation(law_id: str, law: LegislationCreate, current_user: dict = Depends(require_permission("can_manage_legislation"))):
    existing = await db.legislation.find_one({"id": law_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Legislation not found")
    
    await db.legislation.update_one({"id": law_id}, {"$set": law.model_dump()})
    updated = await db.legislation.find_one({"id": law_id}, {"_id": 0})
    return updated

@api_router.delete("/legislation/{law_id}")
async def delete_legislation(law_id: str, current_user: dict = Depends(require_permission("can_delete"))):
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
