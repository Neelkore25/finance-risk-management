import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def fit_risk_segmentation_clusters(feature_matrix):
    """
    Fits K-Means (n_clusters=3) on financial ratio feature profiles:
    [Income, DTI Ratio, Savings Rate, Emergency Coverage Months]
    Returns cluster labels and mapped Risk Category names.
    """
    df = pd.DataFrame(feature_matrix, columns=['monthly_income', 'dti_ratio', 'savings_rate', 'emergency_coverage'])
    df = df.fillna(0)

    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(df)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    labels = kmeans.fit_predict(scaled_features)
    df['cluster'] = labels

    # Map clusters based on average DTI and Savings Rate
    cluster_summary = df.groupby('cluster').agg({
        'dti_ratio': 'mean',
        'savings_rate': 'mean',
        'emergency_coverage': 'mean'
    }).reset_index()

    # Sort clusters by risk severity: higher DTI + lower savings = higher risk
    cluster_summary['risk_index'] = cluster_summary['dti_ratio'] - cluster_summary['savings_rate']
    cluster_summary = cluster_summary.sort_values('risk_index').reset_index(drop=True)

    risk_map = {
        cluster_summary.loc[0, 'cluster']: 'Low Risk Segment',
        cluster_summary.loc[1, 'cluster']: 'Moderate Risk Segment',
        cluster_summary.loc[2, 'cluster']: 'High Risk Segment'
    }

    df['risk_segment'] = df['cluster'].map(risk_map)
    return df[['cluster', 'risk_segment']].to_dict(orient='records')
