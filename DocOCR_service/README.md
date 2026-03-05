# DocOCR Service — GramHealth

Standalone OCR service. **Port 8082. No dependency on ML_service.**

## Flow

```
step2.tsx ──► POST /extract ──► DocOCR_service
                                    │
                       Extracts (EDD, LMP) from doc
                                    │
             ◄──── { edd, lmp } ────┘
                    │
         Saves to SQLite: pregnancy_documents + pregnancy_records
                    │
         Pregnancy Dashboard reads SQLite for all calculations
```

## CHW Integration (for teammate)

- Patient submits doc in step2. Status set to `verification_status = 'pending'`
- CHW Dashboard: read `patient_profiles` WHERE `verification_status = 'pending'`
- Document viewable via `pregnancy_documents.doc_base64` for that patient's phone
- **On CHW Approval**: `UPDATE patient_profiles SET verification_status = 'approved', pregnancy_verified = 1`
- Pregnancy dashboard auto-enables based on this flag

## Setup

```bash
python -m venv venv
.\venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8082 --reload
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/extract` | Upload image file, returns EDD+LMP |
| POST | `/extract-base64` | Send base64 image string |
