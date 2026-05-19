#!/usr/bin/env python3
"""Generate TTS narration for a guest promo using MAI-Voice-1 via Azure Speech API."""
from __future__ import annotations

import json
import os
import sys
import urllib.request

import sentry_sdk

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN", ""),
    traces_sample_rate=0,
    environment="github-actions",
)
sentry_sdk.set_tag("workflow", "guest-promo-tts")

AZURE_TTS_KEY = os.environ.get("AZURE_TTS_KEY", "")
AZURE_TTS_ENDPOINT = os.environ.get("AZURE_TTS_ENDPOINT", "")
AZURE_TTS_VOICE = os.environ.get("AZURE_TTS_VOICE", "mai-voice-1")

SSML_TEMPLATE = """\
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="{voice}">
    <prosody rate="medium" pitch="medium">
      {text}
    </prosody>
  </voice>
</speak>"""


def generate_tts(text: str, output_path: str) -> None:
    if not AZURE_TTS_KEY or not AZURE_TTS_ENDPOINT:
        print("❌ AZURE_TTS_KEY or AZURE_TTS_ENDPOINT not set — skipping TTS.")
        sys.exit(1)

    ssml = SSML_TEMPLATE.format(voice=AZURE_TTS_VOICE, text=text)
    req = urllib.request.Request(
        AZURE_TTS_ENDPOINT,
        data=ssml.encode("utf-8"),
        headers={
            "Ocp-Apim-Subscription-Key": AZURE_TTS_KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
            "User-Agent": "osf-guest-promo",
        },
        method="POST",
    )

    with urllib.request.urlopen(req) as resp:
        audio_data = resp.read()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(audio_data)
    print(f"✅ Generated narration ({len(audio_data)} bytes) → {output_path}")


def main() -> None:
    metadata_path = os.environ.get("METADATA_OUTPUT", "video/public/guest-promo.json")
    with open(metadata_path) as f:
        meta = json.load(f)

    text = (
        f"Join us on Open Source Friday! "
        f"We're welcoming {meta['guest_name']}, "
        f"who will be talking about {meta['project_name']}. "
        f"Stream live on YouTube on {meta['stream_date']} at {meta['stream_time']}. "
        f"Don't miss it!"
    )

    output_path = os.environ.get("NARRATION_OUTPUT", "video/public/narration.mp3")
    generate_tts(text, output_path)

    # Mark has_audio = True in metadata so Remotion includes the audio track
    meta["has_audio"] = True
    with open(metadata_path, "w") as f:
        json.dump(meta, f, indent=2)
    print("✅ Updated guest-promo.json: has_audio = true")


if __name__ == "__main__":
    main()
