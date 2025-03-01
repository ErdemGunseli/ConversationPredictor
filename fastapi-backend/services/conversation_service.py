from datetime import datetime
from typing import List, Dict, Any, AsyncGenerator
import json
from models import Conversation
from .llm_service import send_message, stream_message
from llm_context import PREDICTION_CONTEXT
from dependencies import db_dependency, user_dependency
from exceptions import ConversationNotFoundException
from schemas import ConversationUpdate, PredictionResponse


def create_conversation(db: db_dependency, user: user_dependency) -> Conversation:
    # Creating a new conversation with the default values:
    conversation = Conversation(user_id=user.id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    return conversation


def get_conversation(db: db_dependency, user: user_dependency, conversation_id: int) -> Conversation:
    conversation = db.query(Conversation).filter_by(id=conversation_id, user_id=user.id).first()
    if not conversation: raise ConversationNotFoundException
    return conversation


def get_conversations(db: db_dependency, user: user_dependency) -> List[Conversation]:
    return db.query(Conversation).filter_by(user_id=user.id).order_by(Conversation.updated_at.desc()).all()


async def update_conversation(db: db_dependency, user: user_dependency, update_data: ConversationUpdate, ai_insights: bool = False) -> Conversation:
    conversation = get_conversation(db, user, update_data.id)
        
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(conversation, field, value)

    if ai_insights:
        result = await send_message(user, json.dumps(conversation.transcript))
        conversation.summary = result.summary
        
    conversation.updated_at = datetime.now()
    
    db.commit()
    db.refresh(conversation)
    
    return conversation


def delete_conversation(db: db_dependency, user: user_dependency, conversation_id: int) -> None:
    conversation = get_conversation(db, user, conversation_id)
    
    db.delete(conversation)
    db.commit()


async def stream_conversation_predictions(
    db: db_dependency,
    user: user_dependency, 
    update_data: ConversationUpdate = None
) -> AsyncGenerator[str, None]:
    
    get_conversation(db, user, update_data.id)
    conversation = await update_conversation(db, user, update_data, update_data)
    
    transcript_string = json.dumps(conversation.transcript)
    messages = [
        {"role": "system", "content": f"{PREDICTION_CONTEXT.format(transcript=transcript_string)}\nAdditional context: {conversation.context}"},
    ]
    
    async for prediction_chunk in stream_message(user, messages):
        result = json.dumps(prediction_chunk)
        yield result + "\n"