"""TipTap/ProseMirror helpers for document previews and templates."""
from __future__ import annotations

from typing import Any


EMPTY_DOC: dict[str, Any] = {"type": "doc", "content": [{"type": "paragraph"}]}


def extract_plain_text(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    if node.get("type") == "text":
        return str(node.get("text") or "")
    parts: list[str] = []
    for child in node.get("content") or []:
        text = extract_plain_text(child)
        if text:
            parts.append(text)
    # Separate block-ish nodes with spaces so word counts stay sensible
    return " ".join(parts)


def word_count(content: dict[str, Any] | None) -> int:
    text = extract_plain_text(content or {})
    words = [w for w in text.split() if w]
    return len(words)


def preview_text(content: dict[str, Any] | None, limit: int = 160) -> str:
    text = " ".join(extract_plain_text(content or {}).split())
    if not text:
        return ""
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def template_content(name: str | None) -> dict[str, Any]:
    key = (name or "blank").lower().strip()
    templates: dict[str, dict[str, Any]] = {
        "blank": EMPTY_DOC,
        "meeting": {
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Meeting notes"}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Attendees"}]},
                {
                    "type": "bulletList",
                    "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": ""}]}]},
                    ],
                },
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Agenda"}]},
                {
                    "type": "orderedList",
                    "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Updates"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Decisions"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Next steps"}]}]},
                    ],
                },
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Action items"}]},
                {
                    "type": "bulletList",
                    "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[ ] Owner — task — due date"}]}]},
                    ],
                },
                {"type": "paragraph"},
            ],
        },
        "spec": {
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Feature spec"}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Problem"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "What user pain are we solving?"}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Goals"}]},
                {
                    "type": "bulletList",
                    "content": [
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Primary outcome"}]}]},
                        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Non-goals"}]}]},
                    ],
                },
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Approach"}]},
                {"type": "paragraph", "content": [{"type": "text", "text": "High-level design and constraints."}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Risks"}]},
                {"type": "paragraph"},
            ],
        },
        "standup": {
            "type": "doc",
            "content": [
                {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Daily standup"}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Yesterday"}]},
                {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph"}]}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Today"}]},
                {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph"}]}]},
                {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Blockers"}]},
                {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "None"}]}]}]},
            ],
        },
    }
    return templates.get(key, EMPTY_DOC)


def enrich_list_item(doc) -> dict[str, Any]:
    content = doc.content if isinstance(doc.content, dict) else {}
    return {
        "id": doc.id,
        "title": doc.title,
        "created_by": doc.created_by,
        "last_edited_by": doc.last_edited_by,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "preview": preview_text(content),
        "word_count": word_count(content),
    }


def enrich_response(doc) -> dict[str, Any]:
    content = doc.content if isinstance(doc.content, dict) else {}
    return {
        "id": doc.id,
        "workspace_id": doc.workspace_id,
        "title": doc.title,
        "content": content,
        "created_by": doc.created_by,
        "last_edited_by": doc.last_edited_by,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "preview": preview_text(content),
        "word_count": word_count(content),
    }
