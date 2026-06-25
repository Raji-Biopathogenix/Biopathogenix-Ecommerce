from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.hashers import make_password
from django.db import transaction
from django.db.models import Q
from django.utils.crypto import get_random_string
from rest_framework.decorators import api_view
from rest_framework_simplejwt.tokens import AccessToken

from .models import CustomUser,Roles,UserRole

from .tasks import send_welcome_email,send_verification_email,send_activation_admin_email,send_activation_user_email
from .serializers import UserSerializer, UserListSerializer
# from google.oauth2 import id_token
# from google.auth.transport import requests
from django.conf import settings

from utils.emailUtil import EmailService,send_otp,verify_otp
from config.settings import configSettings
from django.contrib.auth.hashers import check_password

from api.views import get_or_none

import logging
import os

import time
from django.core.cache import cache

logger = logging.getLogger(__name__)


def send_welcome_email_safe(email, context):
    """Send welcome email synchronously for activation reliability."""
    try:
        send_welcome_email(email, context)
    except Exception as exc:
        logger.exception("Failed to send welcome email to %s: %s", email, exc)


def send_verification_email_safe(email, context):
    """Send verification email via Celery when configured, else send synchronously."""
    try:
        if getattr(settings, "CELERY_BROKER_URL", None):
            send_verification_email.delay(email, context)
        else:
            send_verification_email(email, context)
    except Exception as exc:
        logger.exception("Failed to send verification email to %s: %s", email, exc)


def send_activation_admin_email_safe(email, context):
    """Send verification email via Celery when configured, else send synchronously."""
    try:
        if getattr(settings, "CELERY_BROKER_URL", None):
            send_activation_admin_email.delay(email, context)
        else:
            send_activation_admin_email(email, context)
    except Exception as exc:
        logger.exception("Failed to send verification email to %s: %s", email, exc)


def send_activation_user_email_safe(email, context):
    """Send verification email via Celery when configured, else send synchronously."""
    try:
        if getattr(settings, "CELERY_BROKER_URL", None):
            send_activation_user_email.delay(email, context)
        else:
            send_activation_user_email(email, context)
    except Exception as exc:
        logger.exception("Failed to send verification email to %s: %s", email, exc)




def send_password_changed_email_safe(user):
    try:
        EmailService.send_html(
            [user.email],
            "Password changed successfully",
            "password_changed_email.html",
            {
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
            },
        )
    except Exception as exc:
        logger.exception("Failed to send password change email to %s: %s", user.email, exc)


class CustomerViews(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        if "email" in data and data["email"]:
            data["email"] = data["email"].lower().strip()

        serializer = UserSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            print("serializer.errors",serializer.errors)
            return Response({"status": "failure", "errors": serializer.errors}, status=400)

        generated_password = get_random_string(12)
        with transaction.atomic():
            user = serializer.save()
            user.save()

            # is_active=True
            # roles = Roles.objects.filter(name__in= ['customer','laboratory'])
            # for eachRole in roles:
            #     userRole= UserRole.objects.create(user=user,role=eachRole)
            #     userRole.save()

        get_user= get_or_none(CustomUser,id=user.id)
        # Keep the password unusable until the account is activated by admin.
        # A real password is assigned in ActivationEmail via set_password().
        get_user.set_unusable_password()
        get_user.save(update_fields=["password"])

        send_verification_email_safe(
            user.email,
            {
                "subject": "Verification Email From BioPathogenix",
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "verfication_link": f"{configSettings.FRONTEND_URL}/verify/{user.uid}",
                "msg": "Kindly Verify Your Email!"
            },
        )

        return Response({"status": "success", "msg": "Shortly you will receive the verification email - Kindly verfy it!", "data": UserSerializer(user).data},status=201)


class EmailAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = (request.query_params.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"status": "error", "message": "Email is required", "exists": False},
                status=400,
            )

        exists = CustomUser.objects.filter(email=email).exists()
        return Response(
            {
                "status": "success",
                "message": "Email already exists." if exists else "Email is available.",
                "exists": exists,
            },
            status=200,
        )



@api_view(["GET"])
def VerificationEmail(request):
    try:
        user_uid = request.query_params.get('uid')
        custom = get_object_or_404(CustomUser,uid= user_uid)
        if custom.is_staff: 
            return Response({"status":"success","message":"Your email already Verifed!","result":{"verified":custom.is_staff,"first_name":custom.first_name,"last_name":custom.last_name,"status":True}},status=200)
        custom.is_staff = True
        custom.save()
        superadmin_emails = list(
            CustomUser.objects.filter(
                user_roles__role__name="superadmin", is_active=True
            ).values_list("email", flat=True)
        )
        if not superadmin_emails:
            superadmin_emails = [configSettings.ADMIN_ALERT_EMAIL]
        for admin_email in superadmin_emails:
            send_activation_admin_email_safe(admin_email,
                {
                    "subject": "New User Registration - Action Required",
                    "first_name": custom.first_name,
                    "last_name": custom.last_name,
                    "email": custom.email,
                    "activation_link": f"{configSettings.FRONTEND_URL}/activate/{custom.active_uuid}",
                    "msg": "A new user has verified their email and is awaiting activation."
                })
        
        # configSettings.ADMIN_ALERT_EMAIL
        send_activation_user_email_safe(custom.email,
            {
                "subject": "Verified Email From BioPathogenix",
                "first_name": custom.first_name,
                "last_name": custom.last_name,
                "email": custom.email,
                "msg": "Kindly Verify Your Email!"
            })
        return Response({"status":"success","message":"Your email got verified!","result":{"verified":custom.is_staff,"first_name":custom.first_name,"last_name":custom.last_name,"status":False}},status=200)
    except Exception as exc:
        return Response({"status":"error", "message": "Data Not Found"}, status=404)
    




@api_view(["GET"])
def ActivationEmail(request):
    try:
        if not request.user.id:
            return Response({"status":"error", "message": "Data Not Found"}, status=400)

        admin = get_object_or_404(CustomUser,id=request.user.id)
        is_superadmin = admin.is_superuser or admin.user_roles.filter(role__name="superadmin").exists()
        if not is_superadmin:
            return Response({"status":"error", "message": "Only superadmin can activate users"}, status=403)

        user_uid = request.query_params.get('uid')
        if not user_uid:
            return Response({"status":"error", "message": "Activation uid is required"}, status=400)

        custom = get_or_none(CustomUser, active_uuid=user_uid)
        if not custom:
            return Response({"status":"error", "message": "Data Not Found"}, status=404)
        if custom.is_active:
            return Response({"status":"success","message":"User Already Activate!","result":{"is_active":custom.is_active,"first_name":custom.first_name,"last_name":custom.last_name,"status":True}},status=200)

        generated_password = get_random_string(12)
        custom.is_active = True
        custom.set_password(generated_password)
        custom.save(update_fields=["is_active", "password"])

        send_welcome_email_safe(custom.email,{
                "subject": "Welcome To BioPathogenix",
                "first_name": custom.first_name,
                "last_name": custom.last_name,
                "email": custom.email,
                "password": generated_password,
                "msg": "Your account has been activated. Use the credentials below to log in."
            })

        return Response({"status":"success","message":"User Activated!","result":{"is_active":custom.is_active,"first_name":custom.first_name,"last_name":custom.last_name,"status":False}},status=200)
    except Exception as exc:
        return Response({"status":"error", "message": "Data Not Found"}, status=400)
    

 


# -------------------------
# Login
# -------------------------
class LoginCustomer(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response({"msg": "Email and password required"}, status=400)

        try:
            user = CustomUser.objects.get(email=email.lower())
        except CustomUser.DoesNotExist:
            return Response({"msg": "Invalid email"}, status=404)

        if not user.is_active:
            return Response({"msg": "You are not active user, please connect with admin"}, status=403)

        password_matches = user.check_password(password)
        if not password_matches and user.password == password:
            user.set_password(password)
            user.save(update_fields=["password"])
            password_matches = True

        if not password_matches:
            return Response({"msg": "Invalid password"}, status=401)
        
        refresh = RefreshToken.for_user(user)
        roles = list(user.role.values_list('name', flat=True))
        refresh['roles'] = roles
        refresh['email'] = user.email
        refresh['first_name'] = user.first_name
        refresh['last_name'] = user.last_name


        return Response(
            {
                "status": "success",
                "msg": f"{user.first_name} has loggged-in successfully",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            },
            status=200,
        )

# class CustomerManageViews(APIView):
#     authentication_classes = [JWTAuthentication]
#     permission_classes = [IsAuthenticated]


#     def get(self, request, id=None):
#         current_user = request.user

#         if id:
#             user = get_object_or_404(UserProfile, id=id)
#             return Response({"data": UserSerializer(user).data}, status=200)

#         page = request.query_params.get("page", 1)
#         size = request.query_params.get("page_size", 50)

#         if current_user.role == ROLE_SUPERADMIN:
#             users = UserProfile.objects.all()
#         else:
#             users = UserProfile.objects.filter(
#                 Q(created_by_superadmin=current_user) | Q(created_by_manager=current_user)
#             )

#         return Response({"data": UserListSerializer(users, many=True).data}, status=200)


#     def patch(self, request, id):
#         obj = get_object_or_404(UserProfile, id=id)
#         serializer = UserSerializer(obj, data=request.data, partial=True)
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(serializer.data)

#     def delete(self, request, id):
#         obj = get_object_or_404(UserProfile, id=id)
#         obj.delete()
#         return Response({"msg": "User deleted"})


# -------------------------
# OTP endpoints
# -------------------------
class OTPView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email is required"}, status=400)
        ok, msg = send_otp(email)
        if not ok:
            return Response({"error": msg}, status=429)
        return Response({"message": msg}, status=200)


class VerifyOTP(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")
        if not email or not otp:
            return Response({"error": "Email and OTP required"}, status=400)
        ok, msg = verify_otp(email, otp)
        if not ok:
            return Response({"error": msg}, status=400)
        return Response({"message": msg}, status=200)


# -------------------------
# Forgot password (via OTP)
# -------------------------
class ForgotPasswordAPIView(APIView):
    permission_classes = [AllowAny]


   
    COOLDOWN_SECONDS = 60  # 1 minute buffer

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")
        otp = request.data.get("otp")

        if not all([email, password, confirm_password, otp]):
            return Response(
                {"error": "All fields are required: email, password, confirm_password, otp"}, status=400
            )

        # Cooldown check
        cooldown_key = f"reset_pw_cooldown_{email.lower()}"
        last_reset = cache.get(cooldown_key)
        now = time.time()
        if last_reset and now - last_reset < self.COOLDOWN_SECONDS:
            return Response({"error": f"Please wait {int(self.COOLDOWN_SECONDS - (now - last_reset))} seconds before trying again."}, status=429)
        cache.set(cooldown_key, now, timeout=self.COOLDOWN_SECONDS)

        if password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)

        ok, msg = verify_otp(email, otp)
        if not ok:
            return Response({"error": msg}, status=400)

        try:
            user = CustomUser.objects.get(email=email.lower())
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        user.set_password(password)
        user.save(update_fields=["password"])
        send_password_changed_email_safe(user)
        return Response({"message": "Password reset successful"}, status=200)


class ChangePasswordAPIView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([current_password, new_password, confirm_password]):
            return Response(
                {"error": "Current password, new password, and confirm password are required"},
                status=400,
            )

        if new_password != confirm_password:
            return Response({"error": "Passwords do not match"}, status=400)

        user = request.user
        if not user.check_password(current_password):
            return Response({"error": "Current password is incorrect"}, status=400)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        send_password_changed_email_safe(user)

        return Response({"message": "Password changed successfully"}, status=200)
