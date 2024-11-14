import pickle
from sklearn.model_selection import LeaveOneOut
from sklearn.ensemble import RandomForestClassifier
import numpy as np
from sklearn.preprocessing import LabelEncoder

from scripts.data_preprocessing import load_and_preprocess_data

def train_and_save_model(data_path, model_path):
    # Load and preprocess data
    X, y, scaler = load_and_preprocess_data(data_path)
    
    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Initialize model
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight='balanced',
        random_state=42
    )
    
    # Print dataset information
    print("\nDataset Information:")
    print(f"Total samples: {len(y)}")
    print("\nClass distribution:")
    for class_label in np.unique(y):
        count = np.sum(y == class_label)
        print(f"{class_label}: {count} samples")
    
    # Perform Leave-One-Out Cross Validation
    loo = LeaveOneOut()
    cv_scores = []
    
    print("\nPerforming Leave-One-Out Cross Validation...")
    for train_idx, test_idx in loo.split(X):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y_encoded[train_idx], y_encoded[test_idx]
        
        model.fit(X_train, y_train)
        pred = model.predict(X_test)
        cv_scores.append(pred == y_test)
    
    # Print cross-validation results
    cv_accuracy = np.mean(cv_scores)
    print(f"\nCross-Validation Accuracy: {cv_accuracy:.2f}")
    
    # Train final model on full dataset
    model.fit(X, y_encoded)
    
    # Print feature importances
    feature_names = ['Time on Visual', 'Time on Definitions', 'Time on Analogies', 
                    'Time on Interactive', 'Topic Difficulty']
    importances = model.feature_importances_
    print("\nFeature Importances:")
    sorted_idx = np.argsort(importances)
    for idx in sorted_idx[::-1]:
        print(f"{feature_names[idx]}: {importances[idx]:.4f}")
    
    # Save all components together
    model_components = {
        'model': model,
        'scaler': scaler,
        'label_encoder': le,
        'feature_names': feature_names
    }
    
    with open(model_path, 'wb') as f:
        pickle.dump(model_components, f)
    print("\nModel trained and saved successfully.")