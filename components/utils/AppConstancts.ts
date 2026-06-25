const QB_PUBLIC_KEY = "ABQ5uCdyD91WM27zEaFYyOLyrGGi9T8YoqzijVxK5iSgPUnRid";


const DECLINE_MESSAGES = {
  "PMT-4000": "Your card was declined. Please contact your bank.",
  "PMT-4001": "Insufficient funds. Please use a different card.",
  "PMT-4002": "Your card has expired. Please use a different card.",
  "PMT-4003": "Invalid card number. Please check and try again.",
  "PMT-4004": "This card type is not supported.",
  "PMT-4100": "Transaction limit exceeded. Please contact your bank.",
};


const TOKEN_ERROR_MESSAGES = {
  INVALID_CARD_NUMBER: "Card number is invalid. Please check and try again.",
  INVALID_EXPIRY:      "Card expiry date is invalid.",
  INVALID_CVV:         "CVV is invalid.",
  CARD_EXPIRED:        "Your card has expired. Please use a different card.",
};

const CART_ERR_MSG = 'Please choose all required product options before adding this item to the cart.'
const CART_STOCK_ERR_MSG = `Maximum available quantity is StockVal item(s). You cannot add more.` 
const CART_Quantity_ERR_MSG = `Quantity should not be zero or Empty` 
const CART_REMOVE_ITEM = `Selected item is out of stock. Unselect this item to proceed to checkout.` 
const CART_LOW_QUANTITY = `Selected quantity exceeds stock. Reduce to CurrentStockVal or unselect this item to proceed.` 


export {DECLINE_MESSAGES,TOKEN_ERROR_MESSAGES,QB_PUBLIC_KEY, CART_ERR_MSG,CART_STOCK_ERR_MSG,CART_Quantity_ERR_MSG,CART_REMOVE_ITEM,CART_LOW_QUANTITY}
