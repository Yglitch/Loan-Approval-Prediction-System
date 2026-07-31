import joblib
import pandas as pd

label_encoders = joblib.load("label_encoding.pkl")
scaler = joblib.load("scaler.joblib")
model = joblib.load("grid_estimator.joblib")

FEATURE_ORDER = [
    "no_of_dependents", "education", "self_employed", "income_annum",
    "loan_amount", "loan_term", "cibil_score", "residential_assets_value",
    "commercial_assets_value", "luxury_assets_value", "bank_asset_value",
]


def predict_loan_status(applicant: dict) -> dict:
    df = pd.DataFrame([applicant])

    # Training data had a leading space before these values (" Graduate", " Not Graduate", etc.)
    # Normalize incoming values to match: strip any existing whitespace, then add exactly one leading space
    for col in ["education", "self_employed"]:
        df[col] = " " + df[col].astype(str).str.strip()

    for col, le in label_encoders.items():
        if col in df.columns:
            df[col] = le.transform(df[col])

    df = df[FEATURE_ORDER]
    scaled = scaler.transform(df)

    pred = model.predict(scaled)[0]
    proba_approved = model.predict_proba(scaled)[0, 1]

    status = "Approved" if pred == 1 else "Rejected"
    confidence = proba_approved if pred == 1 else (1 - proba_approved)

    return {"status": status, "confidence": round(float(confidence), 4)}