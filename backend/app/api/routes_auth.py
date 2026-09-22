import os
import uuid
import datetime
import logging
import random
import secrets
import time
from collections import defaultdict
from email.mime.multipart import MIMEMultipart
import smtplib
from email.mime.text import MIMEText
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.core.config import get_settings
import bcrypt
import jwt
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sonar-x")
settings = get_settings()

router = APIRouter()
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# In-memory sliding window rate limiter
_rate_limit_store = defaultdict(list)

def check_rate_limit(request: Request, limit: int = 20, window_seconds: int = 60):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    # Prune old timestamps
    _rate_limit_store[client_ip] = [t for t in _rate_limit_store[client_ip] if now - t < window_seconds]
    if len(_rate_limit_store[client_ip]) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before trying again."
        )
    _rate_limit_store[client_ip].append(now)

class SignupRequest(BaseModel):
    fullName: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyRequest(BaseModel):
    email: EmailStr
    token: str
    
class ResendVerifyRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class RoleUpdateRequest(BaseModel):
    role: str

class AuthorizeEmailRequest(BaseModel):
    email: EmailStr
    fullName: Optional[str] = None
    role: Optional[str] = "Operator"
    password: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def get_password_hash(password):
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password, hashed_password):
    pwd_bytes = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_password_bytes)

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def is_admin_or_supreme(user: Optional[User]) -> bool:
    if not user:
        return False
    return user.role in ["System Administrator", "Admin"] or user.email == "narayan.nkj@gmail.com"

def get_or_create_default_operator(db: Session) -> User:
    supreme_user = db.query(User).filter(User.email == "narayan.nkj@gmail.com").first()
    if not supreme_user:
        supreme_user = User(
            email="narayan.nkj@gmail.com",
            full_name="Narayan",
            hashed_password=get_password_hash("supreme123"),
            role="System Administrator",
            is_verified=1,
            is_approved=1
        )
        db.add(supreme_user)
        db.commit()
        db.refresh(supreme_user)
    return supreme_user

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email_sub: str = payload.get("sub")
        if email_sub is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = db.query(User).filter(User.email == email_sub).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_user_optional(db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme_optional)) -> User:
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email_sub: str = payload.get("sub")
            if email_sub:
                user = db.query(User).filter(User.email == email_sub).first()
                if user:
                    return user
        except Exception:
            pass
    return get_or_create_default_operator(db)

def send_verification_email(email: str, token: str):
    logger.info("="*50)
    logger.info("S.A.G.A.R. SECURE VERIFICATION EMAIL")
    logger.info(f"TO: {email}")
    logger.info(f"CODE: {token}")
    logger.info("="*50)
    
    sender_host = settings.SMTP_HOST
    sender_port = settings.SMTP_PORT
    sender_email = settings.SMTP_USER
    sender_password = settings.SMTP_PASSWORD
    
    if sender_email and sender_password:
        try:
            msg = MIMEText(f"Your S.A.G.A.R. access override code is:\n\n{token}\n\nIf you did not initiate this request, notify the Station Master immediately.")
            msg['Subject'] = 'S.A.G.A.R. Access Code'
            msg['From'] = f"S.A.G.A.R. Command <{sender_email}>"
            msg['To'] = email

            with smtplib.SMTP_SSL(sender_host, sender_port) as server:
                server.login(sender_email, sender_password)
                server.send_message(msg)
            logger.info("Verification email sent via SMTP successfully.")
        except Exception as e:
            logger.error(f"Failed to send email via SMTP: {e}")
    else:
        logger.info("SMTP credentials not configured in environment, falling back to secure console log.")

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request_http: Request, request: SignupRequest, db: Session = Depends(get_db)):
    check_rate_limit(request_http, limit=settings.RATE_LIMIT_AUTH_PER_MINUTE)
    request.email = request.email.lower()
    
    # Check domain
    if not (request.email.endswith("@gmail.com") or request.email.endswith("@sagar.gov.in") or request.email.endswith("@netrasonar.com")):
        raise HTTPException(status_code=400, detail="Only approved Gmail, SAGAR, or NetraSonar domains are permitted.")
        
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Generate 6-digit code
    verification_token = str(random.randint(100000, 999999))
    hashed_pw = get_password_hash(request.password)
    
    is_absolute_host = request.email == "narayan.nkj@gmail.com"
    role = "System Administrator" if is_absolute_host else "Operator"
    is_approved = 1 if is_absolute_host else 0
    is_verified = 1 if is_absolute_host else 0
    
    new_user = User(
        email=request.email,
        full_name=request.fullName,
        hashed_password=hashed_pw,
        role=role,
        is_approved=is_approved,
        verification_token=verification_token,
        is_verified=is_verified
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    send_verification_email(new_user.email, new_user.verification_token)
    
    smtp_configured = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
    resp = {
        "message": "Account created successfully. Please check your email to verify."
    }
    # Return code inline when SMTP is not configured so the frontend can display it
    if settings.APP_ENV == "development" or not smtp_configured:
        resp["code"] = new_user.verification_token
    return resp

@router.post("/login", response_model=TokenResponse)
async def login(request_http: Request, request: LoginRequest, db: Session = Depends(get_db)):
    check_rate_limit(request_http, limit=settings.RATE_LIMIT_AUTH_PER_MINUTE)
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email).first()
    
    # If this Gmail has never signed in before, capture them immediately so System Administrator can see and approve/revoke!
    if not user:
        if not (request.email.endswith("@gmail.com") or request.email.endswith("@sagar.gov.in") or request.email.endswith("@netrasonar.com")):
            raise HTTPException(status_code=400, detail="Only approved Gmail, SAGAR, or NetraSonar domains are permitted.")
        
        name = request.email.split('@')[0].replace('.', ' ').title()
        is_netrasonar = request.email.endswith("@netrasonar.com")
        user = User(
            email=request.email,
            full_name=name,
            hashed_password=get_password_hash(request.password),
            role="System Administrator" if is_netrasonar else "Operator",
            is_verified=1,
            is_approved=1 if is_netrasonar else 0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        if is_netrasonar:
            # Generate token immediately for NetraSonar domains so they can bypass the pending clearance block
            pass # Continues to token generation below
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sign-in request logged. Access pending clearance from System Administrator (Narayan)."
            )

    # Standard password verification for all users, including System Administrator
    if not verify_password(request.password, user.hashed_password):
        if user.is_verified == 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Incorrect password. Also, your email is not verified yet (Code: {user.verification_token}).",
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify the password entered or reset it using your code.",
        )
    
    if user.is_verified == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not verified. Please check your email.",
        )
        
    if user.is_approved == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access pending authorization from System Administrator (Narayan).",
        )
        
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "fullName": user.full_name,
            "role": user.role
        }
    }

@router.post("/verify")
async def verify_email(request: VerifyRequest, db: Session = Depends(get_db)):
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email, User.verification_token == request.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.is_verified = 1
    user.verification_token = None
    db.commit()
    
    return {"message": "Email successfully verified"}

@router.post("/resend-verification")
async def resend_verification(request_http: Request, request: ResendVerifyRequest, db: Session = Depends(get_db)):
    check_rate_limit(request_http, limit=settings.RATE_LIMIT_AUTH_PER_MINUTE)
    request.email = request.email.lower()
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Don't reveal user existence
        return {"message": "If that email exists and is unverified, a new code has been sent."}
        
    if user.is_verified == 1:
        return {"message": "Email is already verified"}
        
    user.verification_token = str(random.randint(100000, 999999))
    db.commit()
    
    send_verification_email(user.email, user.verification_token)
    smtp_configured = bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
    resp = {
        "message": "If that email exists and is unverified, a new link has been sent."
    }
    if settings.APP_ENV == "development" or not smtp_configured:
        resp["code"] = user.verification_token
    return resp

@router.post("/reset-password")
async def reset_password(request_http: Request, request: ResetPasswordRequest, db: Session = Depends(get_db)):
    check_rate_limit(request_http, limit=settings.RATE_LIMIT_AUTH_PER_MINUTE)
    clean_email = request.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.verification_token and user.verification_token != request.token.strip():
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.hashed_password = get_password_hash(request.new_password)
    user.is_verified = 1
    user.verification_token = None
    db.commit()
    return {"message": "Password updated successfully and email verified. You may now authenticate."}

@router.get("/lookup-operator")
async def lookup_operator(request_http: Request, email: str, db: Session = Depends(get_db)):
    check_rate_limit(request_http, limit=settings.RATE_LIMIT_AUTH_PER_MINUTE)
    clean_email = email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        return {"exists": False, "fullName": None}
    
    token_preview = None
    if get_settings().APP_ENV == "development" and not user.is_verified:
        token_preview = user.verification_token

    return {
        "exists": True,
        "fullName": user.full_name,
        "role": user.role,
        "isVerified": bool(user.is_verified),
        "isApproved": bool(user.is_approved),
        "verificationToken": token_preview
    }

@router.get("/users")
async def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    if not is_admin_or_supreme(current_user):
        raise HTTPException(status_code=403, detail="System Administrator or Admin privileges required")
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "is_verified": bool(u.is_verified),
        "is_approved": bool(u.is_approved),
        "verification_token": u.verification_token if not u.is_verified else None,
        "created_at": u.created_at.isoformat() if u.created_at else None
    } for u in users]

@router.post("/users/{user_id}/approve")
async def approve_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    if not is_admin_or_supreme(current_user):
        raise HTTPException(status_code=403, detail="System Administrator or Admin privileges required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = 1
    db.commit()
    return {"message": f"User {user.email} approved successfully"}

@router.post("/users/{user_id}/revoke")
async def revoke_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    if not is_admin_or_supreme(current_user):
        raise HTTPException(status_code=403, detail="System Administrator or Admin privileges required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == "narayan.nkj@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot revoke System Administrator")
    user.is_approved = 0
    db.commit()
    return {"message": f"User {user.email} access revoked"}

@router.post("/users/{user_id}/role")
async def update_user_role(user_id: str, req: RoleUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    if not is_admin_or_supreme(current_user):
        raise HTTPException(status_code=403, detail="System Administrator or Admin privileges required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == "narayan.nkj@gmail.com" and req.role != "System Administrator":
        raise HTTPException(status_code=400, detail="Cannot demote System Administrator")
    user.role = req.role
    db.commit()
    return {"message": f"User {user.email} role updated to {req.role}"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    if not is_admin_or_supreme(current_user):
        raise HTTPException(status_code=403, detail="System Administrator or Admin privileges required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == "narayan.nkj@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot delete System Administrator")
    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} registration deleted"}

@router.post("/users/authorize-email")
async def authorize_email(req: AuthorizeEmailRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    if not is_admin_or_supreme(current_user):
        raise HTTPException(status_code=403, detail="System Administrator or Admin privileges required")
    req.email = req.email.lower()
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        user.is_approved = 1
        user.is_verified = 1
        if req.role:
            user.role = req.role
        if req.fullName:
            user.full_name = req.fullName
        if req.password:
            user.hashed_password = get_password_hash(req.password)
        db.commit()
        return {"message": f"Access granted for {user.email}", "user": {"id": user.id, "email": user.email, "role": user.role}}
    else:
        name = req.fullName or req.email.split('@')[0].replace('.', ' ').title()
        user = User(
            email=req.email,
            full_name=name,
            hashed_password=get_password_hash(req.password or "sagar123"),
            role=req.role or "Operator",
            is_verified=1,
            is_approved=1
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"message": f"Pre-authorized access granted for {user.email}", "user": {"id": user.id, "email": user.email, "role": user.role}}


