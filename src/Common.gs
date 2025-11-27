/**
 * Creates the home button.
 * @returns {CardService.TextButton} The home button that navigates to the root.
 */
function createHomeButton() {
  const icon = CardService.newMaterialIcon().setName('home');
  const action = CardService.newAction().setFunctionName('goHome');
  return CardService.newTextButton()
    .setText('Home')
    .setMaterialIcon(icon)
    .setOnClickAction(action);
}

/**
 * Creates the back button for navigation.
 * @returns {CardService.TextButton} The back button with arrow icon.
 */
function createBackButton() {
  return CardService
    .newTextButton()
    .setOnClickAction(CardService.newAction().setFunctionName('goBack'))
    .setMaterialIcon(CardService.newMaterialIcon().setName('arrow_back'))
    .setText('Back');
}



// --- Common cards ----

const backButton = createBackButton();
const homeButton = createHomeButton();

// --- Common Navigation Functions ---

/**
 * Navigates back to the previous card in the stack.
 * @returns {CardService.ActionResponse} The action response for popping the card.
 */
function goBack(e) {
  var navigation = CardService.newNavigation().popCard();
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}


/**
 * Pops the current card from the stack, returning to the previous one.
 * @returns {CardService.ActionResponse} The action response for popping the card.
 */
function goHome(e) {
  var navigation = CardService.newNavigation().popToRoot();
  return CardService.newActionResponseBuilder().setNavigation(navigation).build();
}

/**
 * Displays a confirmation dialog and executes a callback based on user response.
 * Shows an OK/CANCEL alert dialog. If OK is clicked, executes the ok callback.
 * If CANCEL is clicked and a cancel callback is provided, executes it.
 * 
 * @param {function():void} ok - Callback function to execute when user confirms
 * @param {string} [msg="Please confirm', 'Are you sure you want to continue?"] - The confirmation message to display
 * @param {function():void} [cancel=null] - Optional callback function to execute when user cancels
 */
function confirm(ok, msg="Please confirm', 'Are you sure you want to continue?", cancel=null) { 
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(msg, ui.ButtonSet.OK_CANCEL);
  if (result == ui.Button.OK) {
    ok()
    return;
  }

  if(typeof cancel == 'function') cancel();
}




// ------ Common helpers ---



