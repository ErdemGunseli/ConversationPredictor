import os
from typing import Optional, Any, AsyncGenerator
from datetime import datetime

from pydantic import BaseModel
from openai import OpenAI
from starlette.concurrency import run_in_threadpool

from llm_context import LLM_CONTEXT
from schemas import AgentResponse
from exceptions import UnprocessableMessageException
from enums import AIModel, OPENAI_MODELS, GEMINI_MODELS
from dependencies import user_dependency

openai_client = OpenAI()
gemini_client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url=os.getenv("GEMINI_BASE_URL")
)


def _get_api_arguments(user: user_dependency, model: AIModel, message: str, response_format=None) -> dict:
    formatted_context = LLM_CONTEXT.format(user_name=user.name, transcript=message)
    
    api_arguments = {
        "messages": [
            {"role": "system", "content": formatted_context},
            {"role": "user", "content": message}
        ], 
        "model": model.value
    }

    if model.supports_structured_outputs and response_format:
        api_arguments["response_format"] = response_format
    return api_arguments


def _get_client(model: AIModel):
    if model in OPENAI_MODELS:
        return openai_client
    elif model in GEMINI_MODELS:
        return gemini_client
    else:
        raise ValueError(f"Invalid model: {model}")


async def send_request(user: user_dependency, model: AIModel, message: str, response_format=None) -> None:
    client = _get_client(model)
    api_arguments = _get_api_arguments(user, model, message, response_format)
   
    # Wrapping the synchronous calls in run_in_threadpool:
    if response_format:
        response = await run_in_threadpool(client.beta.chat.completions.parse, **api_arguments)
    else:
        response = await run_in_threadpool(client.chat.completions.create, **api_arguments)   
    
    # Handling cases where the model refuses to respond:
    refusal = response.choices[0].message.refusal
    if refusal:
        raise UnprocessableMessageException(refusal)
    return response


async def send_message(
    user: user_dependency,
    text: str,
    model: AIModel = AIModel.GPT_4O_MINI,
    response_format: Optional[BaseModel] = AgentResponse,
) -> str | BaseModel:

    result = (await send_request(user, model, text, response_format)).choices[0].message

    # Adding the schema to the assistant message:
    if response_format and model.supports_structured_outputs:
        result = result.parsed

    return result


async def stream_message(
    user: user_dependency,
    messages: list,
    model: AIModel = AIModel.GPT_4O_MINI,
) -> AsyncGenerator[dict, None]:

    client = _get_client(model)
    api_arguments = {
        "messages": messages,
        "model": model.value,
        "stream": True
    }
    
    # Start timestamp for when we began generating
    start_timestamp = datetime.now().timestamp()
    
    # Full text accumulator
    full_text = ""
    
    try:
        # Use the appropriate client based on model
        stream = await run_in_threadpool(
            client.chat.completions.create,
            **api_arguments
        )
        
        for chunk in stream:
            # Extract content from chunk if available
            content = chunk.choices[0].delta.content or ""
            
            # Add to accumulated text
            full_text += content
            
            # Yield the chunk with timestamp
            yield {
                "text": full_text,
                "timestamp": start_timestamp,
                "complete": False,
                "new": True
            }
        
        # Send the final complete message
        yield {
            "text": full_text,
            "timestamp": start_timestamp,
            "complete": True,
            "new": True
        }
            
    except Exception as e:
        # Handle errors by yielding an error message
        yield {
            "text": f"Error generating prediction: {str(e)}",
            "timestamp": start_timestamp,
            "complete": True,
            "error": True,
            "new": True
        }
