from fastapi import APIRouter
from core.section_mapping import get_mappings

router = APIRouter()

@router.get("/mapping")
def mapping():
    return {"items": get_mappings()}
