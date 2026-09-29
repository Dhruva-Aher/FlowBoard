#!/usr/bin/env python3
"""Measure honest FlowBoard demo metrics against production (or HOST env).

Writes docs/evidence/prod-api-latency.txt — do not invent numbers.
"""
from __future__ import annotations

import json
import os
import statistics
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HOST = os.environ.get("FLOWBOARD_HOST", "https://flowboard-iota-blond.vercel.app").rstrip("/")
OUT = Path(__file__).resolve().parents[1] / "docs" / "evidence" / "prod-api-latency.txt"
ROUNDS = int(os.environ.get("ROUNDS", "5"))


def timed(method: str, path: str, data: bytes | None = None, headers: dict | None = None):
    req = urllib.request.Request(
        f"{HOST}{path}",
        data=data,
        headers=headers or {},
        method=method,
    )
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
            ms = (time.perf_counter() - t0) * 1000
            return resp.status, body, ms
    except urllib.error.HTTPError as e:
        ms = (time.perf_counter() - t0) * 1000
        return e.code, e.read(), ms


def series(label: str, fn):
    samples = []
    last_status = None
    for _ in range(ROUNDS):
        status, body, ms = fn()
        last_status = status
        samples.append(ms)
        time.sleep(0.15)
    return {
        "label": label,
        "n": ROUNDS,
        "status": last_status,
        "p50_ms": round(statistics.median(samples), 1),
        "p95_ms": round(sorted(samples)[max(0, int(0.95 * (len(samples) - 1)))], 1),
        "mean_ms": round(statistics.mean(samples), 1),
        "min_ms": round(min(samples), 1),
        "max_ms": round(max(samples), 1),
        "samples_ms": [round(s, 1) for s in samples],
    }


def main():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    email = f"metrics+{stamp}@flowboard.demo"
    password = "password123"
    name = "Metrics Bot"

    lines = [
        f"# FlowBoard production API latency — {datetime.now(timezone.utc).isoformat()}",
        f"HOST={HOST}",
        f"ROUNDS={ROUNDS}",
        "Note: single-region Vercel→Neon cold/warm mix; not a load test. Grade A for this window only.",
        "",
    ]

    results = []
    results.append(series("GET /health", lambda: timed("GET", "/health")))
    results.append(series("GET / (SPA)", lambda: timed("GET", "/")))

    # one register (not averaged — unique email)
    payload = json.dumps({"email": email, "name": name, "password": password}).encode()
    status, body, ms = timed(
        "POST",
        "/api/v1/auth/register",
        data=payload,
        headers={"content-type": "application/json"},
    )
    token = json.loads(body.decode()).get("access_token", "") if status == 200 else ""
    results.append(
        {
            "label": "POST /api/v1/auth/register (single)",
            "n": 1,
            "status": status,
            "p50_ms": round(ms, 1),
            "p95_ms": round(ms, 1),
            "mean_ms": round(ms, 1),
            "min_ms": round(ms, 1),
            "max_ms": round(ms, 1),
            "samples_ms": [round(ms, 1)],
        }
    )

    if token:
        auth = {"Authorization": f"Bearer {token}"}
        results.append(
            series(
                "GET /api/v1/auth/me",
                lambda: timed("GET", "/api/v1/auth/me", headers=auth),
            )
        )
        ws_body = json.dumps(
            {"name": "Metrics WS", "slug": f"metrics-{stamp}"}
        ).encode()
        status, body, ms = timed(
            "POST",
            "/api/v1/workspaces",
            data=ws_body,
            headers={**auth, "content-type": "application/json"},
        )
        results.append(
            {
                "label": "POST /api/v1/workspaces (single)",
                "n": 1,
                "status": status,
                "p50_ms": round(ms, 1),
                "p95_ms": round(ms, 1),
                "mean_ms": round(ms, 1),
                "min_ms": round(ms, 1),
                "max_ms": round(ms, 1),
                "samples_ms": [round(ms, 1)],
            }
        )

    for r in results:
        lines.append(
            f"{r['label']}: status={r['status']} n={r['n']} "
            f"p50={r['p50_ms']}ms p95={r['p95_ms']}ms mean={r['mean_ms']}ms "
            f"min={r['min_ms']}ms max={r['max_ms']}ms samples={r['samples_ms']}"
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n")
    print(OUT.read_text())


if __name__ == "__main__":
    main()
