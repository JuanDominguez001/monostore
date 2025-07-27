from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsStaffOrOwnerReadOnly(BasePermission):
    """
    Staff: full access
    Cliente: solo métodos seguros y su propio envío
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        if request.method in SAFE_METHODS:
            return obj.orden.usuario == request.user
        return False
