"""Unit tests for TipTap document preview / word count helpers."""
from app.services.document_content import (
    enrich_list_item,
    preview_text,
    template_content,
    word_count,
)


def test_word_count_and_preview_from_tiptap():
    content = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Hello world"}],
            },
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "This is a short preview body."}],
            },
        ],
    }
    assert word_count(content) == 8
    assert preview_text(content).startswith("Hello world")


def test_empty_content_counts_zero():
    assert word_count({"type": "doc", "content": [{"type": "paragraph"}]}) == 0
    assert preview_text({"type": "doc", "content": [{"type": "paragraph"}]}) == ""


def test_meeting_template_has_structure():
    doc = template_content("meeting")
    assert doc["type"] == "doc"
    assert any(n.get("type") == "heading" for n in doc["content"])


def test_templates_have_no_empty_text_nodes():
    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "text":
                assert node.get("text"), f"empty text node in {node}"
            for child in node.get("content") or []:
                walk(child)

    for name in ("blank", "meeting", "spec", "standup"):
        walk(template_content(name))


def test_sanitize_strips_empty_text():
    from app.services.document_content import sanitize_tiptap

    dirty = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": ""}],
            },
            {
                "type": "paragraph",
                "content": [{"type": "text", "text": "ok"}],
            },
        ],
    }
    clean = sanitize_tiptap(dirty)
    assert clean["content"][0] == {"type": "paragraph"}
    assert clean["content"][1]["content"][0]["text"] == "ok"


class _FakeDoc:
    def __init__(self):
        self.id = "00000000-0000-0000-0000-000000000001"
        self.title = "T"
        self.created_by = "u"
        self.last_edited_by = None
        self.created_at = "t"
        self.updated_at = "t"
        self.content = {
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "alpha beta"}]}
            ],
        }


def test_enrich_list_item():
    item = enrich_list_item(_FakeDoc())
    assert item["word_count"] == 2
    assert "alpha" in item["preview"]
