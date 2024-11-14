import numpy as np
import tensorflow as tf
import pandas as pd
import pickle
from sklearn.preprocessing import MinMaxScaler

# Load the model
model = tf.keras.models.load_model(
    '../models/multioutput_student_model.h5',
    custom_objects={"MeanSquaredError": tf.keras.losses.MeanSquaredError()}
)

# Load the scaler
with open('../models/scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# Input new data for prediction
example_data = pd.DataFrame({
    'Topic difficulty': [5],  # Example input
    'access count': [10],
    'emotions': ['happy'],  # Replace with the relevant emotion (e.g., 'sad', 'fear', etc.)
    'questions level': [7],
    'answer level': [8]
})

# Map emotions to integers
emotion_mapping = {'happy': 1, 'sad': 2, 'fear': 3, 'angry': 4}
example_data['emotions'] = example_data['emotions'].map(emotion_mapping)

# Normalize the input data
X_scaled = scaler.transform(example_data)

# Predict
predictions = model.predict(X_scaled)
performance, engagement, understanding = predictions[0]

print(f"Predicted Performance: {performance:.2f}")
print(f"Predicted Engagement: {engagement:.2f}")
print(f"Predicted Understanding: {understanding:.2f}")
