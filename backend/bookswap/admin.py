# Block and Report admin moved to apps/trust_safety/admin.py

from django.contrib import admin
from django.contrib.auth import get_user_model
from nimoh_base.auth.admin import EnhancedUserAdmin

User = get_user_model()

# nimoh_base's EnhancedUserAdmin registers a UserProfileBasicInline that
# expects fields (display_name, bio, timezone, profile_visibility,
# can_lead_group) on the UserProfile model.  BookSwap's UserProfile is a
# thin model without those fields, so we unregister the default and
# re-register with inlines cleared.
admin.site.unregister(User)


@admin.register(User)
class BookSwapUserAdmin(EnhancedUserAdmin):
    inlines = ()
