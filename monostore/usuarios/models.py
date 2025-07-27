from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Perfil(models.Model):
    user        = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="perfil"
    )
    telefono    = models.CharField(max_length=20, blank=True)
    es_vendedor = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} · {self.telefono or '–'}"


@receiver(post_save, sender=User)
def crear_perfil(sender, instance, created, **kwargs):
    if created and not hasattr(instance, "perfil"):
        Perfil.objects.create(user=instance)
