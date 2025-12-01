"""
EUAdmin Backend - Database connection
Connects to EUCloud database for user and file data.
"""
import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://eucloud:eucloud@postgres:5432/eucloud")

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db_session():
    """Get a database session context manager."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


def get_all_users() -> List[Dict[str, Any]]:
    """Get all users from the database."""
    try:
        with get_db_session() as session:
            result = session.execute(text("""
                SELECT 
                    id,
                    user_id,
                    username,
                    email,
                    avatar_color,
                    is_active,
                    created_at,
                    last_login
                FROM users
                ORDER BY created_at DESC
            """))
            
            users = []
            for row in result:
                users.append({
                    "id": row.id,
                    "user_id": row.user_id,
                    "username": row.username,
                    "email": row.email,
                    "avatar_color": row.avatar_color,
                    "is_active": row.is_active,
                    "created_at": row.created_at.isoformat() if row.created_at else None,
                    "last_login": row.last_login.isoformat() if row.last_login else None,
                })
            
            return users
            
    except Exception as e:
        logger.error(f"Failed to get users: {e}")
        return []


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific user by their user_id."""
    try:
        with get_db_session() as session:
            result = session.execute(text("""
                SELECT 
                    id,
                    user_id,
                    username,
                    email,
                    avatar_color,
                    is_active,
                    created_at,
                    last_login
                FROM users
                WHERE user_id = :user_id
            """), {"user_id": user_id})
            
            row = result.fetchone()
            if not row:
                return None
            
            return {
                "id": row.id,
                "user_id": row.user_id,
                "username": row.username,
                "email": row.email,
                "avatar_color": row.avatar_color,
                "is_active": row.is_active,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "last_login": row.last_login.isoformat() if row.last_login else None,
            }
            
    except Exception as e:
        logger.error(f"Failed to get user {user_id}: {e}")
        return None


def get_user_storage(user_id: str) -> Dict[str, Any]:
    """Get storage usage for a specific user."""
    try:
        with get_db_session() as session:
            result = session.execute(text("""
                SELECT 
                    COUNT(*) as file_count,
                    COALESCE(SUM(size), 0) as total_bytes
                FROM files
                WHERE user_id = :user_id AND is_deleted = false
            """), {"user_id": user_id})
            
            row = result.fetchone()
            total_bytes = row.total_bytes if row else 0
            file_count = row.file_count if row else 0
            
            # Get storage by type
            result2 = session.execute(text("""
                SELECT 
                    CASE 
                        WHEN mimetype LIKE 'image/%' THEN 'images'
                        WHEN mimetype LIKE 'video/%' THEN 'videos'
                        WHEN mimetype LIKE 'audio/%' THEN 'audio'
                        WHEN mimetype LIKE 'application/pdf' THEN 'documents'
                        WHEN mimetype LIKE 'application/%' THEN 'documents'
                        WHEN mimetype LIKE 'text/%' THEN 'documents'
                        ELSE 'other'
                    END as file_type,
                    COUNT(*) as count,
                    COALESCE(SUM(size), 0) as bytes
                FROM files
                WHERE user_id = :user_id AND is_deleted = false
                GROUP BY 1
            """), {"user_id": user_id})
            
            storage_by_type = {}
            for row in result2:
                storage_by_type[row.file_type] = {
                    "count": row.count,
                    "bytes": row.bytes,
                    "mb": round(row.bytes / (1024 * 1024), 2)
                }
            
            return {
                "user_id": user_id,
                "total_files": file_count,
                "total_bytes": total_bytes,
                "total_mb": round(total_bytes / (1024 * 1024), 2),
                "total_gb": round(total_bytes / (1024 * 1024 * 1024), 4),
                "storage_by_type": storage_by_type
            }
            
    except Exception as e:
        logger.error(f"Failed to get storage for user {user_id}: {e}")
        return {
            "user_id": user_id,
            "total_files": 0,
            "total_bytes": 0,
            "total_mb": 0,
            "total_gb": 0,
            "storage_by_type": {}
        }


def get_total_storage() -> Dict[str, Any]:
    """Get total storage usage across all users."""
    try:
        with get_db_session() as session:
            result = session.execute(text("""
                SELECT 
                    COUNT(*) as file_count,
                    COALESCE(SUM(size), 0) as total_bytes,
                    COUNT(DISTINCT user_id) as user_count
                FROM files
                WHERE is_deleted = false
            """))
            
            row = result.fetchone()
            total_bytes = row.total_bytes if row else 0
            
            return {
                "total_files": row.file_count if row else 0,
                "total_bytes": total_bytes,
                "total_mb": round(total_bytes / (1024 * 1024), 2),
                "total_gb": round(total_bytes / (1024 * 1024 * 1024), 4),
                "users_with_files": row.user_count if row else 0
            }
            
    except Exception as e:
        logger.error(f"Failed to get total storage: {e}")
        return {
            "total_files": 0,
            "total_bytes": 0,
            "total_mb": 0,
            "total_gb": 0,
            "users_with_files": 0
        }


def get_user_activity(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent activity for a user."""
    try:
        with get_db_session() as session:
            # Get recent file uploads
            result = session.execute(text("""
                SELECT 
                    'upload' as action,
                    filename as detail,
                    created_at as timestamp,
                    size
                FROM files
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT :limit
            """), {"user_id": user_id, "limit": limit})
            
            activities = []
            for row in result:
                activities.append({
                    "action": row.action,
                    "detail": row.detail,
                    "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                    "metadata": {"size": row.size}
                })
            
            return activities
            
    except Exception as e:
        logger.error(f"Failed to get activity for user {user_id}: {e}")
        return []


def delete_user(user_id: str) -> bool:
    """Delete a user and all their data."""
    try:
        with get_db_session() as session:
            # Delete user's files first
            session.execute(text("""
                DELETE FROM files WHERE user_id = :user_id
            """), {"user_id": user_id})
            
            # Delete shares
            session.execute(text("""
                DELETE FROM file_shares WHERE shared_with_user_id = :user_id
            """), {"user_id": user_id})
            
            # Delete the user
            result = session.execute(text("""
                DELETE FROM users WHERE user_id = :user_id
            """), {"user_id": user_id})
            
            return True
            
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {e}")
        return False


def block_user(user_id: str) -> bool:
    """Block/deactivate a user."""
    try:
        with get_db_session() as session:
            session.execute(text("""
                UPDATE users SET is_active = false WHERE user_id = :user_id
            """), {"user_id": user_id})
            return True
            
    except Exception as e:
        logger.error(f"Failed to block user {user_id}: {e}")
        return False


def unblock_user(user_id: str) -> bool:
    """Unblock/activate a user."""
    try:
        with get_db_session() as session:
            session.execute(text("""
                UPDATE users SET is_active = true WHERE user_id = :user_id
            """), {"user_id": user_id})
            return True
            
    except Exception as e:
        logger.error(f"Failed to unblock user {user_id}: {e}")
        return False


def reset_user_storage(user_id: str) -> bool:
    """Delete all files for a user (reset storage)."""
    try:
        with get_db_session() as session:
            # Soft delete all files
            session.execute(text("""
                UPDATE files SET is_deleted = true WHERE user_id = :user_id
            """), {"user_id": user_id})
            return True
            
    except Exception as e:
        logger.error(f"Failed to reset storage for user {user_id}: {e}")
        return False


def get_system_stats() -> Dict[str, Any]:
    """Get overall system statistics."""
    try:
        with get_db_session() as session:
            # Total users
            users_result = session.execute(text("SELECT COUNT(*) as count FROM users"))
            total_users = users_result.fetchone().count
            
            # Active users (logged in last 24h)
            active_result = session.execute(text("""
                SELECT COUNT(*) as count FROM users 
                WHERE last_login > NOW() - INTERVAL '24 hours'
            """))
            active_users = active_result.fetchone().count
            
            # Storage stats
            storage = get_total_storage()
            
            return {
                "total_users": total_users,
                "active_users_24h": active_users,
                "total_storage": storage
            }
            
    except Exception as e:
        logger.error(f"Failed to get system stats: {e}")
        return {
            "total_users": 0,
            "active_users_24h": 0,
            "total_storage": {}
        }
