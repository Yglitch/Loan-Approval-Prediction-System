from pydantic import BaseModel


class LoanApplicationInput(BaseModel):
    no_of_dependents: int
    education: str          # "Graduate" or "Not Graduate"
    self_employed: str      # "Yes" or "No"
    income_annum: float
    loan_amount: float
    loan_term: int
    cibil_score: int
    residential_assets_value: float
    commercial_assets_value: float
    luxury_assets_value: float
    bank_asset_value: float


class LoanApplicationOutput(BaseModel):
    status: str        # "Approved" or "Rejected"
    confidence: float   # e.g. 0.9775 -> 97.75%