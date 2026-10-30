import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def gemini_chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return JsonResponse({"error": "Gemini is not configured on the server."}, status=503)

    try:
        payload = json.loads(request.body)
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    messages = payload.get("messages", [])
    catalog = payload.get("catalog", [])
    language = payload.get("language", "en")
    if not isinstance(messages, list) or not isinstance(catalog, list) or not messages:
        return JsonResponse({"error": "Messages and catalog must be arrays."}, status=400)

    contents = []
    for message in messages[-8:]:
        if not isinstance(message, dict) or not str(message.get("text", "")).strip():
            continue
        contents.append({
            "role": "model" if message.get("role") == "model" else "user",
            "parts": [{"text": str(message["text"])[:1200]}],
        })

    if not contents or contents[-1]["role"] != "user":
        return JsonResponse({"error": "The last message must be from the user."}, status=400)

    instruction = (
        f"You are Andiana Beauty's product assistant. Answer in {'Arabic' if language == 'ar' else 'English'}.\n"
        "Only recommend products from the catalog. Never invent stock, ingredients, medical claims, "
        "discounts, or delivery promises. Be concise and friendly. Prices are in EGP.\n"
        f"Catalog: {json.dumps(catalog[:80], ensure_ascii=False)[:24000]}"
    )
    body = json.dumps({
        "systemInstruction": {"parts": [{"text": instruction}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 350},
    }).encode("utf-8")
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    try:
        api_request = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(api_request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        if error.code == 429:
            return JsonResponse(
                {"error": "Gemini free quota is temporarily exhausted. Please try again later."},
                status=429,
            )
        return JsonResponse({"error": f"Gemini returned HTTP {error.code}."}, status=502)
    except (URLError, TimeoutError, ValueError):
        return JsonResponse({"error": "Gemini did not respond."}, status=504)

    answer = " ".join(
        part.get("text", "")
        for part in data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        if part.get("text")
    ).strip()
    if not answer:
        return JsonResponse({"error": "Gemini returned an empty answer."}, status=502)
    return JsonResponse({"answer": answer})
