# core/mixins.py
from django.contrib.contenttypes.admin import GenericTabularInline
from django.contrib.contenttypes.models import ContentType
from comment.models import Comment


class CommentInline(GenericTabularInline):
    model = Comment
    extra = 1
    max_num = 1
    min_num = 1
    validate_min = True
    can_delete = False
    fields = ['description']

    def get_queryset(self, request):
        return Comment.objects.none()


class CommentMixin:
    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, Comment):
                content_type = ContentType.objects.get_for_model(form.instance)
                Comment.objects.create(
                    created_by=request.user,
                    description=instance.description,
                    table_name=form.instance.__class__.__name__.lower(),
                    content_type=content_type,
                    object_id=form.instance.pk,
                )
            else:
                instance.save()
        for obj in formset.deleted_objects:
            obj.delete()
        formset.save_m2m()