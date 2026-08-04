from django.core.management.base import BaseCommand

from country.models import Country, State

US_STATES = [
    ("Alabama", "AL"), ("Alaska", "AK"), ("Arizona", "AZ"), ("Arkansas", "AR"),
    ("California", "CA"), ("Colorado", "CO"), ("Connecticut", "CT"), ("Delaware", "DE"),
    ("District of Columbia", "DC"), ("Florida", "FL"), ("Georgia", "GA"), ("Hawaii", "HI"),
    ("Idaho", "ID"), ("Illinois", "IL"), ("Indiana", "IN"), ("Iowa", "IA"),
    ("Kansas", "KS"), ("Kentucky", "KY"), ("Louisiana", "LA"), ("Maine", "ME"),
    ("Maryland", "MD"), ("Massachusetts", "MA"), ("Michigan", "MI"), ("Minnesota", "MN"),
    ("Mississippi", "MS"), ("Missouri", "MO"), ("Montana", "MT"), ("Nebraska", "NE"),
    ("Nevada", "NV"), ("New Hampshire", "NH"), ("New Jersey", "NJ"), ("New Mexico", "NM"),
    ("New York", "NY"), ("North Carolina", "NC"), ("North Dakota", "ND"), ("Ohio", "OH"),
    ("Oklahoma", "OK"), ("Oregon", "OR"), ("Pennsylvania", "PA"), ("Rhode Island", "RI"),
    ("South Carolina", "SC"), ("South Dakota", "SD"), ("Tennessee", "TN"), ("Texas", "TX"),
    ("Utah", "UT"), ("Vermont", "VT"), ("Virginia", "VA"), ("Washington", "WA"),
    ("West Virginia", "WV"), ("Wisconsin", "WI"), ("Wyoming", "WY"),
]


class Command(BaseCommand):
    help = "Seeds all 50 US states (+ DC) into country_state, active, under the US country row."

    def handle(self, *args, **options):
        us = (
            Country.objects.filter(code__iexact="US").first()
            or Country.objects.filter(name__icontains="united states").first()
        )
        if us is None:
            us = Country.objects.create(name="United States of America", code="US", status=True)
            self.stdout.write(f"Created Country: {us.name} (id={us.id})")
        else:
            if not us.status:
                us.status = True
                us.save(update_fields=["status"])
            self.stdout.write(f"Using existing Country: {us.name} (id={us.id})")

        created, updated, unchanged = 0, 0, 0

        for name, code in US_STATES:
            existing = State.objects.filter(country=us, code__iexact=code).first()
            if existing:
                changed_fields = []
                if existing.name != name:
                    existing.name = name
                    changed_fields.append("name")
                if not existing.status:
                    existing.status = True
                    changed_fields.append("status")
                if changed_fields:
                    existing.save(update_fields=changed_fields)
                    updated += 1
                else:
                    unchanged += 1
                continue

            State.objects.create(name=name, code=code, country=us, status=True)
            created += 1

        self.stdout.write(f"States — created: {created}, updated: {updated}, already correct: {unchanged}")
        self.stdout.write(f"Total active US states now: {State.objects.filter(country=us, status=True).count()}")
