import json
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse, Response
from openai import OpenAI
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

from db import db
from models import ChatIn, TtsIn
from routes_content import DEFAULT_CONTENT

assistant_router = APIRouter(prefix="/api/assistant", tags=["assistant"])
LANGS = {"en": "English", "it": "Italian", "es": "Spanish", "ru": "Russian"}
_sessions = {}


def _openai() -> OpenAI:
    return OpenAI(api_key=os.environ["EMERGENT_LLM_KEY"],
                  base_url="https://integrations.emergentagent.com/v1")


async def _system_prompt(language: str) -> str:
    content = await db.site_content.find_one({"key": "site"}, {"_id": 0}) or DEFAULT_CONTENT
    products = await db.products.find({"status": "published"}).to_list(100)
    if products:
        lines = []
        for p in products:
            variants = ", ".join(
                f"{v.get('size','')}/{v.get('color','')} x{v.get('stock',0)}" for v in p.get("variants", []))
            price = p.get("sale_price") or p.get("price")
            lines.append(f"- {p['name']} | EUR {price} | category: {p.get('category','-')} | "
                         f"material: {p.get('material','-')} {str(p.get('gsm'))+'gsm' if p.get('gsm') else ''} | "
                         f"fit: {p.get('fit','-')} | stock: {variants or 'none'}")
        catalog = "CURRENT LIVE CATALOGUE (real data, never invent beyond this):\n" + "\n".join(lines)
    else:
        catalog = ("The PIMPS OUT collection has NOT launched yet. The catalogue is empty. "
                   "Never invent or recommend specific products, prices or stock. Explain the brand is in "
                   "pre-launch, mention the coming-soon drop, and invite the visitor to join the newsletter "
                   "for early access.")
    faq = "\n".join(f"Q: {f['q']}\nA: {f['a']}" for f in content.get("faq", []))
    policies = "\n".join(content.get("shipping_returns", {}).get("paragraphs", []))
    lang_name = LANGS.get(language, "English")
    return f"""You are the official PIMPS OUT shopping assistant — a premium streetwear brand.
Brand philosophy (use consistently): "We don't follow trends. We create our own rules."
Tone: confident, concise, streetwear-savvy, never pushy. Keep answers short (max ~120 words).

RULES:
- ALWAYS reply in {lang_name}.
- Only use the verified information below. Never invent products, prices, stock, discounts, dates or policies.
- If asked something not covered below, say so honestly and offer to connect the visitor with the team via the contact page ({content.get('contact', {}).get('email', '')}).
- If the visitor needs a human (refunds, complaints, partnerships), direct them to the contact page.

{catalog}

SHIPPING & RETURNS POLICY:
{policies}

FAQ:
{faq}
"""


@assistant_router.post("/chat")
async def chat(data: ChatIn):
    system = await _system_prompt(data.language)
    chat = _sessions.get(data.session_id)
    if chat is None:
        chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=data.session_id,
                       system_message=system).with_model("openai", "gpt-5.4-mini")
        _sessions[data.session_id] = chat
        if len(_sessions) > 500:
            _sessions.pop(next(iter(_sessions)))

    async def gen():
        full = []
        try:
            async for ev in chat.stream_message(UserMessage(text=data.message)):
                if isinstance(ev, TextDelta):
                    full.append(ev.content)
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        await db.assistant_logs.insert_one({
            "session_id": data.session_id, "message": data.message,
            "reply": "".join(full), "language": data.language,
            "created_at": datetime.now(timezone.utc)})
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@assistant_router.post("/tts")
async def tts(data: TtsIn):
    try:
        audio = _openai().audio.speech.create(model="tts-1", voice=data.voice, input=data.text[:4000])
        return Response(content=audio.content, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(500, f"Voice synthesis unavailable: {e}")


@assistant_router.post("/stt")
async def stt(file: UploadFile = File(...)):
    try:
        content = await file.read()
        import io
        buf = io.BytesIO(content)
        buf.name = file.filename or "audio.webm"
        result = _openai().audio.transcriptions.create(model="whisper-1", file=buf)
        return {"text": result.text}
    except Exception as e:
        raise HTTPException(500, f"Speech recognition unavailable: {e}")
