# Step for Setup project

1. clone the project 
2. go to the folder
3. switch to the specific branch by default branch is `main`
3. run `npm i` command (for install all the packages)
4. run `npm run dev` (for start the project)

## UPS tracking automation
1. Add your UPS OAuth credentials to the backend `.env`:
   ```
   UPS_CLIENT_ID=<your ups client id>
   UPS_CLIENT_SECRET=<your ups client secret>
   UPS_ENVIRONMENT=sandbox
   ```
   The backend uses these values to fetch a bearer token from the UPS token service and never exposes them to the browser.
2. Whenever a shipped order has a UPS tracking number, run the sync job to refresh the status and notify the customer:
   ```powershell
   cd biopathogenfix_backend
   .\venv\Scripts\python.exe manage.py sync_ups_tracking
   ```
   Schedule that command with Task Scheduler, Celery beat, or a cron so it runs regularly.
3. Verify by creating an order with a UPS tracking number in the sandbox environment, running the command, and checking that the `status_updates` list and the notification email reflect the latest UPS event.

## UPS rating-based shipping fees
1. Add the UPS shipper details to `.env` (all values default for our fulfillment center):
   ```
   UPS_SHIPPER_NAME="BioPathogenix Fulfillment Center"
   UPS_SHIPPER_ADDRESS_LINE1="123 BioPathogenix Parkway"
   UPS_SHIPPER_CITY="Lexington"
   UPS_SHIPPER_STATE="KY"
   UPS_SHIPPER_POSTAL_CODE="40511"
   UPS_SHIPPER_COUNTRY="US"
   ```
2. Make sure each product has `weight`, `length`, `width`, and `height` in the catalog (cm/kg). The backend converts those to the UPS units, builds a single package around the selected cart items, and hits the UPS Rating API using the OAuth token derived from your `UPS_CLIENT_ID`/`UPS_CLIENT_SECRET`.
3. On checkout, the frontend already calls `/calculate-tax-shipping/`; with the new logic activated the `shipping_cost` field now reflects the UPS quote for the assembled package. If the UPS call fails for any reason we fall back to the previous fixed-rate calculation.
