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


def sanitize_tiptap(node: Any) -> Any:
    """Drop empty text nodes TipTap/ProseMirror rejects on setContent."""
    if not isinstance(node, dict):
        return node
    out: dict[str, Any] = {k: v for k, v in node.items() if k != "content"}
    if "content" not in node:
        return out
    cleaned: list[Any] = []
    for child in node.get("content") or []:
        if isinstance(child, dict) and child.get("type") == "text" and not child.get("text"):
            continue
        cleaned.append(sanitize_tiptap(child))
    if cleaned:
        out["content"] = cleaned
    return out


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


def _text(value: str) -> dict[str, Any]:
    return {"type": "text", "text": value}


def _heading(level: int, value: str) -> dict[str, Any]:
    return {"type": "heading", "attrs": {"level": level}, "content": [_text(value)]}


def _paragraph(value: str | None = None) -> dict[str, Any]:
    if value:
        return {"type": "paragraph", "content": [_text(value)]}
    return {"type": "paragraph"}


def _bullet(*items: str) -> dict[str, Any]:
    """Build a bullet list. Empty strings become empty paragraphs (no empty text nodes)."""
    return {
        "type": "bulletList",
        "content": [
            {"type": "listItem", "content": [_paragraph(item or None)]}
            for item in (items or ("",))
        ],
    }


def _ordered(*items: str) -> dict[str, Any]:
    return {
        "type": "orderedList",
        "content": [
            {"type": "listItem", "content": [_paragraph(item)]}
            for item in items
        ],
    }


def template_content(name: str | None) -> dict[str, Any]:
    key = (name or "blank").lower().strip()
    # TipTap/ProseMirror rejects empty text nodes — never emit {"text": ""}.
    templates: dict[str, dict[str, Any]] = {
        "blank": EMPTY_DOC,
        "meeting": {
            "type": "doc",
            "content": [
                _heading(1, "Meeting notes"),
                _heading(2, "Attendees"),
                _bullet(""),
                _heading(2, "Agenda"),
                _ordered("Updates", "Decisions", "Next steps"),
                _heading(2, "Action items"),
                _bullet("[ ] Owner — task — due date"),
                _paragraph(),
            ],
        },
        "spec": {
            "type": "doc",
            "content": [
                _heading(1, "Feature spec"),
                _heading(2, "Problem"),
                _paragraph("What user pain are we solving?"),
                _heading(2, "Goals"),
                _bullet("Primary outcome", "Non-goals"),
                _heading(2, "Approach"),
                _paragraph("High-level design and constraints."),
                _heading(2, "Risks"),
                _paragraph(),
            ],
        },
        "standup": {
            "type": "doc",
            "content": [
                _heading(1, "Daily standup"),
                _heading(2, "Yesterday"),
                _bullet(""),
                _heading(2, "Today"),
                _bullet(""),
                _heading(2, "Blockers"),
                _bullet("None"),
            ],
        },
    }
    return templates.get(key, EMPTY_DOC)


def enrich_list_item(doc) -> dict[str, Any]:
    raw = doc.content if isinstance(doc.content, dict) else {}
    content = sanitize_tiptap(raw) if isinstance(raw, dict) else {}
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
    raw = doc.content if isinstance(doc.content, dict) else {}
    content = sanitize_tiptap(raw) if isinstance(raw, dict) else {}
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
