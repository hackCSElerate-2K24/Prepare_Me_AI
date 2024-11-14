import pickle
import numpy as np

def load_model(model_path):
    # Load all model components
    with open(model_path, 'rb') as f:
        model_components = pickle.load(f)
    return model_components

def predict_learning_style(model_components, new_data):
    # Extract components
    model = model_components['model']
    scaler = model_components['scaler']
    le = model_components['label_encoder']
    feature_names = model_components['feature_names']
    
    # Ensure feature order matches training data
    ordered_data = new_data[feature_names].copy()
    
    # Preprocess the new data
    new_data_scaled = scaler.transform(ordered_data)
    
    # Get probabilities for each class
    probabilities = model.predict_proba(new_data_scaled)[0]
    
    # Get predicted class
    predicted_class_idx = np.argmax(probabilities)
    predicted_method = le.inverse_transform([predicted_class_idx])[0]
    
    # Get confidence scores
    class_probabilities = dict(zip(le.classes_, probabilities))
    
    return predicted_method, class_probabilities