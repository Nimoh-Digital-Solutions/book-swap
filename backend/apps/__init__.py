# Domain apps package.
#
# Future apps (books, swaps, messaging, reviews, notifications) go here.
# The `bookswap` app at the project root holds the User model and profile
# endpoints — it stays where it is because AUTH_USER_MODEL = 'bookswap.User'
# is already migrated.
#
# Convention:
#   backend/apps/<app_name>/
#       models.py, serializers.py, views.py, urls.py, tests/, ...
#
# Register new apps in INSTALLED_APPS as 'apps.<app_name>'.
