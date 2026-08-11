import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_allowed_origins
from api.chat import router as chat_router
from api.history import router as history_router
from api.mapping import router as mapping_router
from api.auth import router as auth_router

app = FastAPI(
    title="IPC-BNS Legal Assistant API",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(chat_router)
app.include_router(history_router)
app.include_router(mapping_router)
app.include_router(auth_router)
