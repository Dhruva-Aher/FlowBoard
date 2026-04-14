def task_created_event(task_id: str, column_id: str, title: str) -> dict:
    return {"task_id": task_id, "column_id": column_id, "title": title}


def task_moved_event(task_id: str, from_column: str, to_column: str, position: int) -> dict:
    return {
        "task_id": task_id,
        "from_column": from_column,
        "to_column": to_column,
        "position": position,
    }


def task_updated_event(task_id: str, changes: dict) -> dict:
    return {"task_id": task_id, "changes": changes}


def task_deleted_event(task_id: str) -> dict:
    return {"task_id": task_id}


def doc_updated_event(doc_id: str, title: str) -> dict:
    return {"doc_id": doc_id, "title": title}
