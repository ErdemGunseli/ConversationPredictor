from enum import Enum


class CodeType(Enum):
    VERIFICATION = "verification"
    RESET_PASSWORD = "reset_password"


class AIModel(Enum):
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    O1 = "o1"
    O3_MINI = "o3-mini"
    GEMINI_1_5_FLASH = "gemini-1.5-flash"

    @property
    def supports_images(self) -> bool:
        return AI_MODEL_CAPABILITIES[self]["supports_images"]

    @property
    def supports_functions(self) -> bool:
        return AI_MODEL_CAPABILITIES[self]["supports_functions"]
    
    @property
    def supports_developer_messages(self) -> bool:
        return AI_MODEL_CAPABILITIES[self]["supports_developer_messages"]
    
    @property
    def supports_structured_outputs(self) -> bool:
        return AI_MODEL_CAPABILITIES[self]["supports_structured_outputs"]
    
    
AI_MODEL_CAPABILITIES = {
    AIModel.GPT_4O: {"supports_images": True, "supports_functions": True, "supports_developer_messages": True, "supports_structured_outputs": True},
    AIModel.GPT_4O_MINI: {"supports_images": True, "supports_functions": True, "supports_developer_messages": True, "supports_structured_outputs": True},
    AIModel.O1: {"supports_images": False, "supports_functions": False, "supports_developer_messages": False, "supports_structured_outputs": False},
    AIModel.O3_MINI: {"supports_images": False, "supports_functions": False, "supports_developer_messages": False, "supports_structured_outputs": False},
    AIModel.GEMINI_1_5_FLASH: {"supports_images": True, "supports_functions": True, "supports_developer_messages": True, "supports_structured_outputs": False}, # Does not support the structured outputs we use
}

OPENAI_MODELS = {AIModel.GPT_4O, AIModel.GPT_4O_MINI, AIModel.O1, AIModel.O3_MINI}
GEMINI_MODELS = {AIModel.GEMINI_1_5_FLASH}

