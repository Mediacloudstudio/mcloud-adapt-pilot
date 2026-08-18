# Desktop Client Integration Guide

**Audience:** the team building the MCloud Adapt Pilot desktop application
(Python, running inside/alongside Adobe InDesign) that talks to this web
platform. This document has no corresponding application code in this
repository — Phase 9 of the build is documentation only. Everything it
describes was built in Phases 6–8 and is live in this codebase today.

---

## 1. The security model, in one paragraph

The desktop app is a **thin, untrusted client**. It never talks to
Razorpay, never sees another customer's data, never decides for itself
what it's allowed to do, and never receives a secret it could extract and
misuse. Every decision that matters — is this license real, is the
subscription paid up, is there a free device slot, which templates is this
company allowed to use, is a feature flag on — is made by the server, on
every single request, by reading the database fresh. Nothing the client
asserts about itself (its own device limit, its own entitlement, its own
"I already checked this five minutes ago") is ever trusted. This mirrors
PART 53/65/66 of the original product spec and is enforced identically
across every endpoint below.

---

## 2. Base URL and versioning

All endpoints below live under:

```
{NEXT_PUBLIC_APP_URL}/api/v1/
```

e.g. in production, `https://app.mediacloud.studio/api/v1/license/activate`.
The `v1` prefix is deliberate — if the API ever needs a breaking change,
it ships as `/api/v2/**` alongside the old routes rather than breaking
every installed copy of the desktop app at once.

Every request is `POST` with a JSON body (`Content-Type: application/json`)
and every response is JSON. There is no separate API key — identity comes
either from a license key (only ever sent once, at activation) or from the
short-lived device token issued in exchange for it (see §4).

---

## 3. Recommended client flow

```
┌─────────────────┐
│  First launch /  │
│  no stored token  │
└─────────┬─────────┘
          │  user pastes license key (from their portal)
          ▼
   POST /license/activate  ──────► store deviceToken + tokenExpiresAt
          │                          (see §5 for where/how)
          ▼
   App runs normally, using cached entitlement data
   (feature flags, template list) fetched at activation/validate time.

┌───────────────────────────────────────────────────────────┐
│  On every subsequent app launch:                            │
│   - If deviceToken is missing/expired  → re-activate         │
│     (same call, same key, idempotent — see §4.1)             │
│   - Else                              → POST /license/validate│
│     to refresh status + get a new token before the old one   │
│     expires                                                   │
└───────────────────────────────────────────────────────────┘

   While the app stays open:
   - POST /device/heartbeat every ~1 hour (cheap liveness ping)
   - POST /app/config on launch (and periodically) for feature
     flags + banners
   - POST /templates/list on launch (and periodically) for the
     template picker

   On uninstall / "deactivate this computer" in Settings:
   - POST /license/deactivate
```

The device token (§4) is what lets the app keep working for
**`LICENSE_TOKEN_TTL_HOURS`** (default 48h, admin-configurable via env)
without network access — validate opportunistically, but don't hard-block
app startup on it if the machine is offline and the cached token hasn't
expired yet.

---

## 4. Endpoints

### 4.1 `POST /api/v1/license/activate`

Called once per install (or again, idempotently, if the app reinstalls on
the same machine — the same `deviceId` just refreshes its record instead
of consuming a second device slot).

**Request**

```json
{
  "licenseKey": "MCAP-XXXX-XXXX-XXXX-XXXX",
  "deviceId": "a stable, client-generated identifier — see §6",
  "fingerprint": "raw machine fingerprint string — hashed server-side, never stored raw",
  "deviceName": "DESIGN-PC-01",
  "computerName": "DESKTOP-AB12CD3",
  "os": "Windows 11 Pro 23H2",
  "appVersion": "2.4.0"
}
```

**Response — success (200)**

```json
{
  "status": "ACTIVE",
  "message": "Device activated.",
  "deviceToken": "opaque signed token — store this, not the license key",
  "tokenExpiresAt": "2026-08-20T10:00:00.000Z",
  "license": { "displayKey": "MCAP-AB12-****-Z9Y8", "validUntil": null },
  "plan": { "name": "Professional", "deviceLimit": 5 },
  "subscriptionStatus": "ACTIVE",
  "company": { "name": "ABC Creative Pvt Ltd" }
}
```

**Failure responses**

| HTTP | `status` | Meaning |
|---|---|---|
| 400 | `ERROR` | Malformed request body |
| 404 | `ERROR` | License key doesn't exist |
| 403 | `ERROR` | License is suspended/revoked/expired, or the company's subscription isn't in good standing |
| 409 | `ERROR` | Device limit reached — show the user "you have N/N devices activated, deactivate one first" and point them at Portal → Devices |
| 429 | `ERROR` | Too many activation attempts from this network (brute-force guard) — back off and retry later |
| 503 | `ERROR` | Licensing isn't configured on this server yet (dev/staging only) |

### 4.2 `POST /api/v1/license/validate`

Call on every app launch once a device token exists, and periodically
while the app is open (e.g. every few hours), to catch a mid-session
suspension or plan change. Also refreshes the device token.

**Request** — either form works:

```json
{ "deviceToken": "the token stored at activation" }
```
```json
{ "licenseKey": "MCAP-XXXX-XXXX-XXXX-XXXX", "deviceId": "same id used at activation" }
```

Use the `licenseKey` + `deviceId` fallback only if the stored token was
lost (e.g. app data got cleared) — prefer the token form.

**Response — success (200)**

```json
{
  "status": "ACTIVE",
  "deviceToken": "a freshly-issued token",
  "tokenExpiresAt": "2026-08-22T10:00:00.000Z",
  "subscriptionStatus": "ACTIVE",
  "license": { "displayKey": "MCAP-AB12-****-Z9Y8", "validUntil": null },
  "plan": { "name": "Professional", "deviceLimit": 5 },
  "deviceLimit": 5,
  "activeDeviceCount": 3
}
```

**Failure `status` values:** `DEVICE_INACTIVE`, `LICENSE_INVALID`,
`SUBSCRIPTION_INACTIVE` (all HTTP 403) — each means "stop letting the user
generate output" until the underlying issue in the portal is resolved.
`ERROR` (401) means the token/key combination didn't resolve to a real
device at all — treat the same as "not activated," and prompt for
re-activation.

### 4.3 `POST /api/v1/license/deactivate`

Frees this device's slot. Call from a "Deactivate this computer" button in
the app's own settings, and ideally from an uninstaller hook.

**Request:** same two forms as validate. **Response:**
`{"status": "DEACTIVATED", "message": "Device slot released."}` — always
200, even if the device was already inactive (idempotent).

### 4.4 `POST /api/v1/device/heartbeat`

Cheap liveness ping — call roughly hourly while the app is open. Keeps
`lastSeenAt` fresh so Admin → Devices shows real activity, without the
overhead of a full validate round trip. Does **not** refresh the device
token or re-confirm entitlement beyond "is this device still active" —
rely on `/license/validate` for the authoritative check.

**Request:** same two forms as validate, plus optional `"appVersion"`.
**Response:** `{"status": "OK", "serverTime": "..."}` or
`{"status": "DEVICE_INACTIVE", ...}` (403).

### 4.5 `POST /api/v1/app/version`

**Public — no device token required.** Call this before the user has even
entered a license key, so the installer/updater can nag about a mandatory
update before activation is even possible.

**Request**

```json
{ "currentVersion": "2.3.0", "platform": "WINDOWS" }
```

`currentVersion` is optional — omit it to just fetch the latest published
version info without a comparison.

**Response**

```json
{
  "status": "OK",
  "latestVersion": "2.4.0",
  "minimumSupportedVersion": "2.0.0",
  "mandatory": false,
  "installerUrl": "https://.../MCloudAdaptPilot-2.4.0-setup.exe",
  "releaseNotes": "...",
  "updateAvailable": true,
  "updateRequired": false
}
```

If `updateRequired` is `true`, the app's current version has fallen below
`minimumSupportedVersion` — **block usage**, not just show a banner, until
the user updates. If only `updateAvailable` is true, a dismissible nag is
enough.

### 4.6 `POST /api/v1/app/config`

Device-authed (same two request forms as validate). Returns resolved
feature flags and any active promotional/informational banners.

**Response**

```json
{
  "status": "OK",
  "featureFlags": {
    "enable_batch_processing": true,
    "enable_template_generator": true,
    "enable_ratio_generator": false
  },
  "banners": [
    { "id": "...", "title": "Welcome to MCloud Adapt Pilot 1.0", "subtitle": "...", "imageUrl": null, "linkUrl": null }
  ]
}
```

`featureFlags` is a flat `{code: boolean}` map — the server has already
resolved company/plan/global precedence, so the client just reads the
boolean for whatever `code` it cares about. An unknown code is simply
absent from the map; treat a missing key as `false`.

### 4.7 `POST /api/v1/templates/list`

Device-authed. Returns exactly the InDesign templates this company has
been granted in Admin → Templates.

**Response**

```json
{
  "status": "OK",
  "templates": [
    {
      "id": "...",
      "name": "Retail Shelf-Talker A5",
      "category": "In-Store",
      "categoryCode": "INSTORE",
      "version": "1.2.0",
      "thumbnailUrl": null,
      "description": null,
      "grantedAt": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

An empty array is a valid, normal response — it means the customer hasn't
been assigned any templates yet, not an error.

---

## 5. Storing the device token securely

`deviceToken` is the closest thing the desktop app holds to a credential.
Treat it like one:

- Store it in the OS-native secure storage where available — Windows
  Credential Manager (e.g. via `keyring` in Python) rather than a plain
  file.
- If secure storage isn't available in your build target, at minimum
  don't store it next to the license key in plaintext, and don't log it.
- The token is intentionally short-lived (default 48h) and scoped to one
  `deviceId` — a leaked token is far less damaging than a leaked license
  key, but it's still worth protecting.
- **Never** store the raw license key after activation succeeds. The
  server only needs it once; keep it around only long enough to retry a
  failed activation, then discard it in favor of the device token.

---

## 6. Generating `deviceId` and `fingerprint`

- `deviceId` must be **stable across app restarts and updates**, but
  doesn't need to be a hardware ID — a UUID generated once on first run
  and persisted locally (in the same secure-ish local storage as the
  token) is the simplest reliable option. If it changes, the server treats
  it as a brand-new device and it will count against the device limit
  again.
- `fingerprint` is sent once, at activation, and hashed server-side
  (SHA-256) before storage — the server never keeps a reversible copy.
  A reasonable Windows fingerprint is a hash of a few stable, low-PII
  signals (e.g. machine GUID + CPU identifier), not anything that
  uniquely identifies the *person* using the machine.

---

## 7. Minimal Python client sketch

This is illustrative, not a drop-in module — the real desktop client repo
should adapt it to its own HTTP/retry/logging conventions.

```python
import json
import platform
import uuid
from pathlib import Path

import requests

BASE_URL = "https://app.mediacloud.studio/api/v1"
STATE_FILE = Path.home() / ".mcloud-adapt-pilot" / "device-state.json"


def _load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def _save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state))
    # On Windows, prefer `keyring.set_password(...)` for deviceToken
    # instead of a plain JSON file — shown flat here for clarity.


def _device_id() -> str:
    state = _load_state()
    if "deviceId" not in state:
        state["deviceId"] = str(uuid.uuid4())
        _save_state(state)
    return state["deviceId"]


def activate(license_key: str, app_version: str) -> dict:
    response = requests.post(
        f"{BASE_URL}/license/activate",
        json={
            "licenseKey": license_key,
            "deviceId": _device_id(),
            "fingerprint": platform.node() + platform.machine(),  # replace with a real fingerprint
            "deviceName": platform.node(),
            "computerName": platform.node(),
            "os": f"{platform.system()} {platform.release()}",
            "appVersion": app_version,
        },
        timeout=15,
    )
    data = response.json()
    if response.ok:
        state = _load_state()
        state.update({"deviceToken": data["deviceToken"], "tokenExpiresAt": data["tokenExpiresAt"]})
        _save_state(state)
    return data


def validate() -> dict:
    state = _load_state()
    response = requests.post(
        f"{BASE_URL}/license/validate",
        json={"deviceToken": state.get("deviceToken")},
        timeout=15,
    )
    data = response.json()
    if response.ok and "deviceToken" in data:
        state.update({"deviceToken": data["deviceToken"], "tokenExpiresAt": data["tokenExpiresAt"]})
        _save_state(state)
    return data


def heartbeat(app_version: str) -> None:
    state = _load_state()
    try:
        requests.post(
            f"{BASE_URL}/device/heartbeat",
            json={"deviceToken": state.get("deviceToken"), "appVersion": app_version},
            timeout=10,
        )
    except requests.RequestException:
        pass  # heartbeats are best-effort; never block the app on one failing


def get_config() -> dict:
    state = _load_state()
    response = requests.post(f"{BASE_URL}/app/config", json={"deviceToken": state.get("deviceToken")}, timeout=15)
    return response.json()


def list_templates() -> dict:
    state = _load_state()
    response = requests.post(f"{BASE_URL}/templates/list", json={"deviceToken": state.get("deviceToken")}, timeout=15)
    return response.json()
```

### Offline behavior

If a network call fails outright (no connectivity), fall back to the last
successfully cached response **only until `tokenExpiresAt` passes**. Once
the cached token has expired, the app must reach the server (or block
usage) — this is the enforcement point for "the desktop app cannot run
forever on a cancelled subscription just because it never went online
again."

---

## 8. What the desktop client must never do

- Never call Razorpay directly, for anything. All payment and refund
  logic lives server-side (Phase 6); the desktop app has no Razorpay keys
  and never needs any.
- Never store the raw license key past the activation call that
  consumed it.
- Never trust its own cached `featureFlags`/`templates`/entitlement data
  past the point a fresh `/license/validate` or `/app/config` call could
  reasonably have happened — a long-offline machine should re-check as
  soon as it's back online, not silently keep running on week-old
  entitlement.
- Never assume a `200` response from an endpoint that requires
  identification means "I'm licensed" — always read the `status` field;
  some endpoints return `200` with a `status` other than `OK`/`ACTIVE`
  when the *request* was well-formed but the *entitlement* isn't there.
- Never construct its own device-limit or plan logic client-side. If the
  server says the device limit is reached, that's final — there is no
  client-side override.
