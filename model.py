from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base
 
 
class LoanApplication(Base):
    __tablename__ = "loan_applications"
 
    id = Column(Integer, primary_key=True, index=True)
 
    # Applicant input fields
    no_of_dependents = Column(Integer, nullable=False)
    education = Column(String, nullable=False)          # "Graduate" / "Not Graduate"
    self_employed = Column(String, nullable=False)       # "Yes" / "No"
    income_annum = Column(Float, nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_term = Column(Integer, nullable=False)
    cibil_score = Column(Integer, nullable=False)
    residential_assets_value = Column(Float, default=0)
    commercial_assets_value = Column(Float, default=0)
    luxury_assets_value = Column(Float, default=0)
    bank_asset_value = Column(Float, default=0)
 
    # Prediction result fields
    predicted_status = Column(String, nullable=False)    # "Approved" / "Rejected"
    confidence = Column(Float, nullable=False)
 
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
 