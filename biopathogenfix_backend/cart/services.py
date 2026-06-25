import requests
from django.conf import settings
from config.settings import configSettings
from django.core.cache import cache
import logging
from payments.models import UPSConfig
import base64
from django.core.files.base import ContentFile
from django.utils import timezone
from decimal import Decimal

logger = logging.getLogger(__name__)



class UPSService:

    VERSION = "v2205"
    def __init__(self):
        self.BASE_URL = configSettings.UPS_BASE_URL or ""

    @property
    def is_sandbox(self):
        return "wwwcie" in self.BASE_URL

    @property
    def account_number(self):
        return " " if self.is_sandbox else configSettings.UPS_ACCOUNT_NUMBER

    def _get_ups_config(self):
        upsconfig = UPSConfig.objects.first()
        if not upsconfig:
            raise Exception("UPS shipper configuration is missing. Please add UPS settings in Django admin.")
        return upsconfig

    def _get_shipper_number(self, upsconfig):
        configured_account = (upsconfig.account_num or configSettings.UPS_ACCOUNT_NUMBER or "").strip()
        if configured_account:
            return configured_account
        return self.account_number
    

    # Auth 
    def _get_access_token(self):
        token = cache.get("ups_access_token")
        if token:
            return token

        if not self.BASE_URL or not configSettings.UPS_CLIENT_ID or not configSettings.UPS_CLIENT_SECRET:
            raise Exception("UPS credentials are incomplete. Check UPS_BASE_URL, UPS_CLIENT_ID, and UPS_CLIENT_SECRET.")

        response = requests.post(
            f"{self.BASE_URL}/security/v1/oauth/token",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "client_credentials"},
            auth=(configSettings.UPS_CLIENT_ID, configSettings.UPS_CLIENT_SECRET),
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
        return {
            "Content-Type": "application/json",
            "transId": "ecommerce-rating",
            "transactionSrc": "testing",        # change to "production" when live
            "Authorization": f"Bearer {self._get_access_token()}",
        }

    # Rating 
    def get_rates(self, recipient_address, package):
        upsconfig = self._get_ups_config()
        shipper_number = self._get_shipper_number(upsconfig)


        url = f"{self.BASE_URL}/api/rating/{self.VERSION}/Shop"

        # "PaymentDetails": {
        #     "ShipmentCharge": [
        #         {
        #             "Type": "01",           # 01 = transportation charges
        #             "BillShipper": {
        #                 "AccountNumber": configSettings.UPS_ACCOUNT_NUMBER,
        #             },
        #         }
        #     ]
        # },



        payload = {
            "RateRequest": {
                "Request": {
                    "TransactionReference": {
                        "CustomerContext": "shop-all-services"
                    }
                },
                "Shipment": {
                    "Shipper": {
                        "Name": upsconfig.name,
                        "ShipperNumber": shipper_number,
                        "Address": {
                            "AddressLine": [upsconfig.street],
                            "City": upsconfig.city,
                            "StateProvinceCode": upsconfig.state,
                            "PostalCode": upsconfig.zip,
                            "CountryCode": upsconfig.country,
                        },
                    },
                    "ShipTo": {
                        "Name": recipient_address["first_name"],
                        "Address": {
                            "AddressLine": [recipient_address["address_line1"]],
                            "City": recipient_address["city"],
                            "StateProvinceCode": recipient_address["state_code"],
                            "PostalCode": recipient_address["postal_code"],
                            "CountryCode": recipient_address["country_code"],
                        },
                    },
                    "ShipFrom": {
                        "Name": upsconfig.name,
                        "Address": {
                            "AddressLine": [upsconfig.street],
                            "City": upsconfig.city,
                            "StateProvinceCode": upsconfig.state,
                            "PostalCode": upsconfig.zip,
                            "CountryCode": upsconfig.country,
                        },
                    },
                    "Service": {"Code": "03"},
                    "NumOfPieces": str(package["totalCartItems"]),
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
        # query = {"additionalinfo": "timeintransit"}
        # params=query,

        response = requests.post(
            url,
            json=payload,
            headers=self._headers(),
            timeout=10,
        )

        print("response.text===>",response.text,response.status_code)

        if response.status_code != 200:
            logger.error(f"UPS rating failed: {response.status_code} {response.text}")
            raise Exception(f"UPS rating error ===>: {response.text}")

        data = response.json()
        rated_shipments = data["RateResponse"]["RatedShipment"]


        # service_names = {
        #     "01": "UPS Next Day Air",
        #     "02": "UPS 2nd Day Air",
        #     "03": "UPS Ground",
        #     "12": "UPS 3 Day Select",
        # }

        service_names = {
            "03": "UPS Ground",
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
        
    def create_shipment(self, order,package):
        """
        Creates a UPS shipment after payment is confirmed.
        Accepts an Order model instance.
        Returns dict with tracking_number, shipment_id, label (base64).
        """
        try:
            url = f"{self.BASE_URL}/api/shipments/{self.VERSION}/ship"

            ship_to_name = f"{order.shipping_first_name} {order.shipping_last_name}".strip()
            address_line = order.shipping_address_line1
            if order.shipping_address_line2:
                address_line += f", {order.shipping_address_line2}"

            phone = order.shipping_phone.strip().replace("-", "").replace(" ", "")
            if len(phone) < 10:
                phone = "0000000000"

            upsconfig = self._get_ups_config()
            shipper_number = self._get_shipper_number(upsconfig)

            
            


            length_in = self._normalize_package_value(package.get("length_in"))
            width_in = self._normalize_package_value(package.get("width_in"))
            height_in = self._normalize_package_value(package.get("height_in"))
            weight_lb = self._normalize_package_value(package.get("weight_lb"), fallback="0.10")

            if Decimal(weight_lb) <= 0:
                weight_lb = "0.10"

            shipment = {
                "Description": "E-commerce Order",
                "Shipper": {
                    "Name": upsconfig.name,
                    "AttentionName": upsconfig.name,
                    "Phone": {
                        "Number": '1425845698',
                        "Extension": " "
                    },
                    "ShipperNumber": shipper_number,
                    "Address": {
                        "AddressLine": [upsconfig.street],
                        "City": upsconfig.city,
                        "StateProvinceCode": upsconfig.state,
                        "PostalCode": upsconfig.zip,
                        "CountryCode": upsconfig.country,
                    },
                },
                "ShipTo": {
                    "Name": ship_to_name,
                    "AttentionName": ship_to_name,
                    "Phone": {"Number": phone},
                    "Address": {
                        "AddressLine": [address_line],
                        "City": order.shipping_city,
                        "StateProvinceCode": (order.shipping_state_code),
                        "PostalCode": order.shipping_postal_code,
                        "CountryCode": "US",
                    },
                    "Residential": " ",
                },
                "ShipFrom": {
                    "Name": upsconfig.name,
                    "AttentionName": upsconfig.name,
                    "Phone": {"Number": '1425845698'},
                    "Address": {
                        "AddressLine": [upsconfig.street],
                        "City": upsconfig.city,
                        "StateProvinceCode": upsconfig.state,
                        "PostalCode": upsconfig.zip,
                        "CountryCode": upsconfig.country,
                    },
                },
                "Service": {
                    "Code":  "03",
                    "Description":  "UPS Ground",
                },
                "Package": {
                    "Description": "E-commerce Order",
                    "Packaging": {
                        "Code": "02",
                        "Description": "Customer Supplied Package",
                    },
                    "Dimensions": {
                        "UnitOfMeasurement": {"Code": "IN", "Description": "Inches"},
                        "Length": length_in,
                        "Width": width_in,
                        "Height": height_in
                    },
                    "PackageWeight": {
                        "UnitOfMeasurement": {"Code": "LBS", "Description": "Pounds"},
                        "Weight": weight_lb
                    },
                },
            }

            # Step 2 — only add PaymentInformation in production
            # if not self.is_sandbox:
            shipment["PaymentInformation"] = {
                "ShipmentCharge": {
                    "Type": "01",
                    "BillShipper": {
                        "AccountNumber": shipper_number,
                    },
                }
            }

            # Step 3 — wrap in final payload
            payload = {
                "ShipmentRequest": {
                    "Request": {
                        "SubVersion": "1801",
                        "RequestOption": "nonvalidate",
                        "TransactionReference": {
                            "CustomerContext": f"order-{order.transaction_id}"
                        }
                    },
                    "Shipment": shipment,        # <-- shipment dict goes here
                    "LabelSpecification": {
                        "LabelImageFormat": {"Code": "GIF", "Description": "GIF"},
                        "HTTPUserAgent": "Mozilla/4.5",
                    },
                }
            }
            # query = {"additionaladdressvalidation": "string"}
            print("url",url)
            print("ShipperNumber:", shipment["Shipper"]["ShipperNumber"])
            print("PaymentInformation present:", "PaymentInformation" in shipment)

            import json
            print(json.dumps(payload, indent=2))

            response = requests.post(
                url,
                json=payload,
                headers=self._headers(),
                # params=query,
                timeout=15,
            )

            if response.status_code != 200:
                logger.error(f"UPS shipment creation failed: {response.status_code} {response.text}")
                raise Exception(f"UPS shipment error: {response.text}")

            data = response.json()
            return True, data
        except Exception as e:
            logger.exception("Error creating UPS shipment")
            return False, str(e)
            
    def call_ups_return_api(self,order,package):
        """
        Call UPS Shipping API to create a NEW return shipment.
        ShipFrom = customer, ShipTo = your warehouse.
        """
        try:
            url     = f"{self.BASE_URL}/api/shipments/{self.VERSION}/ship"

            upsconfig = self._get_ups_config()
            shipper_number = self._get_shipper_number(upsconfig)
            ship_to_name = f"{order.shipping_first_name} {order.shipping_last_name}".strip()
            address_line = order.shipping_address_line1
            if order.shipping_address_line2:
                address_line += f", {order.shipping_address_line2}"

            




            payload = {
                "ShipmentRequest": {
                    "Request": {
                        "SubVersion":           "1801",
                        "RequestAction":        "ShipConfirm",
                        "RequestOption":        "validate",
                        "TransactionReference": {
                            "CustomerContext": f"Return for Order #{order.id}"
                        }
                    },
                    "Shipment": {

                        #  Service
                        "Service": {
                            "Code":        "03",
                            "Description": "UPS Ground"
                        },

                        # Return service type
                        # Code 9 = Print Return Label (admin prints + mails to customer)
                        # Code 5 = Electronic Return Label (UPS emails customer directly)
                        "ReturnService": {
                            "Code": "9"
                        },

                        #  Shipper = your company
                        "Shipper": {
                            "Name": upsconfig.name,
                            "ShipperNumber": shipper_number,
                            "Address": {
                                "AddressLine": [upsconfig.street],
                                "City": upsconfig.city,
                                "StateProvinceCode": upsconfig.state,
                                "PostalCode": upsconfig.zip,
                                "CountryCode": upsconfig.country,
                            }
                        },

                        # Ship To = your warehouse 
                        "ShipTo": {
                            "Name":    ship_to_name,
                            "Address": {
                                "AddressLine": [address_line],
                                "City": order.shipping_city,
                                "StateProvinceCode": (order.shipping_state_code),
                                "PostalCode": order.shipping_postal_code,
                                "CountryCode": "US",
                            }
                        },

                        #  Ship From = customer address 
                        "ShipFrom": {
                            "Name": upsconfig.name,
                            "Address": {
                                "AddressLine": [upsconfig.street],
                                "City": upsconfig.city,
                                "StateProvinceCode": upsconfig.state,
                                "PostalCode": upsconfig.zip,
                                "CountryCode": upsconfig.country,
                            }
                        },

                        # Package 
                        "Package": {
                            "Packaging": {
                                "Code":        "02",
                                "Description": "Customer Supplied Package"
                            },
                            "PackageWeight": {
                                "UnitOfMeasurement": {"Code": "LBS"},
                                "Weight":  str(package['weight_lb'])
                            },

                            "Dimensions": {
                                "UnitOfMeasurement": {
                                    "Code":        "IN",
                                    "Description": "Inches"
                                },
                                "Length": str(package['length_in']),
                                "Width":  str(package['width_in']),
                                "Height":  str(package['height_in'])
                            },

                            "Description": f"Return items for Order #{order.id}",
                        },

                        # billing option
                        "PaymentInformation": {
                            "ShipmentCharge": {
                                "Type": "01",           # 01 = Transportation
                                "BillShipper": {
                                    "AccountNumber": shipper_number
                                }
                            }
                        },

                    },

                    # Label format 
                    "LabelSpecification": {
                        "HTTPUserAgent": "Mozilla/4.5",
                        "LabelImageFormat": {
                            "Code":        "GIF",
                            "Description": "GIF"
                        },
                        "LabelStockSize": {
                            "Height":  str(package['height_in']),
                            "Width":  str(package['width_in'])
                        }
                    }
                }
            }

            response = requests.post(url, json=payload, headers=self._headers(), timeout=15)
            if response.status_code != 200:
                    logger.error(f"UPS shipment creation failed: {response.status_code} {response.text}")
                    raise Exception(f"UPS shipment error: {response.text}")
            return True, response.json()
        
        except Exception as e:
            logger.exception("Error creating UPS shipment")
            return False, str(e)

    def _normalize_package_value(self, value, fallback="0.00"):
        if value is None:
            return fallback

        normalized = str(value).strip()
        if not normalized:
            return fallback

        try:
            amount = Decimal(normalized)
        except Exception:
            return fallback

        if amount < 0:
            return fallback

        return f"{amount:.2f}"


    # Tracking 
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
    
