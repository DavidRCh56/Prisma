from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import pandas as pd
import io
import models
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- Schemas ---
class TransactionBase(BaseModel):
    amount: float
    category: str
    description: str
    date: str
    type: str


class CategoryBase(BaseModel):
    name: str
    budget: float


class FixedItemBase(BaseModel):
    amount: float
    category: str
    description: str
    type: str


class GoalBase(BaseModel):
    name: str
    target_amount: float
    deadline: str


# --- Startup ---
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    if db.query(models.Category).count() == 0:
        defaults = [
            ("Comida", 200),
            ("Transporte", 100),
            ("Vivienda", 500),
            ("Ocio", 50),
            ("Suscripciones", 30),
            ("Salud", 50),
            ("Otros", 100),
            ("Nómina", 0),
        ]
        for name, budget in defaults:
            db.add(models.Category(name=name, budget=budget))
        db.commit()
    db.close()


# --- Endpoints ---


@app.get("/months/")
def get_months(db: Session = Depends(get_db)):
    dates = db.query(models.Transaction.date).all()
    months = sorted(list(set([d[0][:7] for d in dates])), reverse=True)
    if not months:
        from datetime import datetime

        return [datetime.now().strftime("%Y-%m")]
    return months


@app.get("/transactions/")
def read_transactions(db: Session = Depends(get_db)):
    return db.query(models.Transaction).all()


@app.post("/transactions/")
def create_transaction(t: TransactionBase, db: Session = Depends(get_db)):
    db.add(models.Transaction(**t.dict()))
    db.commit()
    return {"msg": "ok"}


@app.delete("/transactions/{id}")
def delete_transaction(id: int, db: Session = Depends(get_db)):
    db.query(models.Transaction).filter(models.Transaction.id == id).delete()
    db.commit()
    return {"msg": "deleted"}


@app.get("/categories/")
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@app.post("/categories/")
def create_category(c: CategoryBase, db: Session = Depends(get_db)):
    db.add(models.Category(**c.dict()))
    db.commit()
    return {"msg": "created"}


@app.delete("/categories/{id}")
def delete_category(id: int, db: Session = Depends(get_db)):
    db.query(models.Category).filter(models.Category.id == id).delete()
    db.commit()
    return {"msg": "deleted"}


@app.get("/fixed/")
def get_fixed(db: Session = Depends(get_db)):
    return db.query(models.FixedItem).all()


@app.post("/fixed/")
def create_fixed(f: FixedItemBase, db: Session = Depends(get_db)):
    db.add(models.FixedItem(**f.dict()))
    db.commit()
    return {"msg": "created"}


@app.delete("/fixed/{id}")
def delete_fixed(id: int, db: Session = Depends(get_db)):
    db.query(models.FixedItem).filter(models.FixedItem.id == id).delete()
    db.commit()
    return {"msg": "deleted"}


@app.post("/fixed/apply/{month}")
def apply_fixed(month: str, db: Session = Depends(get_db)):
    existing = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.date.like(f"{month}%"),
            models.Transaction.description.like("[Fijo]%"),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Fijos ya importados este mes")

    items = db.query(models.FixedItem).all()
    for item in items:
        db.add(
            models.Transaction(
                date=f"{month}-01",
                amount=item.amount,
                category=item.category,
                description=f"[Fijo] {item.description}",
                type=item.type,
            )
        )
    db.commit()
    return {"msg": "applied"}


@app.get("/goals/")
def get_goals(db: Session = Depends(get_db)):
    return db.query(models.SavingsGoal).all()


@app.post("/goals/")
def create_goal(g: GoalBase, db: Session = Depends(get_db)):
    db.query(models.SavingsGoal).delete()
    db.add(models.SavingsGoal(**g.dict()))
    db.commit()
    return {"msg": "created"}


@app.post("/upload-csv/")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        for _, row in df.iterrows():
            db.add(
                models.Transaction(
                    date=str(row["date"]),
                    description=str(row["description"]),
                    amount=float(row["amount"]),
                    category=str(row["category"]),
                    type=str(row["type"]),
                )
            )
        db.commit()
        return {"msg": "ok"}
    except:
        raise HTTPException(status_code=400, detail="Error CSV")


@app.get("/summary/{year}")
def get_summary(year: str, db: Session = Depends(get_db)):
    txs = (
        db.query(models.Transaction)
        .filter(models.Transaction.date.like(f"{year}%"))
        .all()
    )
    inc = sum(t.amount for t in txs if t.type == "income")
    exp = sum(t.amount for t in txs if t.type == "expense")
    cats = {}
    for t in txs:
        if t.type == "expense":
            cats[t.category] = cats.get(t.category, 0) + t.amount
    return {
        "income": inc,
        "expense": exp,
        "savings": inc - exp,
        "categories": [{"name": k, "value": v} for k, v in cats.items()],
    }
