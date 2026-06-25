import requests
from django.conf import settings
from config.settings import configSettings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

import requests
import logging
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class UPSService:

    VERSION = "v2205"
    BASE_URL = settings.UPS_BASE_URL

    # ─── Auth ────────────────────────────────────────────────────────────────

    def _get_access_token(self):
        token = cache.get("ups_access_token")
        if token:
            return token

        response = requests.post(
            f"{self.BASE_URL}/security/v1/oauth/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "client_credentials"},
            auth=(settings.UPS_CLIENT_ID, settings.UPS_CLIENT_SECRET),
            timeout=10,
        )

        if response.status_code != 200:
            logger.error(f"UPS auth failed: {response.status_code} {response.text}")
            raise Exception("Failed to authenticate with UPS")

        data = response.json()
        token = data["access_token"]
        expires_in = int(data.get("expires_in", 14400)) - 60
        cache.set("ups_access_token", token, timeout=expires_in)
        return token

    def _headers(self):
        """
        Matches the headers from the UPS sample code exactly.
        transId and transactionSrc are optional but recommended
        for debugging in the UPS developer portal.
        """
        return {
            "Content-Type": "application/json",
            "transId": "ecommerce-rating",
            "transactionSrc": "testing",        # change to "production" when live
            "Authorization": f"Bearer {self._get_access_token()}",
        }

    # ─── Rating ──────────────────────────────────────────────────────────────

    def get_rates(self, recipient_address, package):
        """
        recipient_address: {
            name, address_line, city, state_code, postal_code
        }
        package: {
            weight_lb, length_in, width_in, height_in
        }
        """

        url = f"{self.BASE_URL}/api/rating/{self.VERSION}/Shop"

        # Based directly on UPS sample payload structure
        payload = {
            "RateRequest": {
                "Request": {
                    "TransactionReference": {
                        "CustomerContext": "shop-all-services"
                    }
                },
                "Shipment": {
                    "Shipper": {
                        "Name": settings.UPS_SHIPPER_NAME,
                        "ShipperNumber": settings.UPS_ACCOUNT_NUMBER,
                        "Address": {
                            "AddressLine": [settings.UPS_SHIPPER_ADDRESS_LINE],
                            "City": settings.UPS_SHIPPER_CITY,
                            "StateProvinceCode": settings.UPS_SHIPPER_STATE,
                            "PostalCode": settings.UPS_SHIPPER_ZIP,
                            "CountryCode": "US",
                        },
                    },
                    "ShipTo": {
                        "Name": recipient_address["name"],
                        "Address": {
                            "AddressLine": [recipient_address["address_line"]],
                            "City": recipient_address["city"],
                            "StateProvinceCode": recipient_address["state_code"],
                            "PostalCode": recipient_address["postal_code"],
                            "CountryCode": "US",
                        },
                    },
                    "ShipFrom": {
                        "Name": settings.UPS_SHIPPER_NAME,
                        "Address": {
                            "AddressLine": [settings.UPS_SHIPPER_ADDRESS_LINE],
                            "City": settings.UPS_SHIPPER_CITY,
                            "StateProvinceCode": settings.UPS_SHIPPER_STATE,
                            "PostalCode": settings.UPS_SHIPPER_ZIP,
                            "CountryCode": "US",
                        },
                    },
                    "PaymentDetails": {
                        "ShipmentCharge": [
                            {
                                "Type": "01",           # 01 = transportation charges
                                "BillShipper": {
                                    "AccountNumber": settings.UPS_ACCOUNT_NUMBER,
                                },
                            }
                        ]
                    },
                    "NumOfPieces": "1",
                    "Package": {
                        "PackagingType": {
                            "Code": "02",               # 02 = customer supplied package
                            "Description": "Packaging",
                        },
                        "Dimensions": {
                            "UnitOfMeasurement": {
                                "Code": "IN",
                                "Description": "Inches",
                            },
                            "Length": str(package["length_in"]),
                            "Width": str(package["width_in"]),
                            "Height": str(package["height_in"]),
                        },
                        "PackageWeight": {
                            "UnitOfMeasurement": {
                                "Code": "LBS",
                                "Description": "Pounds",
                            },
                            "Weight": str(package["weight_lb"]),
                        },
                    },
                },
            }
        }

        # additionalinfo query param from UPS sample
        query = {"additionalinfo": "timeintransit"}

        response = requests.post(
            url,
            json=payload,
            headers=self._headers(),
            params=query,
            timeout=10,
        )

        if response.status_code != 200:
            logger.error(f"UPS rating failed: {response.status_code} {response.text}")
            raise Exception(f"UPS rating error: {response.text}")

        data = response.json()
        rated_shipments = data["RateResponse"]["RatedShipment"]

        service_names = {
            "01": "UPS Next Day Air",
            "02": "UPS 2nd Day Air",
            "03": "UPS Ground",
            "12": "UPS 3 Day Select",
        }

        results = []
        for shipment in rated_shipments:
            code = shipment["Service"]["Code"]
            name = service_names.get(code)
            if not name:
                continue
            results.append({
                "service_code": code,
                "service_name": name,
                "currency": shipment["TotalCharges"]["CurrencyCode"],
                "total_charge": shipment["TotalCharges"]["MonetaryValue"],
                "billing_weight": shipment["BillingWeight"]["Weight"],
                "billing_weight_unit": shipment["BillingWeight"]["UnitOfMeasurement"]["Code"],
            })

        results.sort(key=lambda x: float(x["total_charge"]))
        return results

    # ─── Tracking ────────────────────────────────────────────────────────────

    def track_shipment(self, tracking_number):
        url = f"{self.BASE_URL}/api/track/v1/details/{tracking_number}"

        response = requests.get(
            url,
            headers=self._headers(),
            params={"locale": "en_US", "returnSignature": "false"},
            timeout=10,
        )

        if response.status_code == 404:
            raise Exception("Tracking number not found")

        if response.status_code != 200:
            logger.error(f"UPS tracking failed: {response.status_code} {response.text}")
            raise Exception(f"UPS tracking error: {response.text}")

        data = response.json()
        shipment = data["trackResponse"]["shipment"][0]
        package = shipment["package"][0]
        activity = package.get("activity", [])

        return {
            "tracking_number": tracking_number,
            "status": package.get("currentStatus", {}).get("description", "Unknown"),
            "status_code": package.get("currentStatus", {}).get("code", ""),
            "scheduled_delivery": package.get("deliveryDate", [{}])[0].get("date"),
            "activity": [
                {
                    "date": a.get("date"),
                    "time": a.get("time"),
                    "location": a.get("location", {}).get("address", {}).get("city", ""),
                    "description": a.get("status", {}).get("description", ""),
                }
                for a in activity[:5]
            ],
        }
    
    
class UPSService:
    BASE_URL = configSettings.UPS_BASE_URL

    def _get_access_token(self):
        """OAuth2 token with caching."""
        token = cache.get("ups_access_token")
        if token:
            return token

        response = requests.post(
            f"{self.BASE_URL}/security/v1/oauth/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "client_credentials"},
            auth=(configSettings.UPS_CLIENT_ID, configSettings.UPS_CLIENT_SECRET),
        )
        response.raise_for_status()
        data = response.json()
        token = data["access_token"]
        expires_in = int(data.get("expires_in", 14400)) - 60  # buffer
        cache.set("ups_access_token", token, timeout=expires_in)
        return token

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._get_access_token()}",
            "Content-Type": "application/json",
        }

    def get_rates(self, shipper_address, recipient_address, package):
        """
        shipper_address / recipient_address: dict with keys: name, address_line, city, state_code, postal_code, country_code
        package: dict with keys: weight_kg, length_cm, width_cm, height_cm
        """
        
        payload = {
            "RateRequest": {
                "Request": {"TransactionReference": {"CustomerContext": "rate-request"}},
                "Shipment": {
                    "Shipper": {
                        "Name": shipper_address["name"],
                        "ShipperNumber": settings.UPS_ACCOUNT_NUMBER,
                        "Address": {
                            "AddressLine": [shipper_address["address_line"]],
                            "City": shipper_address["city"],
                            "StateProvinceCode": shipper_address["state_code"],
                            "PostalCode": shipper_address["postal_code"],
                            "CountryCode": shipper_address["country_code"],
                        },
                    },
                    "ShipTo": {
                        "Name": recipient_address["name"],
                        "Address": {
                            "AddressLine": [recipient_address["address_line"]],
                            "City": recipient_address["city"],
                            "StateProvinceCode": recipient_address["state_code"],
                            "PostalCode": recipient_address["postal_code"],
                            "CountryCode": recipient_address["country_code"],
                        },
                    },
                    "ShipFrom": {
                        "Name": shipper_address["name"],
                        "Address": {
                            "AddressLine": [shipper_address["address_line"]],
                            "City": shipper_address["city"],
                            "StateProvinceCode": shipper_address["state_code"],
                            "PostalCode": shipper_address["postal_code"],
                            "CountryCode": shipper_address["country_code"],
                        },
                    },
                    "Service": {"Code": "03"},  # UPS Ground; use "02" for 2-Day Air
                    "NumOfPieces": "1",
                    "Package": {
                        "PackagingType": {"Code": "02"},  # Customer supplied package
                        "Dimensions": {
                            "UnitOfMeasurement": {"Code": "IN"},
                            "Length": str(package["length_in"]),
                            "Width": str(package["width_in"]),
                            "Height": str(package["height_in"]),
                        },
                        "PackageWeight": {
                            "UnitOfMeasurement": {"Code": "LBS"},
                            "Weight": str(package["weight_lb"]),
                        },
                    },
                },
            }
        }

        response = requests.post(
            f"{self.BASE_URL}/api/rating/v2205/Rate",
            headers=self._headers(),
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

        print("Shipping data ===>",data)

        rated_shipment = data["RateResponse"]["RatedShipment"]
        print("rated_shipment data ===>",rated_shipment)

        return {
            "service_code": rated_shipment["Service"]["Code"],
            "currency": rated_shipment["TotalCharges"]["CurrencyCode"],
            "total_charge": rated_shipment["TotalCharges"]["MonetaryValue"],
            "billing_weight": rated_shipment["BillingWeight"]["Weight"],
        }

    def track_shipment(self, tracking_number):
        response = requests.get(
            f"{self.BASE_URL}/api/track/v1/details/{tracking_number}",
            headers=self._headers(),
            params={"locale": "en_US", "returnSignature": "false"},
        )
        response.raise_for_status()
        data = response.json()

        shipment = data["trackResponse"]["shipment"][0]
        package = shipment["package"][0]
        activity = package.get("activity", [])

        return {
            "tracking_number": tracking_number,
            "status": package.get("currentStatus", {}).get("description", "Unknown"),
            "scheduled_delivery": package.get("deliveryDate", [{}])[0].get("date"),
            "activity": [
                {
                    "date": a.get("date"),
                    "time": a.get("time"),
                    "location": a.get("location", {}).get("address", {}).get("city", ""),
                    "description": a.get("status", {}).get("description", ""),
                }
                for a in activity[:5]  # latest 5 events
            ],
        }