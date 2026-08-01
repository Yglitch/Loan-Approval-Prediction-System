# 🏦 Loan Prediction — Machine Learning Based Loan Approval Prediction System

Loan Prediction is a machine learning project that predicts whether a customer's loan application is likely to be **Approved** or **Rejected** based on their financial information, credit history, and asset details.

The project is designed to assist banks and financial institutions by providing fast, consistent, and data-driven loan eligibility predictions. It combines a trained machine learning model with a FastAPI backend and an interactive web interface for real-time predictions.

---

# 📌 Overview

The system analyzes multiple applicant attributes such as annual income, CIBIL score, loan amount, education, employment status, and asset values to estimate loan approval.

The complete workflow includes data preprocessing, model training, prediction, and deployment through a FastAPI application.

The project can be integrated into:

* 🏦 Banking Applications
* 💳 Loan Management Systems
* 🌐 Web Applications
* 📱 Financial Service Platforms

---

# 🔍 Key Features

### ✔ Intelligent Loan Prediction

Predicts whether a loan application will be **Approved** or **Rejected** using a trained machine learning model.

### ✔ FastAPI Backend

Provides fast and lightweight REST APIs for real-time predictions.

### ✔ Interactive User Interface

Simple and responsive frontend built with HTML, CSS, and JavaScript.

### ✔ Financial Risk Assessment

Analyzes applicant financial details before generating a prediction.

### ✔ Real-Time Prediction

Returns results instantly after the applicant submits the form.

### ✔ Modular Architecture

Backend, frontend, and machine learning model are separated, making the project easy to maintain and extend.

---

# 📋 Input Features

The model uses the following applicant information:

* Number of Dependents
* Education
* Self Employed
* Annual Income
* Loan Amount
* Loan Term
* CIBIL Score
* Residential Assets Value
* Commercial Assets Value
* Luxury Assets Value
* Bank Asset Value

---

# 🧠 Machine Learning Workflow

The training pipeline includes:

1. Data preprocessing
2. Handling categorical features
3. Feature selection
4. Train-test splitting
5. Model training
6. Model evaluation
7. Saving the trained model
8. Deployment with FastAPI

The trained model is stored as:

```text
model.pkl
```

---

# 🔮 Prediction Pipeline

The prediction system performs the following steps:

1. Receives applicant information from the web interface.
2. Sends the data to the FastAPI backend.
3. Preprocesses the input.
4. Loads the trained machine learning model.
5. Predicts loan approval status.
6. Returns the prediction to the user interface.

This allows the application to provide instant and reliable loan eligibility predictions.

---

# 📁 Project Structure

```text
Loan_Prediction/

├── app.py                 # FastAPI application
├── model.py               # Prediction logic
├── model.pkl              # Trained ML model
├── requirements.txt
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── templates/
│   └── index.html
│
└── README.md
```

---

# 🛠 Technology Stack

* Python
* FastAPI
* Scikit-learn
* Pandas
* NumPy
* Joblib
* HTML
* CSS
* JavaScript

---

# 🚀 Running the Project

### Clone the Repository

```bash
git clone https://github.com/Yglitch/Loan_Prediction.git
```

### Move into the Project

```bash
cd Loan_Prediction
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Start the FastAPI Server

```bash
uvicorn app:app --reload
```

Open your browser and visit:

```text
http://127.0.0.1:8000
```

---

# 🎯 Future Improvements

* User Authentication
* Loan Approval Probability
* Explainable AI Predictions
* Prediction History
* Database Integration
* Cloud Deployment
* Model Retraining Pipeline

---

# 👥 Author

### Yash Rana (Yglitch)
### Saarthak Sajwan (saarthak911)
### Adarsh Gusain (adarsh9421)


---

# 📄 License

This project is released under the MIT License.

You are free to use, modify, and distribute the code with proper attribution.

---

# 📬 Contact

If you have any questions, suggestions, or collaboration ideas, feel free to connect or open an issue in this repository.

⭐ If you found this project useful, don't forget to star the repository!
