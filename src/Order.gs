/**
 * @fileoverview This file contains functions for creating, validating, and processing currency exchange orders in a Google Apps Script application.
 */

/**
 * Retrieves a string value from form inputs with a default fallback.
 * @param {Object} e - The event object.
 * @param {string} name - The name of the form input.
 * @param {string} def - The default value.
 * @return {string} The string value or default.
 */
function getString(e, name, def) {
  const fi = e.formInputs[name];
  if (!fi || !fi.stringInputs || !fi.stringInputs.value || !fi.stringInputs.value.length) {
    return def || '';
  }
  return fi.stringInputs.value[0];
}

/**
 * Generates a unique order number.
 * @return {string} The formatted order number.
 */
function generateOrderNumber() {
  const props = PropertiesService.getDocumentProperties();
  let lastNum = parseInt(props.getProperty('lastOrderNumber') || '0');
  lastNum += 1;
  return "ORDER-" + lastNum.toString().padStart(12, '0');
}

/**
 * Retrieves currency data from the spreadsheet.
 * @param {string} selectedCurrency - The currently selected currency.
 * @param {'buy'|'sell'} type - The type of transaction, either 'buy' or 'sell'.
 * @param {boolean} isVip - Whether the user is a VIP customer.
 * @returns {Object} An object with currency rates and selection status.
 * @throws {Error} If there is an issue accessing the spreadsheet.
 */
function getCurrencies(selectedCurrency, type='buy', isVip=false) {
  const defaultCurrencies = {};
  const columnMap = {
    'buy': {
      'true': 6,
      'false': 4
    },
    'sell': {
      'true': 7,
      'false': 5
    }
  }

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const rateSheet = spreadsheet.getSheetById(getConfig('RATE_SHEET_ID'));
    const cashFlowSheet = spreadsheet.getSheetById(getConfig('CAPITAL_SHEET_ID'));
    const cashAvailable = {};

    if(cashFlowSheet) {
      const data = cashFlowSheet.getDataRange().getValues();

      for(let i=1;  i < data.length; i++) {
        cashAvailable[data[i][2]] = parseInt(data[i][5] || '0');
      }
    }
    defaultCurrencies.capitalAvailable = cashAvailable['CZK'];

    if (rateSheet) {
      const data = rateSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const currency = data[i][2];

        if (currency === 'CZK' || ( /sell/i.test(type) && cashAvailable[currency] <= 0 )) continue;
        const rate = data[i][columnMap[type][isVip]] || 0;
        const rateAmount = data[i][3]?.toString() || "1";
        const flag = data[i][1];
        if (currency && currency.trim()) {
          defaultCurrencies[currency] = { 
            rate, 
            selected: false, 
            rateAmount, flag, 
            limit: cashAvailable[currency] 
          };
        }
      }
    }
  } catch (e) {
    // Error accessing spreadsheet
  }

  if (selectedCurrency && defaultCurrencies[selectedCurrency]) {
    defaultCurrencies[selectedCurrency].selected = true;
  }

  return defaultCurrencies;
}


/**
 * Creates the order card with form inputs.
 * @param {Object} preFilled - Pre-filled values for the form, including currency, amount, discount, vip, and note.
 * @param {'buy'|'sell'} type - The type of order, either 'buy' or 'sell'.
 * @returns {CardService.Card} The constructed card for the order form.
 */
function createOrderCard(preFilled = {}, type='buy') {
  const orderNumber = generateOrderNumber();
  const currencies = getCurrencies(preFilled.currency, type, preFilled.vip == 'vip');

  // Create form widgets
  const currencySelection = createCurrencySelection(currencies, type);
  const rateInput = createRateInput(currencies[preFilled.currency]?.rate);
  const amountInput = createAmountInput(preFilled.amount);
  const discountInput = createDiscountInput(preFilled.discount);
  const vipSelection = createVipSelection(preFilled.vip, type, preFilled.currency);
  const note = createNoteInput(preFilled.note);

  // Create buttons
  const rateAmount = currencies[preFilled.currency]?.rateAmount || getConfig('DEFAULT_RATE_AMOUNT');
  const limit = currencies[preFilled.currency]?.limit;
  const capitalAvailable = currencies.capitalAvailable;
  const submitButton = createReviewButton(orderNumber, type, rateAmount, limit, capitalAvailable);

  // Build section
  const section = CardService.newCardSection()
    .addWidget(currencySelection)
    .addWidget(rateInput)
    .addWidget(amountInput)
    .addWidget(discountInput)
    .addWidget(vipSelection)
    .addWidget(note);

  // Build footer
  const footer = CardService.newFixedFooter()
    .setPrimaryButton(submitButton)
    .setSecondaryButton(homeButton);

  // Build card
  return CardService.newCardBuilder()
    .setName(type)
    .setHeader(CardService.newCardHeader().setTitle(`💱 ${type[0].toUpperCase()}${type.slice(1)}`).setSubtitle(orderNumber))
    .addSection(section)
    .setFixedFooter(footer)
    .build();
}

/**
 * Creates the currency selection input.
 * @param {Object} currencies - An object containing currency data with rates and flags.
 * @param {'buy'|'sell'} type - The type of transaction to determine the action.
 * @returns {CardService.SelectionInput} The currency selection widget.
 */
function createCurrencySelection(currencies, type='buy') {
  const selection = CardService.newSelectionInput()
    .setFieldName('currency')
    .setTitle('Currency')
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('updateRate')
      .setParameters({'type': type}));

  Object.keys(currencies).forEach(key => {
    if(key == 'capitalAvailable') return;
    selection.addItem(`${currencies[key].flag} ${key} (${currencies[key].limit})`, key, currencies[key].selected);
  });

  return selection;
}

/**
 * Creates the rate input.
 * @param {number|string} value - The pre-filled rate value.
 * @returns {CardService.TextInput} The rate input widget with float validation.
 */
function createRateInput(value) {
  const validation = CardService.newValidation().setInputType(CardService.InputType.FLOAT);
  
  return CardService.newTextInput()
    .setFieldName('rate')
    .setTitle('Rate')
    .setValidation(validation)
    .setValue(value || '');
}

/**
 * Creates the amount input.
 * @param {number|string} value - The pre-filled amount value.
 * @returns {CardService.TextInput} The amount input widget.
 */
function createAmountInput(value) {
  return CardService.newTextInput()
    .setFieldName('amount')
    .setTitle('Amount')
    .setValue(value || '');
}

/**
 * Creates the discount input.
 * @param {number|string} value - The pre-filled discount percentage value.
 * @returns {CardService.TextInput} The discount input widget.
 */
function createDiscountInput(value) {
  return CardService.newTextInput()
    .setFieldName('discount')
    .setTitle('Discount %')
    .setValue(value || "");
}

/**
 * Creates the VIP selection input.
 * @param {string} value - The pre-filled VIP selection value.
 * @param {'buy'|'sell'} type - The type of transaction.
 * @param {string} selectedCurrency - The currently selected currency.
 * @returns {CardService.SelectionInput} The VIP selection widget.
 */
function createVipSelection(value, type, selectedCurrency) {
  const vipCard = CardService.newSelectionInput()
    .setFieldName('vip')
    .setType(CardService.SelectionInputType.CHECK_BOX)
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('updateRate')
      .setParameters({'type': type}));

  if(selectedCurrency) {
    vipCard.addItem('VIP', 'vip', value === 'vip')
  }

  return vipCard;
}

/**
 * Creates the note input.
 * @param {string} value - The pre-filled note text.
 * @returns {CardService.TextInput} The note input widget.
 */
function createNoteInput(value) {

  return CardService.newTextInput()
    .setFieldName('note')
    .setTitle('Note')
    .setValue(value || '');
}

/**
 * Creates the review button.
 * @param {string} orderNumber - The unique order number.
 * @param {'buy'|'sell'} type - The type of order.
 * @param {string} rateAmount - The amount for the rate.
 * @param {number} cashAvailable - The amount for the cash available.
 * @param {number} capitalAvailable - The amount for the capital available.
 * @returns {CardService.TextButton} The review button with action.
 */
function createReviewButton(orderNumber, type='buy', rateAmount="1", cashAvailable=0, capitalAvailable=0) {
  const icon = CardService.newMaterialIcon().setName('price_check');
  const action = CardService.newAction()
    .setFunctionName('reviewOrder')
    .addRequiredWidget('currency')
    .addRequiredWidget('amount')
    .addRequiredWidget('rate')
    .setParameters({
      "rateAmount": rateAmount.toString(),
      "capitalAvailable": capitalAvailable.toString(),
      "cashAvailable": cashAvailable.toString(),
      "type": type,
      "orderNumber": orderNumber
    });

  return CardService.newTextButton()
    .setText('Review')
    .setMaterialIcon(icon)
    .setOnClickAction(action);
}



/**
 * Processes the order form submission and navigates to the review card.
 * @param {Object} e - The event object containing form inputs.
 * @returns {CardService.ActionResponse} The action response with navigation.
 */
function reviewOrder(e) {
  const orderData = extractOrderData(e);

  if (!isValidOrder(orderData)) {
    return createErrorResponse(orderData);
  }

  const reviewCard = createReviewCard(orderData);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(reviewCard))
    .build();
}

/**
 * Extracts order data from the form input.
 * @param {Object} e - The event object containing parameters and form inputs.
 * @returns {Object} An object containing the extracted order data.
 */
function extractOrderData(e) {
  const orderType = e.parameters.type[0].toUpperCase() + e.parameters.type.slice(1);
  const [date, time] = new Date().toISOString().replace(/T/, ' ').replace(/\..+$/, '').split(" ")
  const data = {
    orderNumber: e.parameters.orderNumber,
    orderType: orderType,
    currency: e.formInput.currency,
    currencyKod: /sell/i.test(orderType) ? e.formInput.currency : "CZK",
    date: date,
    time: time,
    rate: parseFloat(e.formInput.rate),
    rateAmount: e.parameters.rateAmount,
    cashAvailable: e.parameters.cashAvailable,
    capitalAvailable: e.parameters.capitalAvailable,
    amount: parseInt(e.formInput.amount, 10),
    discount: parseFloat(e.formInput.discount || 0),
    vip: e.formInput.vip === 'vip',
    note: e.formInput.note || getConfig('DEFAULT_NOTE'),
    submittedBy: Session.getActiveUser().getEmail() || 'Unknown'
  };
  data.totalPaid = calculateTotalPaid(data);
  return data;
}

/**
 * Validates the order data.
 * @param {Object} data - The order data object to validate.
 * @returns {boolean} True if the order data is valid, false otherwise.
 */
function isValidOrder(data) {
  if (/sell/i.test(data.orderType))
    return data.cashAvailable >= data.amount;

  return data.capitalAvailable >= data.totalPaid;
}

/**
 * Calculates the total paid amount after applying discount.
 * @param {Object} data - The order data containing rate, amount, and discount.
 * @returns {number} The calculated total paid amount in CZK.
 */
function calculateTotalPaid(data) {
  return Math.round(((data.amount/data.rateAmount) * (data.rate - (data.discount /100 * data.rate))) * 100) / 100;
}

/**
 * Creates an error response card for invalid orders.
 * @param {Object} data - The order data that failed validation.
 * @returns {CardService.ActionResponse} The action response with the error card.
 */
function createErrorResponse(data) {

  const msg = `
⚠️ TRANSACTION FAILED ⚠️

Insufficient liquidity for this transaction.

Order #${data.orderNumber}
Available funds: ${data.currencyKod == 'CZK' ? data.capitalAvailable : data.cashAvailable} ${data.currencyKod}
Required amount: ${data.currencyKod == 'CZK' ? data.totalPaid : data.amount} ${data.currencyKod}
Shortfall: ${data.currencyKod == 'CZK' ? (data.totalPaid - data.capitalAvailable) : (data.amount - data.cashAvailable)} ${data.currencyKod}

`;
  const errorCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('🛑 Error'))
    .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(msg)))
    .build();

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(errorCard))
    .build();
}

/**
 * Creates the review card displaying the order summary.
 * @param {Object} data - The order data to display.
 * @returns {CardService.Card} The review card with summary and buttons.
 */
function createReviewCard(data) {
  const orderSummary = formatOrderSummary(data);

  const submitButton = createSubmitOrderButton(data);

  const footer = CardService.newFixedFooter()
    .setPrimaryButton(submitButton)
    .setSecondaryButton(backButton);

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('✅ Valid order'))
    .addSection(
      CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText('\n\n' + orderSummary)
      )
    )
    .setFixedFooter(footer)
    .build();
}

/**
 * Formats the order summary text for display.
 * @param {Object} data - The order data object.
 * @returns {string} The formatted order summary string.
 */
function formatOrderSummary(data) {
  const isBuy = /buy/i.test(data.orderType);
  const receivedAmount = isBuy ? data.amount : data.totalPaid;
  const receivedCurrency = isBuy ? data.currency : "CZK";
  const paidAmount = isBuy ? data.totalPaid : data.amount;
  const paidCurrency = isBuy ? "CZK" : data.currency;

  return `Order Type: ${data.orderType}
Order number: ${data.orderNumber}
Date and time: ${data.date} ${data.time}
${getConfig('COMPANY_NAME')}
==============================

Rate: ${data.rateAmount} ${data.currency} = ${data.rate} CZK
Discount: ${data.discount} %
VIP: ${data.vip ? "Yes" : "No"}
Amount received: ${receivedAmount} ${receivedCurrency}

==============================
Amount paid: ${paidAmount} ${paidCurrency}
==============================

Address: ${getConfig('COMPANY_ADDRESS')}
Contact: ${getConfig('COMPANY_CONTACT')}
Payment method: Cash
IČ/DIČ: ${getConfig('COMPANY_IC_DIC')}
Note: ${data.note}
`;
}

/**
 * Updates the rate and refreshes the card when currency or VIP status changes.
 * @param {Object} e - The event object with form inputs.
 * @returns {CardService.ActionResponse} The action response updating the card.
 */
function updateRate(e) {
  const selectedCurrency = e.formInput.currency;
  const type = e.parameters.type

  const preFilled = {
    currency: selectedCurrency,
    amount: e.formInput.amount || '',
    discount: e.formInput.discount,
    vip: e.formInput.vip || '',
    note: e.formInput.note
  };

  const updatedCard = createOrderCard(preFilled, type);
  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().updateCard(updatedCard))
    .build();
}


/**
 * Creates the submit order button with the order data.
 * Prepares row data from the order object and attaches it to the button action.
 * 
 * @param {Object} data - The order data object containing all order details.
 * @returns {CardService.TextButton} The submit button configured with the processOrder action.
 */
function createSubmitOrderButton(data) {
  const rowData = [
    data.orderNumber,
    data.orderType,
    data.currency,
    data.rate,
    data.amount,
    data.discount,
    data.vip ? "Yes": "No",
    data.submittedBy,
    data.date,
    data.time,
    data.totalPaid,
    data.note || "",
  ]

  return CardService.newTextButton()
    .setText("Submit")
    .setMaterialIcon(CardService.newMaterialIcon().setName("send"))
    .setOnClickAction(CardService.newAction()
      .setFunctionName('processOrder')
      .setParameters({ "rowData": JSON.stringify(rowData) }));
}

/**
 * Processes the order by appending to the spreadsheet and updating properties.
 * @param {Object} e - The event object containing the row data to append.
 * @returns {*} The result of navigating to root.
 * @throws {Error} If there is an issue with the spreadsheet operations.
 */
function processOrder(e){
  try{
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetById(getConfig('CASH_FLOW_SHEET_ID'));
    const rowData = JSON.parse(e.parameters.rowData);
    sheet.appendRow(rowData);

    const props = PropertiesService.getDocumentProperties();
    props.setProperty('lastOrderNumber', rowData[0].replace(/\D/g, ''));
    
    return goHome(e);

  } catch (error) {
    const errorCard = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle('❌ Error'))
      .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText('Failed to submit order. Please try again.')))
      .build();
    return CardService.newActionResponseBuilder()
      .setNavigation(CardService.newNavigation().pushCard(errorCard))
      .build();
  }  
}




