from fastapi import FastAPI

from database import engine, Base
from model import LoanApplication   # imported so Base knows about this table
from controller import router as loan_router

# Create all tables that don't already exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Loan Approval Prediction API",
    description="Predicts loan approval status based on applicant details.",
    version="1.0.0",
)

app.include_router(loan_router, tags=["Loan Prediction"])


@app.get("/")
def root():
    return {"message": "Loan Approval Prediction API is running"}