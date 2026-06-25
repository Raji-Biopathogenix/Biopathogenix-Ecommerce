from django.contrib import admin
from .models import Comment

# Register your models here.
@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = [
        'table_name',
        'description',
        'created_at',
        'created_by',]
    search_fields = ["table_name","created_by__email"]
    list_filter=['table_name']
    

    def has_add_permission(self, request):
        return False        
    def has_change_permission(self, request, obj=None):
        return False        
    def has_delete_permission(self, request, obj=None):
        return False        