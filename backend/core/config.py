import os

ALLOWED_ORIGINS = (
    os.getenv("ALLOWED_ORIGINS")
    or os.getenv("FRONTEND_ORIGINS")
    or "http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,https://ipc-bns-legal-assistant.vercel.app"
)

def get_allowed_origins() -> list[str]:
    return ["*"]
