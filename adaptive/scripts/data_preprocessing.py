import pandas as pd
from sklearn.preprocessing import StandardScaler

def load_and_preprocess_data(file_path):
    """
    Loads the dataset from a CSV file, processes the data, and scales the features.
    """
    # Load the data
    df = pd.read_csv(file_path)

    # Clean column names
    df.columns = df.columns.str.strip()

    print("Original unique values in Preferred Method:", df['Preferred Method'].unique())
    
    # Standardize the Preferred Method labels (convert to lowercase and strip whitespace)
    df['Preferred Method'] = df['Preferred Method'].str.lower().str.strip()
    
    print("Standardized unique values in Preferred Method:", df['Preferred Method'].unique())
    
    # Select features and target variable
    X = df[['Time on Visual', 'Time on Definitions', 'Time on Analogies', 
            'Time on Interactive', 'Topic Difficulty']]
    y = df['Preferred Method']
    
    # Standardize the features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y, scaler