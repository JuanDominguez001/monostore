from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Perfil


# ---------- registro ----------
class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email    =validated_data.get("email", ""),
            password =validated_data["password"],
        )
        return user


# ---------- perfil (solo campos extra) ----------
class PerfilDetalleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Perfil
        fields = ["telefono", "es_vendedor"]


# ---------- perfil completo (User + Perfil) ----------
class PerfilCompletoSerializer(serializers.ModelSerializer):
    perfil = PerfilDetalleSerializer()

    class Meta:
        model  = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "perfil",
        ]

    def update(self, instance, validated_data):
        perfil_data = validated_data.pop("perfil", {})
        # actualiza campos del User
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # actualiza/crea perfil
        perfil, _ = Perfil.objects.get_or_create(user=instance)
        for attr, value in perfil_data.items():
            setattr(perfil, attr, value)
        perfil.save()
        return instance
