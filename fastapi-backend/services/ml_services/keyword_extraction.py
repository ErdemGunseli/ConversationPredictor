import os
import sys
import threading
from typing import Dict

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Adding parent directory so enums import works when running standalone file (for testing):
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.insert(0, parent_dir)

from enums import DescriptionCategory


class KeywordExtractor:
    # Thread-safe class for scoring user input against predefined categories using embeddings:

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(KeywordExtractor, cls).__new__(cls)
                    cls._instance._initialize()
        return cls._instance


    def _initialize(self):

        # Initializing the model and pre-computing category embeddings:
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

        # Defining category keywords for embedding similarity:
        self.CATEGORY_KEYWORDS = {
            DescriptionCategory.SCENE: [
                "scene", "where", "setting", "environment", "location", "place", "background", "surroundings", "landscape", "area"
            ],
            DescriptionCategory.PEOPLE: [
                "people", "who", "person", "man", "woman", "child", "adult", "elderly", "group", "couple", "family", "faces",
                "appearance", "gender", "age", "expression", "interaction", "pose", "body language"
            ],
            DescriptionCategory.ACTIVITY: [
                "activity", "doing", "happening", "action", "movement", "event", "gesture", "interaction", "playing", "working",
                "walking", "running", "celebrating"
            ],
            DescriptionCategory.EMOTION: [
                "emotion", "feeling", "mood", "expression", "happy", "sad", "angry", "excited", "peaceful", "surprised",
                "fearful", "disgusted", "confident"
            ],
            DescriptionCategory.ATMOSPHERE: [
                "atmosphere", "vibe", "ambiance", "tone", "aura", "general mood", "overall feeling", "energy", "tension",
                "serenity", "vibrant", "gloomy"
            ],
            DescriptionCategory.COLOR: [
                "color", "colors", "hue", "shades", "tints", "tones", "palette", "vivid", "bright", "dark", "colorful",
                "monochrome", "contrast", "saturated", "muted"
            ],
            DescriptionCategory.TEXT: [
                "text", "say", "sign", "words", "writing", "message", "letter", "caption", "label", "read",
            ],
            DescriptionCategory.OBJECTS: [
                "object", "objects", "item", "thing", "equipment", "tool", "furniture", "vehicle", "device", "instrument",
                "artifact", "symbol", "icon", "appliance", "gadget", "machinery", "props", "items"
            ],
            DescriptionCategory.DETAIL: [
                "detail", "elaborate", "intricate", "specific", "fine details", "comprehensive", "thorough", "describe in detail",
                "extensive", "in-depth", "nuance", "particulars", "minute details", "meticulous", "exhaustive"
            ],
            DescriptionCategory.CONCISENESS: [
                "conciseness", "summary", "summarize", "brief", "short", "concise", "succinct", "overview", "highlight", "quick",
                "to the point", "abbreviated"
            ]
        }


        # Pre-computing and storing the normalized average embeddings for each category:
        self.CATEGORY_EMBEDDINGS = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            keyword_embeddings = self.model.encode(keywords, convert_to_tensor=False)
            avg_embedding = np.mean(keyword_embeddings, axis=0)
            norm = np.linalg.norm(avg_embedding)
            normalized_embedding = avg_embedding / norm if norm != 0 else avg_embedding
            self.CATEGORY_EMBEDDINGS[category] = normalized_embedding


    def score_categories(self, user_input: str) -> Dict[DescriptionCategory, float]:
        if not user_input.strip():
            return {category: 0.0 for category in self.CATEGORY_EMBEDDINGS}

        # Encoding and normalizing the user input:
        input_embedding = self.model.encode([user_input], convert_to_tensor=False)[0]
        norm = np.linalg.norm(input_embedding)
        input_embedding = input_embedding / norm if norm != 0 else input_embedding

        scores = {}
        for category, embedding in self.CATEGORY_EMBEDDINGS.items():
            similarity = cosine_similarity(
                input_embedding.reshape(1, -1),
                embedding.reshape(1, -1)
            )[0][0]
            scores[category] = float(similarity)

        return scores


def test_scoring():
    keyword_extractor = KeywordExtractor()

    test_cases = [
        # Scene Category (10 test cases)
        ("What is the environment like?", DescriptionCategory.SCENE),
        ("Where is this scene taking place?", DescriptionCategory.SCENE),
        ("Is the setting indoors or outdoors?", DescriptionCategory.SCENE),
        ("What kind of environment is depicted?", DescriptionCategory.SCENE),
        ("Can you tell me about the background?", DescriptionCategory.SCENE),
        ("What does the landscape look like?", DescriptionCategory.SCENE),
        ("Is there any notable scenery?", DescriptionCategory.SCENE),
        ("What's the location shown in the image?", DescriptionCategory.SCENE),
        ("Are there any landmarks visible?", DescriptionCategory.SCENE),
        ("Can you describe the area where the action is happening?", DescriptionCategory.SCENE),

        # People Category (10 test cases)
        ("Are there any people in the image?", DescriptionCategory.PEOPLE),
        ("Can you describe the individuals present?", DescriptionCategory.PEOPLE),
        ("What do the people look like?", DescriptionCategory.PEOPLE),
        ("How many people are there?", DescriptionCategory.PEOPLE),
        ("Can you tell me about their appearance?", DescriptionCategory.PEOPLE),
        ("What are the ages of the people?", DescriptionCategory.PEOPLE),
        ("Are they male or female?", DescriptionCategory.PEOPLE),
        ("Can you describe who is in the group?", DescriptionCategory.PEOPLE),
        ("What expressions do the people have?", DescriptionCategory.PEOPLE),
        ("Is there any interaction between the people?", DescriptionCategory.PEOPLE),

        # Activity Category (10 test cases)
        ("What are the people doing?", DescriptionCategory.ACTIVITY),
        ("Is there any action taking place?", DescriptionCategory.ACTIVITY),
        ("Can you describe any movements?", DescriptionCategory.ACTIVITY),
        ("Are they engaged in any activities?", DescriptionCategory.ACTIVITY),
        ("What is happening in the image?", DescriptionCategory.ACTIVITY),
        ("Is anyone performing a specific task?", DescriptionCategory.ACTIVITY),
        ("Are there any events occurring?", DescriptionCategory.ACTIVITY),
        ("Can you tell me about any gestures?", DescriptionCategory.ACTIVITY),
        ("What actions are visible?", DescriptionCategory.ACTIVITY),
        ("Is there any interaction happening?", DescriptionCategory.ACTIVITY),

        # Emotion Category (10 test cases)
        ("Can you tell how the people are feeling?", DescriptionCategory.EMOTION),
        ("What emotions are displayed?", DescriptionCategory.EMOTION),
        ("Do they look happy or sad?", DescriptionCategory.EMOTION),
        ("Can you describe their facial expressions?", DescriptionCategory.EMOTION),
        ("Is there any sign of excitement?", DescriptionCategory.EMOTION),
        ("How would you describe their mood?", DescriptionCategory.EMOTION),
        ("Are they showing any emotions?", DescriptionCategory.EMOTION),
        ("What is the emotional tone?", DescriptionCategory.EMOTION),
        ("Can you sense any feelings from the image?", DescriptionCategory.EMOTION),
        ("Are there any expressions of anger or joy?", DescriptionCategory.EMOTION),

        # Atmosphere Category (10 test cases)
        ("What's the overall atmosphere like?", DescriptionCategory.ATMOSPHERE),
        ("Can you describe the mood of the scene?", DescriptionCategory.ATMOSPHERE),
        ("Does the image convey a particular vibe?", DescriptionCategory.ATMOSPHERE),
        ("Is there a tense or relaxed ambiance?", DescriptionCategory.ATMOSPHERE),
        ("How would you describe the tone?", DescriptionCategory.ATMOSPHERE),
        ("Is the scene vibrant or gloomy?", DescriptionCategory.ATMOSPHERE),
        ("What's the general feeling you get from the image?", DescriptionCategory.ATMOSPHERE),
        ("Does the setting have a peaceful aura?", DescriptionCategory.ATMOSPHERE),
        ("Can you tell me about the energy in the scene?", DescriptionCategory.ATMOSPHERE),
        ("What is the vibe of the image?", DescriptionCategory.ATMOSPHERE),

        # Color Category (10 test cases)
        ("What are the main colors in the image?", DescriptionCategory.COLOR),
        ("Can you describe the color palette?", DescriptionCategory.COLOR),
        ("Are there any bright or vivid colors?", DescriptionCategory.COLOR),
        ("Is the image mostly dark or light?", DescriptionCategory.COLOR),
        ("Are there any contrasting colors?", DescriptionCategory.COLOR),
        ("How would you describe the hues present?", DescriptionCategory.COLOR),
        ("Is the scene colorful or monochrome?", DescriptionCategory.COLOR),
        ("Do any colors stand out?", DescriptionCategory.COLOR),
        ("Are there any shades or tints you can mention?", DescriptionCategory.COLOR),
        ("Does the image have saturated or muted tones?", DescriptionCategory.COLOR),

        # Text Category (10 test cases)
        ("Is there any text visible in the image?", DescriptionCategory.TEXT),
        ("Can you read any signs or labels?", DescriptionCategory.TEXT),
        ("What does the writing say?", DescriptionCategory.TEXT),
        ("Are there any posters or billboards?", DescriptionCategory.TEXT),
        ("Is there any graffiti or messages?", DescriptionCategory.TEXT),
        ("Can you tell me about any letters or words?", DescriptionCategory.TEXT),
        ("Is there a caption or title shown?", DescriptionCategory.TEXT),
        ("Are there any notices or announcements?", DescriptionCategory.TEXT),
        ("Does the image contain any readable content?", DescriptionCategory.TEXT),
        ("Can you describe any text elements present?", DescriptionCategory.TEXT),

        # Objects Category (10 test cases)
        ("Can you describe the objects in the image?", DescriptionCategory.OBJECTS),
        ("What items are present?", DescriptionCategory.OBJECTS),
        ("Are there any vehicles or devices?", DescriptionCategory.OBJECTS),
        ("Can you tell me about any tools or equipment?", DescriptionCategory.OBJECTS),
        ("What kind of furniture is visible?", DescriptionCategory.OBJECTS),
        ("Are there any significant artifacts?", DescriptionCategory.OBJECTS),
        ("Do you see any appliances or gadgets?", DescriptionCategory.OBJECTS),
        ("Can you describe any props or items?", DescriptionCategory.OBJECTS),
        ("Are there any symbols or icons present?", DescriptionCategory.OBJECTS),
        ("What things are in the scene?", DescriptionCategory.OBJECTS),

        # Detail Category (10 test cases)
        ("Can you provide more detailed information?", DescriptionCategory.DETAIL),
        ("I would like an in-depth description.", DescriptionCategory.DETAIL),
        ("Please describe all the specifics.", DescriptionCategory.DETAIL),
        ("Can you elaborate on the image?", DescriptionCategory.DETAIL),
        ("Tell me all the fine details.", DescriptionCategory.DETAIL),
        ("I prefer a thorough explanation.", DescriptionCategory.DETAIL),
        ("Can you be more specific?", DescriptionCategory.DETAIL),
        ("Describe everything in detail.", DescriptionCategory.DETAIL),
        ("Please give me an exhaustive description.", DescriptionCategory.DETAIL),
        ("Can you provide a comprehensive overview?", DescriptionCategory.DETAIL),

        # Conciseness Category (10 test cases)
        ("Can you give me a brief summary?", DescriptionCategory.CONCISENESS),
        ("Please keep the description short.", DescriptionCategory.CONCISENESS),
        ("I prefer a concise explanation.", DescriptionCategory.CONCISENESS),
        ("Can you summarize the image quickly?", DescriptionCategory.CONCISENESS),
        ("Just highlight the main points.", DescriptionCategory.CONCISENESS),
        ("Give me a quick overview.", DescriptionCategory.CONCISENESS),
        ("Please be succinct.", DescriptionCategory.CONCISENESS),
        ("Make it short and to the point.", DescriptionCategory.CONCISENESS),
        ("Can you provide a brief description?", DescriptionCategory.CONCISENESS),
        ("I'd like an abbreviated version.", DescriptionCategory.CONCISENESS),
    ]

    total_score = 0
    n_categories = len(keyword_extractor.CATEGORY_KEYWORDS)
    n_test_cases = len(test_cases)

    for i, (input_text, expected_category) in enumerate(test_cases, 1):
        scores = keyword_extractor.score_categories(input_text)
        sorted_scores = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        expected_index = next(
            (index for index, (category, _) in enumerate(sorted_scores) if category == expected_category),
            None
        )
        category_score = (n_categories - expected_index) / n_categories if expected_index is not None else 0
        total_score += category_score

        if expected_index == 0:
            color_code = "\033[92m" 
        elif expected_index == 1:
            color_code = "\033[93m"  
        elif expected_index == 2:
            color_code = "\033[33m"
        elif 3 <= expected_index <= 5:
            color_code = "\033[31m"  
        else:
            color_code = "\033[0m"   

        print(f"Test Case {i}: {input_text}")
        print(f"Expected Category: {expected_category.name} {color_code}(Rank: {expected_index + 1 if expected_index is not None else 'Not found'})\033[0m\n\n")

        if expected_index != 0:
            print("Full Category Scores:")
            for category, score in sorted_scores:
                print(f"{category.name}: {score:.2f}")
            print("\n")

    final_accuracy = (total_score / n_test_cases) * 100
    print(f"Final Accuracy: {final_accuracy:.2f}%")

if __name__ == "__main__":
    test_scoring()
