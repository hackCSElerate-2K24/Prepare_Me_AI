from scripts.model_training import train_and_save_model
from scripts.predict_learning_style import load_model, predict_learning_style
import pandas as pd

def main():
    # Train and save the model
    print("Training the model...")
    train_and_save_model('data/student_learning_data.csv', 'models/best_learning_method_model.pkl')
    
    # Load the model components
    print("\nMaking predictions for new student...")
    model_components = load_model('models/best_learning_method_model.pkl')
    
    # Sample data for prediction
    new_student_data = pd.DataFrame({
        'Time on Visual': [120],
        'Time on Definitions': [45],
        'Time on Analogies': [75],
        'Time on Interactive': [50],
        'Topic Difficulty': [4]
    })
    
    # Print input data
    print("\nNew Student Data:")
    for col, value in new_student_data.iloc[0].items():
        print(f"{col}: {value}")
    
    # Predict best learning style
    recommended_method, probabilities = predict_learning_style(model_components, new_student_data)
    
    print(f"\nRecommended Learning Method: {recommended_method}")
    print("\nConfidence Scores:")
    for method, prob in probabilities.items():
        print(f"{method}: {prob:.2%}")

if __name__ == "__main__":
    main()