import os
import logging

# Random Forest Regressor is a ML model used for regression tasks:
from sklearn.ensemble import RandomForestRegressor
from sqlalchemy.orm import Session, sessionmaker
import numpy as np
import pickle
from apscheduler.schedulers.background import BackgroundScheduler

from models import User, Message, MessageInsight, MessageFeedback
from enums import MessageType, DescriptionCategory
from database import engine

# Configuring logging:
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = 'preference_model.pkl'

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def prepare_training_data(db: Session):
    # Creating a dictionary of categories and indices:
    categories = [category for category in DescriptionCategory]
    category_to_index = {category: idx for idx, category in enumerate(categories)}

    n_categories = len(categories)

    # Initializing lists to store training data and corresponding labels:
    training_data = []
    labels = []

    # Querying all users from the database:
    users = db.query(User).all()

    for user in users:
        # Processing messages for each user in chronological order:
        messages = db.query(Message).filter_by(user_id=user.id).order_by(Message.timestamp.asc()).all()
        for message in messages:
            # Retrieving message insights associated with the message:
            message_insights = db.query(MessageInsight).filter_by(message_id=message.id).all()
            if not message_insights:
                continue

            # Initializing a feature vector with zeros for all categories:
            feature_vector = [0.0] * n_categories

            # Setting scores for categories present in message insights:
            for insight in message_insights:
                idx = category_to_index[insight.category]
                feature_vector[idx] = insight.score

            # Initializing a label vector with zeros:
            label_vector = [0.0] * n_categories

            if message.type == MessageType.USER:
                # For user messages, using the feature vector as labels (assuming user preferences):
                label_vector = feature_vector.copy()
            elif message.type == MessageType.ASSISTANT and message.feedback != MessageFeedback.NEUTRAL:
                # For assistant messages with feedback, adjusting the insights based on feedback:
                adjustment = 1.0 if message.feedback == MessageFeedback.POSITIVE else -1.0
                for idx in range(n_categories):
                    label_vector[idx] = feature_vector[idx] * adjustment
            else:
                continue

            # Appending feature vector and label vector to training data:
            training_data.append(feature_vector)
            labels.append(label_vector)

    
    print(f"\033[1;34mPrepared training data for user.\033[0m")

    # Returning the training data and labels as NumPy arrays:
    return np.array(training_data), np.array(labels)


def train_preference_model():
    db = SessionLocal()
    try:
        print(f"\033[1;34mPreparing training data.\033[0m")
        training_data, labels = prepare_training_data(db)

        # Checking if there is enough data to train the model:
        if training_data.size == 0 or labels.size == 0:
            logger.warning("Not enough data to train the model.")
            return

        # Ensuring consistent feature dimensions between training data and labels:
        if training_data.shape[0] != labels.shape[0]:
            logger.error("Mismatch between training data and labels.")
            return

        # Initializing the Random Forest Regressor:
        # RandomForestRegressor is an ensemble learning method for regression,
        # which operates by constructing multiple decision trees during training
        # and outputting the average prediction of the individual trees.
        # Setting n_estimators=100 to use 100 trees in the forest:
        # Setting random_state=42 for reproducibility:
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        print(f"\033[1;34mInitialized Random Forest Regressor.\033[0m")


        # Fitting the model to the training data:
        # training_data: feature matrix (input features)
        # labels: target values (output labels)
        model.fit(training_data, labels)
        print(f"\033[1;34mModel fitted to training data.\033[0m")

        # Saving the trained model to a file using pickle:
        print(f"\033[1;34mSaving trained model to file.\033[0m")
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(model, f)
        print(f"\033[1;34mModel trained and saved successfully.\033[0m")
    except Exception as e:
        print(f"\033[1;31mError during model training: {e}\033[0m")
    finally:
        # Closing the database session:
        print(f"\033[1;34mDatabase session closed.\033[0m")
        db.close()


def train_preference_model_job():
    train_preference_model()


def schedule_model_training(scheduler: BackgroundScheduler):
    # Scheduling the job to run every 1 minute for testing purposes - TODO: Set correct interval:
    scheduler.add_job(train_preference_model_job, 'interval', minutes=1, id='train_preference_model')
    scheduler.start()
    print(f"\033[1;34mModel training scheduled successfully.\033[0m")


def shutdown_scheduler(scheduler: BackgroundScheduler):
    if scheduler.running:
        scheduler.shutdown(wait=False)
        print(f"\033[1;34mScheduler shut down successfully.\033[0m")


def predict_preferences(db: Session, user_id: int):
    if not os.path.exists(MODEL_PATH):
        print(f"\033[1;31mModel has not been trained yet.\033[0m")
        return {}

    print(f"\033[1;34mLoading trained model from file.\033[0m")
    # Loading the trained model from the file:
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)

    # Getting the list of categories and mapping them to indices:
    categories = [category for category in DescriptionCategory]
    category_to_index = {category: idx for idx, category in enumerate(categories)}
    n_categories = len(categories)

    # Initializing the feature vector with zeros for all categories:
    feature_vector = [0.0] * n_categories

    # Fetching recent messages to help focus on recent interactions:
    print(f"\033[1;34mFetching recent messages for user ID: {user_id}\033[0m")
    messages = db.query(Message).filter_by(user_id=user_id).order_by(Message.timestamp.desc()).limit(10).all()

    # Aggregating MessageInsight scores from recent messages:
    print(f"\033[1;34mAggregating message insights.\033[0m")
    message_count = 0
    for message in messages:
        message_insights = db.query(MessageInsight).filter_by(message_id=message.id).all()
        if not message_insights:
            continue
        for insight in message_insights:
            idx = category_to_index[insight.category]
            feature_vector[idx] += insight.score
        message_count += 1

    # Averaging the feature vector if messages were found:
    if message_count > 0:
        print(f"\033[1;34mAveraging feature vector.\033[0m")
        feature_vector = [score / message_count for score in feature_vector]

    # Reshaping the feature vector into a 2D array for prediction:
    feature_vector = np.array([feature_vector])

    # Predicting preferences using the trained model:
    # model.predict() returns the predicted labels (preferences) for the input feature vector.
    # The output is an array where each element corresponds to a category's predicted score.
    print(f"\033[1;34mPredicting preferences.\033[0m")
    predicted_scores = model.predict(feature_vector)[0]

    # Mapping predictions back to categories:
    return {category: score for category, score in zip(categories, predicted_scores)}
