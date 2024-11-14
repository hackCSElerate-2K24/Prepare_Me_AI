import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler

# Load data
def load_data_from_csv(file_path):
    data = pd.read_csv(file_path)
    return data

# Preprocessing
def preprocess_data(data):
    # Convert emotions to integers
    emotion_mapping = {'happy': 1, 'sad': 2, 'fear': 3, 'angry': 4}
    data['emotions'] = data['emotions'].map(emotion_mapping)
    
    # Split features and labels
    X = data[['Topic difficulty', 'access count', 'emotions', 'questions level', 'answer level']]
    y = data[['Performance', 'Engagement', 'Understanding']]
    
    # Normalize features
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y, scaler

# Load dataset
file_path = 'D:\st_understand_model\preparemiai\multioutput_student_data.csv'
data = load_data_from_csv(file_path)

# Preprocess data
X, y, scaler = preprocess_data(data)

# Split data into train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Define multi-output neural network model
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
    tf.keras.layers.Dropout(0.3),  # Prevent overfitting
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dense(3)  # 3 outputs: Performance, Engagement, Understanding
])

# Compile model
model.compile(optimizer='adam', loss=tf.keras.losses.MeanSquaredError(), metrics=['mae'])

# Train model
model.fit(X_train, y_train, epochs=50, batch_size=16, validation_split=0.2)

# Evaluate model
loss, mae = model.evaluate(X_test, y_test)
print(f"Test Loss: {loss:.4f}, Test MAE: {mae:.4f}")

# Save model and scaler
model.save('../models/multioutput_student_model.h5')
scaler_file = '../models/scaler.pkl'
with open(scaler_file, 'wb') as f:
    import pickle
    pickle.dump(scaler, f)
