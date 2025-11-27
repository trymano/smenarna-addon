/**
 * Creates the home section card with navigation buttons and overflow menu.
 * Contains Buy and Sell buttons for primary actions, and an overflow menu
 * with options for Balance, Settings, and Reset functionality.
 * 
 * @returns {CardService.CardSection} A card section containing the button set with navigation controls
 */
function createHomeSection() {
  const buyAction = CardService.newAction().setFunctionName('navigateToBuy');
  const buyButton = CardService
    .newTextButton()
    .setText("Buy")
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(buyAction);
  const sellAction = CardService.newAction().setFunctionName('navigateToSell');
  const sellButton = CardService
    .newTextButton()
    .setText("Sell")
    .setTextButtonStyle(CardService.TextButtonStyle.OUTLINED)
    .setOnClickAction(sellAction);
  const filterButton = CardService
    .newTextButton()
    .setText(" ")
    .setOnClickAction(CardService.newAction())
    .setTextButtonStyle(CardService.TextButtonStyle.BORDERLESS)
    .setDisabled(true);  

  const config = CardService
    .newOverflowMenuItem()
    .setText("Settings")
    .setOnClickAction(CardService.newAction().setFunctionName('navigateToConfig'));
  const balance = CardService
    .newOverflowMenuItem()
    .setText("Balance")
    .setOnClickAction(CardService.newAction().setFunctionName('navigateToBalance'));
  const reset = CardService
    .newOverflowMenuItem()
    .setText("Reset")
    .setOnClickAction(CardService.newAction().setFunctionName('resetInventory'));
  const overflow = CardService
    .newOverflowMenu()
    .addMenuItem(balance)
    .addMenuItem(config)
    .addMenuItem(reset);
  const options = CardService.newTextButton()
    .setOverflowMenu(overflow)
    .setMaterialIcon(CardService.newMaterialIcon().setName('more_vert'));

  const buttonSet = CardService.newButtonSet()
    .addButton(buyButton)
    .addButton(sellButton)
    .addButton(filterButton)
    .addButton(options);


  return CardService.newCardSection().addWidget(buttonSet);

}