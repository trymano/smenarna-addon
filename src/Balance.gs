

/**
 * Audits the balance of specified currencies by calculating the total available amounts from the cash flow sheet.
 * @returns {Object<string, number>} An object containing the balances for each currency, keyed by currency code.
 */
function getBalances() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const cashFlowSheet = spreadsheet.getSheetById(getConfig('CAPITAL_SHEET_ID'));
    
    if (!cashFlowSheet) {
      return { error: 'Cash flow sheet not found.' };
    }
    
    const data = cashFlowSheet.getDataRange().getValues();
    const balances = { };
    
    for (let i = 1; i < data.length; i++) {
      if(data[i][5] || 0)
        balances[data[i][2]] = parseFloat(data[i][5] || 0);
    }
    
    return balances;
  } catch (error) {
    return { error: error.toString() };
  }
}

/**
 * Note denominations for each currency.
 * @type {Object<string, number[]>}
 */
const DENOMINATIONS = {
  'CZK': [100, 200, 500, 1000, 2000, 5000],
  'EUR': [5, 10, 20, 50, 100, 200, 500],
  'USD': [1, 5, 10, 20, 50, 100],
  'GBP': [5, 10, 20, 50],
  'AUD': [5, 10, 20, 50, 100],
  'CAD': [5, 10, 20, 50, 100],
  'CHF': [10, 20, 50, 100, 200, 1000],
  'HUF': [500, 1000, 2000, 5000, 10000, 20000],
  'PLN': [10, 20, 50, 100, 200, 500],
  'UAH': [1, 2, 5, 10, 20, 50, 100, 200, 500],
  'SEK': [20, 50, 100, 200, 500, 1000],
  'JPY': [1000, 2000, 5000, 10000],
  'DKK': [50, 100, 200, 500, 1000],
  'NOK': [50, 100, 200, 500, 1000],
  'AED': [5, 10, 20, 50, 100, 200, 500, 1000],
  'TRY': [5, 10, 20, 50, 100, 200],
  'BGN': [2, 5, 10, 20, 50, 100],
  'RON': [1, 5, 10, 50, 100, 200, 500]
};

/**
 * Gets the rounding precision for a currency based on its smallest coin denomination.
 * @param {string} currency - The currency code.
 * @returns {number} The number of decimal places to round to.
 */
function getRoundingPrecision(currency) {
  const coins = COINS[currency] || [];
  if (coins.length === 0) return 0;
  const minCoin = Math.min(...coins);
  if (minCoin >= 1) return 0;
  if (minCoin >= 0.1) return 1;
  return 2; // for currencies with cents
}

/**
 * Coin denominations for each currency.
 * @type {Object<string, number[]>}
 */
const COINS = {
  'CZK': [1, 2, 5, 10, 20, 50],
  'EUR': [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2],
  'USD': [0.01, 0.05, 0.10, 0.25, 0.50, 1],
  'GBP': [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2],
  'AUD': [0.05, 0.10, 0.20, 0.50, 1, 2],
  'CAD': [0.05, 0.10, 0.25, 0.50, 1, 2],
  'CHF': [0.05, 0.10, 0.20, 0.50, 1, 2, 5],
  'HUF': [5, 10, 20, 50, 100, 200],
  'PLN': [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2, 5],
  'UAH': [0.01, 0.02, 0.05, 0.10, 0.25, 0.50, 1],
  'SEK': [0.50, 1, 2, 5, 10],
  'JPY': [1, 5, 10, 50, 100, 500],
  'DKK': [0.25, 0.50, 1, 2, 5, 10, 20],
  'NOK': [0.50, 1, 5, 10, 20],
  'AED': [0.25, 0.50, 1],
  'TRY': [0.01, 0.05, 0.10, 0.25, 0.50, 1],
  'BGN': [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1],
  'RON': [0.01, 0.05, 0.10, 0.50, 1]
};

/**
 * Creates the header section with a currency selection dropdown.
 * @param {Object<string, number>} balances - The balances object for available currencies.
 * @param {string} selectedCurrency - The currently selected currency code.
 * @returns {CardService.CardSection} The header card section.
 */
function createBalanceHeaderSection(balances, selectedCurrency) {
  const sectionHeader = CardService.newCardSection();
  const currencySelection = CardService.newSelectionInput()
    .setFieldName('currency')
    .setTitle('Choose currency')
    .setType(CardService.SelectionInputType.DROPDOWN)
    .setOnChangeAction(CardService.newAction()
      .setFunctionName('navigateToCalculator'));
    
  Object.keys(balances).forEach(key => {
    currencySelection.addItem(key, key, key == selectedCurrency)
  })

  sectionHeader.addWidget(currencySelection);

  return sectionHeader;
}

/**
 * Creates the body section displaying the current balances for all currencies.
 * @param {Object<string, number>} balances - The balances object for available currencies.
 * @returns {CardService.CardSection} The body card section.
 */
function createBalanceBodySection(balances) {
  const sectionBody = CardService.newCardSection();
  sectionBody.addWidget(CardService.newDecoratedText().setWrapText(true).setText('Balance sheet'));
  
  Object.keys(balances).forEach(currency => {
    sectionBody.addWidget(CardService.newTextParagraph()
      .setText(`${currency}: ${balances[currency].toFixed(2)}`));
  });

  return sectionBody;
}



/**
 * Navigates to the calculator card for the selected currency.
 * @param {Object} e - The event object containing form inputs.
 * @param {Object} e.formInput - The form input values.
 * @param {string} e.formInput.currency - The selected currency code.
 * @param {string} e.parameters.balance - The selected currency code.
 * @returns {CardService.ActionResponse} The action response with navigation.
 */
function navigateToCalculator(e){
  const selectedCurrency = e.formInput.currency;
  const balances = getBalances();
  const precision = getRoundingPrecision(selectedCurrency);
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(`Balance: ${(balances[selectedCurrency]).toFixed(precision)} ${selectedCurrency}`))
    .addSection(createBalanceHeaderSection(balances, selectedCurrency));
  const sections = createCurrencyCalculatorCard(selectedCurrency);
  sections.forEach(s => card.addSection(s));
  const footer = CardService.newFixedFooter()
    .setPrimaryButton(CardService.newTextButton()
      .setText('Calculate Total')
      .setOnClickAction(CardService.newAction().setFunctionName('calculateTotal')))
    .setSecondaryButton(backButton);
  card.setFixedFooter(footer);
  
  const navigation = CardService.newNavigation().pushCard(card.build());
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}


/**
 * Creates the calculator card section with input fields for note denominations of the selected currency.
 * @param {string} currency - The currency code.
 * @returns {CardService.CardSection} The calculator card section.
 */
function createCurrencyCalculatorCard(currency) {
  const paperSection = CardService
    .newCardSection()
    .setCollapsible(true);

  const denoms = DENOMINATIONS[currency] || [];
  denoms.forEach(denom => {
    const input = CardService.newTextInput()
      .setFieldName(`denom_${denom}`)
      .setTitle(`${denom}`)
      .setHint('Enter quantity');
    paperSection.addWidget(input);
  });

  paperSection.setHeader("Paper notes");

  // Collapsible section for coins
  const coinSection = CardService.newCardSection()
    .setHeader(CardService.newCardHeader().setTitle('Coins'))
    .setCollapsible(true);

  const coins = COINS[currency] || [];
  coins.forEach(coin => {
    const input = CardService.newTextInput()
      .setFieldName(`coin_${coin}`)
      .setTitle(`${coin}`)
      .setHint('Enter quantity');
    coinSection.addWidget(input);
  });
  coinSection.setHeader("Coins")

  return [paperSection, coinSection];
}
 


/**
 * Calculates the total from the note inputs and compares to the balance.
 * @param {Object} e - The event object containing form inputs.
 * @returns {CardService.ActionResponse} The action response with navigation to the result card.
 */
function calculateTotal(e) {
  const currency = e.formInput.currency;
  const precision = getRoundingPrecision(currency);
  const denoms = DENOMINATIONS[currency] || [];
  const coins = COINS[currency] || [];
  let total = 0;
  let breakdown = [];
  denoms.forEach(denom => {
    const qty = parseFloat(e.formInput[`denom_${denom}`] || '0');
    if (qty > 0) {
      total += qty * denom;
      breakdown.push(`${denom} ${currency} x ${qty} = ${(qty * denom).toFixed(precision)}`);
    }
  });
  coins.forEach(coin => {
    const qty = parseFloat(e.formInput[`coin_${coin}`] || '0');
    if (qty > 0) {
      total += qty * coin;
      breakdown.push(`${coin} ${currency} x ${qty} = ${(qty * coin).toFixed(precision)}`);
    }
  });
  total = parseFloat(total.toFixed(precision));
  const balances = getBalances();
  const balance = parseFloat((balances[currency] || 0).toFixed(precision));
  const diff = total - balance;
  let resultText;
  if (Math.abs(diff) < Math.pow(10, -precision)) { // consider as zero if very small
    resultText = `✅ Balance matches! Total: ${total.toFixed(precision)} ${currency}`;
  } else {
    let summary = `Denominations:\n${breakdown.join('\n')}\n\nTotal: ${total.toFixed(precision)} ${currency}\nBalance: ${balance.toFixed(precision)} ${currency}\n`;
    if (diff > 0) {
      resultText = `❌ Surplus: ${diff.toFixed(precision)} ${currency}\n\n${summary}`;
    } else {
      resultText = `❌ Deficit: ${Math.abs(diff).toFixed(precision)} ${currency}\n\n${summary}`;
    }
  }
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle(`${diff === 0 ? '✅ All good' : '⚠️ Warning'}`))
    .addSection(CardService.newCardSection().addWidget(CardService.newTextParagraph().setText(resultText)))
    .setFixedFooter(CardService.newFixedFooter()
      .setPrimaryButton(backButton));
  const navigation = CardService.newNavigation().pushCard(card.build());
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * Creates the balance audit card displaying the current balances for EUR, USD, and GBP.
 * @returns {CardService.Card} The balance card.
 */
function createBalanceCard() {
  const balances = getBalances();  
  const card = CardService
    .newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('🧮 Balance'));
  
  card
    .addSection(createBalanceHeaderSection(balances))
    .addSection(createBalanceBodySection(balances))
    .setFixedFooter(CardService.newFixedFooter()
      .setPrimaryButton(homeButton));
  
  return card.build();
}



