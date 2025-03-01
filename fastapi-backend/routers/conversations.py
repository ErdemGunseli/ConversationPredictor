from fastapi import APIRouter, Path, Body, Request
from typing import List

from starlette import status as st
from starlette.responses import StreamingResponse

from dependencies import db_dependency, user_dependency
from services import conversation_service
from schemas import ConversationResponse, ConversationUpdate

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


@router.post("/", response_model=ConversationResponse)
async def create_conversation(db: db_dependency, user: user_dependency, request: Request):
    return conversation_service.create_conversation(db, user)


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(db: db_dependency, user: user_dependency, request: Request, conversation_id: int = Path(..., ge=1)):
    return conversation_service.get_conversation(db, user, conversation_id)


@router.get("/", response_model=List[ConversationResponse])
async def get_conversations(db: db_dependency, user: user_dependency, request: Request):
    return conversation_service.get_conversations(db, user)


@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    db: db_dependency,
    user: user_dependency,
    request: Request,
    update_data: ConversationUpdate = Body(...),
    ai_insights: bool = False
):
    return await conversation_service.update_conversation(db, user, update_data, ai_insights)


@router.delete("/{conversation_id}", status_code=st.HTTP_204_NO_CONTENT)
async def delete_conversation(
    db: db_dependency,
    user: user_dependency,
    request: Request,
    conversation_id: int = Path(..., ge=1)
):
    return conversation_service.delete_conversation(db, user, conversation_id)


@router.post("/{conversation_id}/prediction_stream", status_code=st.HTTP_200_OK)
async def stream_conversation_predictions(
    db: db_dependency,
    user: user_dependency,
    request: Request,
    update_data: ConversationUpdate = Body(...),
):
    
    generator = conversation_service.stream_conversation_predictions(
        db=db,
        user=user,
        update_data=update_data
    )
    return StreamingResponse(generator, media_type="application/json")