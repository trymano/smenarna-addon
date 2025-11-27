/**
 * Configuration management for the Smenarna application.
 * Values are stored in document properties and can be configured via the settings menu.
 */

// Default configuration values
const DEFAULT_CONFIG = {
  RATE_SHEET_ID: 394379920,
  CAPITAL_SHEET_ID: 1525726910, // => Capital
  CASH_FLOW_SHEET_ID: 364904406, // => Cash Flow
  REPORT_SHEET_ID: 922948174,
  COMPANY_NAME: "My Exchange, s.r.o.",
  COMPANY_ADDRESS: "Some street, Some city",
  COMPANY_CONTACT: "+420 123 456 789",
  COMPANY_IC_DIC: "12345678/CZ12345678",
  DEFAULT_RATE_AMOUNT: "1",
  DEFAULT_DISCOUNT: 0,
  DEFAULT_NOTE: "---",
  AVAILABLE_CAPITAL: 1000,
  TEMPLATE_SHEET: ""
};

/**
 * Gets a configuration value from document properties, with fallback to default.
 * @param {string} key - The configuration key.
 * @returns {*} The configuration value.
 */
function getConfig(key) {
  const props = PropertiesService.getDocumentProperties();
  const value = props.getProperty(key);
  if (value !== null) {
    // Try to parse as number if it's numeric
    const numValue = Number(value);
    return isNaN(numValue) ? value : numValue;
  }
  return DEFAULT_CONFIG[key];
}

/**
 * Sets a configuration value in document properties.
 * @param {string} key - The configuration key.
 * @param {*} value - The value to set.
 */
function setConfig(key, value) {
  const props = PropertiesService.getDocumentProperties();
  props.setProperty(key, value.toString());
  updateDocProps(key, value.toString())
}

/**
 * Gets all configuration values.
 * @returns {Object} An object with all config values.
 */
function getAllConfig() {
  const config = {};
  Object.keys(DEFAULT_CONFIG).forEach(key => {
    config[key] = getConfig(key);
  });
  return config;
}

/**
 * Creates the configuration/settings card.
 * @returns {CardService.Card} The settings card.
 */
function createConfigCard() {
  const config = getAllConfig();

  const companySection = CardService.newCardSection()
    .setHeader("🏢 Company settings")
    .addWidget(CardService.newTextParagraph().setText(" "))
    .addWidget(CardService.newTextInput()
      .setFieldName('COMPANY_NAME')
      .setTitle('Company Name')
      .setValue(config.COMPANY_NAME))
    .addWidget(CardService.newTextInput()
      .setFieldName('AVAILABLE_CAPITAL')
      .setTitle('Available Capital')
      .setValue(config.AVAILABLE_CAPITAL.toString()))
    .addWidget(CardService.newTextInput()
      .setFieldName('COMPANY_ADDRESS')
      .setTitle('Company Address')
      .setValue(config.COMPANY_ADDRESS))
    .addWidget(CardService.newTextInput()
      .setFieldName('COMPANY_CONTACT')
      .setTitle('Company Contact')
      .setValue(config.COMPANY_CONTACT))
    .addWidget(CardService.newTextInput()
      .setFieldName('COMPANY_IC_DIC')
      .setTitle('Company IČ/DIČ')
      .setValue(config.COMPANY_IC_DIC));

  const appConfigSection = CardService.newCardSection()
    .setHeader("⚙️ App settings")
    .addWidget(CardService.newTextParagraph().setText(" "))
    .addWidget(CardService.newTextInput()
      .setFieldName('RATE_SHEET_ID')
      .setTitle('Rate Sheet ID')
      .setValue(config.RATE_SHEET_ID.toString()))
    .addWidget(CardService.newTextInput()
      .setFieldName('CAPITAL_SHEET_ID')
      .setTitle('Capital Sheet ID')
      .setValue(config.CAPITAL_SHEET_ID.toString()))
    .addWidget(CardService.newTextInput()
      .setFieldName('CASH_FLOW_SHEET_ID')
      .setTitle('Cash Flow Sheet ID')
      .setValue(config.CASH_FLOW_SHEET_ID.toString()))
    .addWidget(CardService.newTextInput()
      .setFieldName('REPORT_SHEET_ID')
      .setTitle('Report Sheet ID')
      .setValue(config.REPORT_SHEET_ID.toString()));

  const saveButtonCard = CardService.newTextButton()
    .setText('Save')
    .setOnClickAction(CardService.newAction()
      .setFunctionName('saveConfig')
      .setParameters({ 'configKeys': JSON.stringify(Object.keys(DEFAULT_CONFIG)) }));


  const footer = CardService.newFixedFooter()
    .setPrimaryButton(saveButtonCard)
    .setSecondaryButton(backButton);

  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('🛠️ Settings'))
    .addSection(companySection)
    .addSection(appConfigSection)
    .setFixedFooter(footer)
    .build();
}

/**
 * Saves the configuration from the form inputs.
 * @param {Object} e - The event object with form inputs.
 * @returns {CardService.ActionResponse} The action response.
 */
function saveConfig(e) {
  const configKeys = JSON.parse(e.parameters.configKeys);
  configKeys.forEach(key => {
    if (e.formInput[key]) {
      setConfig(key, e.formInput[key]);
    }
  });

  // Show success message
  const successCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('✅ Settings Saved'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph().setText('Configuration has been updated successfully.')))
    .setFixedFooter(CardService.newFixedFooter()
      .setPrimaryButton(homeButton))
    .build();

  return CardService.newActionResponseBuilder()
    .setNavigation(CardService.newNavigation().pushCard(successCard))
    .build();
}

/**
 * Gets or creates the configuration sheet.
 * If the '_config' sheet doesn't exist, creates it and hides it.
 * Stores the sheet ID in configuration.
 * 
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The configuration sheet
 */
function getConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('_config');

  if(!sheet) {
    sheet = ss.insertSheet('_config');
    setConfig("CONFIG_SHEET_ID", sheet.getSheetId());
  }

  sheet.hideSheet();
  return sheet;
}

/**
 * Updates document properties in the config sheet.
 * Currently only tracks AVAILABLE_CAPITAL changes by logging them to the config sheet.
 * 
 * @param {string} key - The configuration key being updated
 * @param {string} value - The new value for the configuration key
 */
function updateDocProps(key, value) {
  if (key !== "AVAILABLE_CAPITAL") return;

  const sheet = getConfigSheet();

  const lastRow = sheet.getLastRow() || 1;
  sheet.getRange(lastRow, 1).setValue(key);
  sheet.getRange(lastRow, 2).setValue(value);

}

