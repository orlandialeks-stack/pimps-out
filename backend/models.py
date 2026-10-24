from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional


class Variant(BaseModel):
    sku: str = ""
    size: str = ""
    color: str = ""
    color_hex: str = "#111111"
    stock: int = 0
    image: Optional[str] = None


class ProductIn(BaseModel):
    name: str
    description: str = ""
    price: float = 0
    sale_price: Optional[float] = None
    category: str = ""
    collection: str = ""
    images: List[str] = []
    variants: List[Variant] = []
    material: str = ""
    gsm: Optional[int] = None
    fit: str = ""
    care: str = ""
    size_guide: str = ""
    status: str = "draft"
    featured: bool = False
    sort_order: int = 0


class TaxonomyIn(BaseModel):
    type: str  # category | collection
    name: str
    description: str = ""


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class CustomerInfo(BaseModel):
    email: EmailStr
    name: str = ""
    line1: str = ""
    city: str = ""
    postal_code: str = ""
    country: str = ""


class CheckoutItem(BaseModel):
    product_id: str
    sku: str
    qty: int = Field(ge=1, le=20)


class CheckoutReq(BaseModel):
    items: List[CheckoutItem]
    customer: CustomerInfo
    discount_code: Optional[str] = None
    origin_url: str


class DiscountIn(BaseModel):
    code: str
    type: str = "percent"  # percent | fixed
    value: float = 0
    min_subtotal: float = 0
    expires_at: Optional[str] = None
    active: bool = True
    usage_limit: Optional[int] = None


class DiscountCheck(BaseModel):
    code: str
    subtotal: float


class LeadIn(BaseModel):
    email: EmailStr
    source: str = "newsletter"


class ContactIn(BaseModel):
    name: str
    email: EmailStr
    message: str


class ChatIn(BaseModel):
    session_id: str
    message: str
    language: str = "en"


class TtsIn(BaseModel):
    text: str
    voice: str = "onyx"


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    tracking_code: Optional[str] = None
    note: Optional[str] = None
