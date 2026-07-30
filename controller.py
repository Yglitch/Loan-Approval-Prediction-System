"""
controller.py
--------------
Defines the API routes (endpoints) for the loan approval prediction service.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dtos import LoanApplicationInput, LoanApplicationOutput
from model import LoanApplication
from ml_model import predict_loan_status

router = APIRouter()


@router.post("/predict", response_model=LoanApplicationOutput)
def predict_loan(data: LoanApplicationInput, db: Session = Depends(get_db)):
    """
    Accepts applicant details, runs the ML model, saves the result
    to the database, and returns the prediction.
    """
    try:
        result = predict_loan_status(data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    # Save the application + prediction to the database
    record = LoanApplication(
        **data.model_dump(),
        predicted_status=result["status"],
        confidence=result["confidence"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return LoanApplicationOutput(**result)


@router.get("/history")
def get_history(db: Session = Depends(get_db), limit: int = 20):
    """
    Returns the most recent loan applications and their predictions.
    """
    records = (
        db.query(LoanApplication)
        .order_by(LoanApplication.created_at.desc())
        .limit(limit)
        .all()
    )
    return records


# for specific person

@router.get("/history/{record_id}")
def get_history_by_id(record_id: int, db: Session = Depends(get_db)):
    """
    Returns a single past loan application by its database ID.
    """
    record = db.query(LoanApplication).filter(LoanApplication.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record