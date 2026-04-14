from app.core.permissions import Role, has_permission


def test_owner_can_do_everything():
    assert has_permission(Role.OWNER, "workspace:delete")
    assert has_permission(Role.OWNER, "member:invite")
    assert has_permission(Role.OWNER, "task:create")


def test_viewer_is_read_only():
    assert has_permission(Role.VIEWER, "task:view")
    assert not has_permission(Role.VIEWER, "task:create")
    assert not has_permission(Role.VIEWER, "task:delete")
    assert not has_permission(Role.VIEWER, "doc:edit")


def test_member_cannot_delete_workspace():
    assert not has_permission(Role.MEMBER, "workspace:delete")
    assert not has_permission(Role.MEMBER, "workspace:settings")


def test_admin_cannot_change_roles():
    assert not has_permission(Role.ADMIN, "member:role_change")
    assert has_permission(Role.ADMIN, "member:invite")


def test_unknown_permission_returns_false():
    assert not has_permission(Role.OWNER, "nonexistent:action")
