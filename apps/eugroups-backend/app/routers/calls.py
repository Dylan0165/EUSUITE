"""
Calls Router - Voice and Video call signaling
Uses WebRTC for peer-to-peer audio/video
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc
import json
import asyncio

from ..database import get_db
from ..models import Call, CallParticipant, Conversation, ConversationParticipant, Channel, GroupMember
from ..utils.auth_client import get_current_user

router = APIRouter(prefix="/calls", tags=["Calls"])

# Store active WebSocket connections for call signaling
# Format: {room_id: {user_id: WebSocket}}
active_call_connections: dict[str, dict[str, WebSocket]] = {}


@router.post("/start")
async def start_call(
    call_type: str,  # "voice" or "video"
    target_user_id: Optional[str] = None,  # For direct calls
    conversation_id: Optional[int] = None,  # Alternative: existing conversation
    channel_id: Optional[int] = None,  # For group calls
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new voice or video call
    - Direct call: provide target_user_id or conversation_id
    - Group call: provide channel_id
    """
    if call_type not in ["voice", "video"]:
        raise HTTPException(status_code=400, detail="call_type must be 'voice' or 'video'")
    
    room_id = str(uuid.uuid4())
    
    if channel_id:
        # Group call
        # Verify user is member of the channel's group
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        member = db.query(GroupMember).filter(
            GroupMember.group_id == channel.group_id,
            GroupMember.user_id == current_user["user_id"]
        ).first()
        
        if not member:
            raise HTTPException(status_code=403, detail="Not a member of this group")
        
        # Create call
        call = Call(
            call_type=call_type,
            call_mode="group",
            channel_id=channel_id,
            initiator_id=current_user["user_id"],
            initiator_name=current_user.get("username"),
            room_id=room_id,
            status="ringing"
        )
        db.add(call)
        db.flush()
        
        # Add all group members as participants
        members = db.query(GroupMember).filter(
            GroupMember.group_id == channel.group_id
        ).all()
        
        for m in members:
            status = "joined" if m.user_id == current_user["user_id"] else "invited"
            participant = CallParticipant(
                call_id=call.id,
                user_id=m.user_id,
                user_name=m.user_name,
                status=status,
                joined_at=datetime.utcnow() if status == "joined" else None
            )
            db.add(participant)
        
    else:
        # Direct call
        if not target_user_id and not conversation_id:
            raise HTTPException(status_code=400, detail="Provide target_user_id or conversation_id")
        
        # Get or verify conversation
        if conversation_id:
            participation = db.query(ConversationParticipant).filter(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == current_user["user_id"]
            ).first()
            
            if not participation:
                raise HTTPException(status_code=404, detail="Conversation not found")
            
            # Get the other participant
            other = db.query(ConversationParticipant).filter(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id != current_user["user_id"]
            ).first()
            
            if not other:
                raise HTTPException(status_code=400, detail="No other participant in conversation")
            
            target_user_id = other.user_id
            target_user_name = other.user_name
        else:
            # Find target user info (we may not have it)
            target_user_name = None
        
        # Create call
        call = Call(
            call_type=call_type,
            call_mode="direct",
            conversation_id=conversation_id,
            initiator_id=current_user["user_id"],
            initiator_name=current_user.get("username"),
            room_id=room_id,
            status="ringing"
        )
        db.add(call)
        db.flush()
        
        # Add participants
        initiator = CallParticipant(
            call_id=call.id,
            user_id=current_user["user_id"],
            user_name=current_user.get("username"),
            status="joined",
            joined_at=datetime.utcnow()
        )
        target = CallParticipant(
            call_id=call.id,
            user_id=target_user_id,
            user_name=target_user_name,
            status="ringing"
        )
        db.add(initiator)
        db.add(target)
    
    db.commit()
    db.refresh(call)
    
    return {
        "call_id": call.id,
        "room_id": call.room_id,
        "call_type": call.call_type,
        "call_mode": call.call_mode,
        "status": call.status,
        "started_at": call.started_at.isoformat()
    }


@router.post("/{call_id}/answer")
async def answer_call(
    call_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Answer an incoming call"""
    participant = db.query(CallParticipant).filter(
        CallParticipant.call_id == call_id,
        CallParticipant.user_id == current_user["user_id"]
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Call not found")
    
    call = db.query(Call).filter(Call.id == call_id).first()
    
    if call.status not in ["ringing"]:
        raise HTTPException(status_code=400, detail=f"Cannot answer call with status: {call.status}")
    
    # Update participant
    participant.status = "joined"
    participant.joined_at = datetime.utcnow()
    
    # Update call status
    call.status = "active"
    call.answered_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "call_id": call.id,
        "room_id": call.room_id,
        "status": "active"
    }


@router.post("/{call_id}/decline")
async def decline_call(
    call_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Decline an incoming call"""
    participant = db.query(CallParticipant).filter(
        CallParticipant.call_id == call_id,
        CallParticipant.user_id == current_user["user_id"]
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Call not found")
    
    call = db.query(Call).filter(Call.id == call_id).first()
    
    if call.status not in ["ringing"]:
        raise HTTPException(status_code=400, detail=f"Cannot decline call with status: {call.status}")
    
    # Update participant
    participant.status = "declined"
    
    # For direct calls, end the call
    if call.call_mode == "direct":
        call.status = "declined"
        call.ended_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Call declined", "status": call.status}


@router.post("/{call_id}/end")
async def end_call(
    call_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End/leave a call"""
    participant = db.query(CallParticipant).filter(
        CallParticipant.call_id == call_id,
        CallParticipant.user_id == current_user["user_id"]
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Call not found")
    
    call = db.query(Call).filter(Call.id == call_id).first()
    
    # Update participant
    participant.status = "left"
    participant.left_at = datetime.utcnow()
    
    # Check if any active participants remain
    active_participants = db.query(CallParticipant).filter(
        CallParticipant.call_id == call_id,
        CallParticipant.status == "joined"
    ).count()
    
    if active_participants <= 1:
        # End the call
        call.status = "ended"
        call.ended_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Left call", "status": call.status}


@router.get("/{call_id}")
async def get_call(
    call_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get call details"""
    participant = db.query(CallParticipant).filter(
        CallParticipant.call_id == call_id,
        CallParticipant.user_id == current_user["user_id"]
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Call not found")
    
    call = db.query(Call).filter(Call.id == call_id).first()
    
    participants = db.query(CallParticipant).filter(
        CallParticipant.call_id == call_id
    ).all()
    
    return {
        "id": call.id,
        "room_id": call.room_id,
        "call_type": call.call_type,
        "call_mode": call.call_mode,
        "status": call.status,
        "initiator_id": call.initiator_id,
        "initiator_name": call.initiator_name,
        "started_at": call.started_at.isoformat(),
        "answered_at": call.answered_at.isoformat() if call.answered_at else None,
        "ended_at": call.ended_at.isoformat() if call.ended_at else None,
        "participants": [
            {
                "user_id": p.user_id,
                "user_name": p.user_name,
                "status": p.status,
                "joined_at": p.joined_at.isoformat() if p.joined_at else None
            }
            for p in participants
        ]
    }


@router.get("/incoming/pending")
async def get_incoming_calls(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pending incoming calls"""
    pending = db.query(CallParticipant).filter(
        CallParticipant.user_id == current_user["user_id"],
        CallParticipant.status == "ringing"
    ).all()
    
    calls = []
    for p in pending:
        call = db.query(Call).filter(
            Call.id == p.call_id,
            Call.status == "ringing"
        ).first()
        
        if call:
            calls.append({
                "call_id": call.id,
                "room_id": call.room_id,
                "call_type": call.call_type,
                "call_mode": call.call_mode,
                "initiator_id": call.initiator_id,
                "initiator_name": call.initiator_name,
                "started_at": call.started_at.isoformat()
            })
    
    return {"incoming_calls": calls}


@router.get("/history")
async def get_call_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get call history"""
    participations = db.query(CallParticipant).filter(
        CallParticipant.user_id == current_user["user_id"]
    ).all()
    
    call_ids = [p.call_id for p in participations]
    
    calls = db.query(Call).filter(
        Call.id.in_(call_ids)
    ).order_by(desc(Call.started_at)).limit(limit).all()
    
    result = []
    for call in calls:
        participants = db.query(CallParticipant).filter(
            CallParticipant.call_id == call.id
        ).all()
        
        other_participants = [
            {"user_id": p.user_id, "user_name": p.user_name}
            for p in participants
            if p.user_id != current_user["user_id"]
        ]
        
        result.append({
            "id": call.id,
            "call_type": call.call_type,
            "call_mode": call.call_mode,
            "status": call.status,
            "initiator_id": call.initiator_id,
            "initiator_name": call.initiator_name,
            "participants": other_participants,
            "started_at": call.started_at.isoformat(),
            "ended_at": call.ended_at.isoformat() if call.ended_at else None,
            "was_initiator": call.initiator_id == current_user["user_id"]
        })
    
    return {"calls": result}


# ============ WebRTC Signaling WebSocket ============

@router.websocket("/signal/{room_id}")
async def call_signaling(
    websocket: WebSocket,
    room_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for WebRTC signaling
    Handles: offer, answer, ice-candidate
    """
    await websocket.accept()
    
    # Get user from cookie
    token = websocket.cookies.get("eusuite_token")
    if not token:
        await websocket.close(code=4001, reason="Not authenticated")
        return
    
    # Validate token (simplified - in production use proper validation)
    from ..utils.auth_client import validate_token
    user = await validate_token(token)
    
    if not user:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    user_id = user["user_id"]
    
    # Verify user is participant in this call
    call = db.query(Call).filter(Call.room_id == room_id).first()
    if not call:
        await websocket.close(code=4004, reason="Call not found")
        return
    
    participant = db.query(CallParticipant).filter(
        CallParticipant.call_id == call.id,
        CallParticipant.user_id == user_id
    ).first()
    
    if not participant:
        await websocket.close(code=4003, reason="Not a participant")
        return
    
    # Add to active connections
    if room_id not in active_call_connections:
        active_call_connections[room_id] = {}
    
    active_call_connections[room_id][user_id] = websocket
    
    # Notify others that user joined
    await broadcast_to_room(room_id, {
        "type": "user_joined",
        "user_id": user_id,
        "user_name": user.get("username")
    }, exclude_user=user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            message_type = data.get("type")
            target_user = data.get("target")
            
            if message_type in ["offer", "answer", "ice-candidate"]:
                # Forward to specific user
                if target_user and target_user in active_call_connections.get(room_id, {}):
                    target_ws = active_call_connections[room_id][target_user]
                    await target_ws.send_json({
                        "type": message_type,
                        "from": user_id,
                        "data": data.get("data")
                    })
            
            elif message_type == "get_participants":
                # Return list of connected participants
                participants = list(active_call_connections.get(room_id, {}).keys())
                await websocket.send_json({
                    "type": "participants",
                    "participants": participants
                })
    
    except WebSocketDisconnect:
        pass
    finally:
        # Remove from active connections
        if room_id in active_call_connections:
            active_call_connections[room_id].pop(user_id, None)
            
            # Notify others
            await broadcast_to_room(room_id, {
                "type": "user_left",
                "user_id": user_id
            })
            
            # Clean up empty rooms
            if not active_call_connections[room_id]:
                del active_call_connections[room_id]


async def broadcast_to_room(room_id: str, message: dict, exclude_user: str = None):
    """Broadcast message to all users in a room"""
    if room_id not in active_call_connections:
        return
    
    for user_id, ws in active_call_connections[room_id].items():
        if user_id != exclude_user:
            try:
                await ws.send_json(message)
            except:
                pass
