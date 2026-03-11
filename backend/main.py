from fastapi import FastAPI

app = FastAPI(title="SpeechAI Backend")
# No CORS needed — Next.js API routes proxy all requests to FastAPI.

@app.get("/health")
async def health():
    return {"status": "ok"}
