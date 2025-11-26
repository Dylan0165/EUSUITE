"""
SQLAlchemy Models for EUGroups
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Group(Base):
    """Group model - represents a team/workspace"""
    __tablename__ = "eugroups_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    avatar_color = Column(String(20), default="#3B82F6")

    # Relationships
    members = relationship("GroupMember", back_populates="group", cascade="all, delete-orphan")
    channels = relationship("Channel", back_populates="group", cascade="all, delete-orphan")
    boards = relationship("Board", back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base):
    """Group membership model"""
    __tablename__ = "eugroups_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("eugroups_groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(50), nullable=False, index=True)
    user_email = Column(String(255), nullable=True)
    user_name = Column(String(100), nullable=True)
    role = Column(String(20), default="member")  # owner, admin, member
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="members")


class Channel(Base):
    """Channel model - chat channels within a group"""
    __tablename__ = "eugroups_channels"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("eugroups_groups.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="channels")
    messages = relationship("Message", back_populates="channel", cascade="all, delete-orphan")


class Message(Base):
    """Message model - chat messages in channels"""
    __tablename__ = "eugroups_messages"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("eugroups_channels.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(String(50), nullable=False, index=True)
    sender_email = Column(String(255), nullable=True)
    sender_name = Column(String(100), nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_read = Column(Boolean, default=False)

    # Relationships
    channel = relationship("Channel", back_populates="messages")


class Board(Base):
    """Kanban Board model"""
    __tablename__ = "eugroups_boards"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("eugroups_groups.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("Group", back_populates="boards")
    columns = relationship("BoardColumn", back_populates="board", cascade="all, delete-orphan", order_by="BoardColumn.order_index")


class BoardColumn(Base):
    """Board Column model - columns in kanban board"""
    __tablename__ = "eugroups_columns"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("eugroups_boards.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(100), nullable=False)
    order_index = Column(Integer, default=0)
    color = Column(String(20), default="#6B7280")

    # Relationships
    board = relationship("Board", back_populates="columns")
    cards = relationship("BoardCard", back_populates="column", cascade="all, delete-orphan", order_by="BoardCard.order_index")


class BoardCard(Base):
    """Board Card model - cards/tasks in kanban columns"""
    __tablename__ = "eugroups_cards"

    id = Column(Integer, primary_key=True, index=True)
    column_id = Column(Integer, ForeignKey("eugroups_columns.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    assigned_to = Column(String(50), nullable=True)  # user_id
    assigned_name = Column(String(100), nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(50), nullable=False)

    # Relationships
    column = relationship("BoardColumn", back_populates="cards")
