# Offline simulation helpers for browser_automation scripts (copy into script body).
# Blocks every /api/ request and every non-preview-host request; records them.
HOST = "gottes-wort-app.preview.emergentagent.com"
blocked = []

async def offline_handler(route):
    u = route.request.url
    if "/api/" in u or (HOST not in u and not u.startswith("data:") and not u.startswith("blob:")):
        if "cloudflareinsights" not in u:  # beacon injected by preview infra, not the app
            blocked.append(u)
        await route.abort()
    else:
        await route.continue_()

# await page.route("**/*", offline_handler)
# Media import on web: expo-document-picker opens a file chooser:
#   async with page.expect_file_chooser() as fc: await page.click('[data-testid="media-import-button"]')
#   await (await fc.value).set_files([{"name": "TEST_ton.mp3", "mimeType": "audio/mpeg",
#       "buffer": (bytes([0xFF,0xFB,0x90,0x00]) + bytes(413)) * 120}])   # ~3s silent valid MP3
# Full backup: async with page.expect_download() as dl: await page.click('[data-testid="full-backup-button"]')
# Restore: same file-chooser pattern on full-restore-button with the downloaded JSON bytes.
