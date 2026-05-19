---
name: generate-guest-promo
description: Generates a 30-second promo video for an upcoming Open Source Friday guest stream using MAI-Voice-1 TTS and Remotion.
user-invocable: true
---

## Purpose

Generate a 30-second promotional video for an upcoming Open Source Friday guest, ready to post on social media.

## Instructions

When invoked as `/generate-guest-promo <issue_number>`:

1. Confirm Node.js and Python 3 are available
2. Run `cd video && npm install` if `node_modules` doesn't exist
3. Ensure these environment variables are set (prompt the user if missing):
   - `GITHUB_TOKEN` — for fetching issue data
   - `AZURE_TTS_KEY` — Azure Speech API key
   - `AZURE_TTS_ENDPOINT` — Azure Speech TTS endpoint URL
   - `AZURE_TTS_VOICE` — voice name (default: `mai-voice-1`)
4. Extract guest metadata:
   ```
   python3 .github/scripts/extract_guest_metadata.py <issue_number>
   ```
5. Generate TTS narration:
   ```
   python3 .github/scripts/generate_tts.py
   ```
6. Render the promo video:
   ```
   cd video && npm run render
   ```
7. Report the output path: `video/out/guest-promo.mp4`

## Output Files

| File | Description |
|------|-------------|
| `video/public/guest-promo.json` | Extracted guest metadata |
| `video/public/narration.mp3` | MAI-Voice-1 TTS narration |
| `video/out/guest-promo.mp4` | Final 30-second promo video |

## Example

```
/generate-guest-promo 222
```

Generates a promo for issue #222 (Angela Wen – How to contribute to OSS, June 19).
