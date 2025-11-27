/**
 * Creates a singleton for the main navigation instance.
 * @param {boolean} installed
 * @return {CardService.Card} The home card.
 */
function createNavigationCard(installed=false) {
  const navigation = CardService.newCardBuilder();
  const header = CardService.newCardHeader();

  if(isFreshStartup() && !installed) {
    header.setTitle("🌱 Application startup");
    navigation.addSection(createStartupSection());
    navigation.setFixedFooter(CardService.newFixedFooter().setPrimaryButton(createInstallButton()));

  } else {
    header.setTitle("Smenarna").setSubtitle(getConfig('COMPANY_NAME'));
    navigation.addSection(createHomeSection());
    
  }

  navigation.setHeader(header);
  return navigation.build();
}

// --- Navigation Action Handlers ---

/**
 * Navigates to the buy card.
 * @param {Object} e - The event object.
 * @return {CardService.ActionResponse} The action response.
 */
function navigateToBuy(e) {
  var card = createOrderCard({}, 'buy');
  var navigation = CardService.newNavigation().pushCard(card);
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * Navigates to the sell card.
 * @param {Object} e - The event object.
 * @return {CardService.ActionResponse} The action response.
 */
function navigateToSell(e) {
  var card = createOrderCard({}, 'sell');
  var navigation = CardService.newNavigation().pushCard(card);
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * Navigates to the balance card.
 * @param {Object} e - The event object.
 * @return {CardService.ActionResponse} The action response.
 */
function navigateToBalance(e) {
  var card = createBalanceCard();
  var navigation = CardService.newNavigation().pushCard(card);
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * Navigates to the setup card.
 * @param {Object} e - The event object.
 * @return {CardService.ActionResponse} The action response.
 */
function navigateToSetup(e) {
  var card = createSetupCard();
  var navigation = CardService.newNavigation().pushCard(card);
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * Navigates to the configuration/settings card.
 * @param {Object} e - The event object.
 * @return {CardService.ActionResponse} The action response.
 */
function navigateToConfig(e) {
  var card = createConfigCard();
  var navigation = CardService.newNavigation().pushCard(card);
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

