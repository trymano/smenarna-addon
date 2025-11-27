function createStartupSection(e) {
  const welcomeMessage = CardService.newTextParagraph().setText(`
Welcome to Smenarna Application.

This looks like a fresh installation. 

In order to start you need to click on install button

  `)

  return CardService.newCardSection().addWidget(welcomeMessage);
}

function createInstallButton() {
  const installButton = CardService
    .newTextButton()
    .setText("Install")
    .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
    .setOnClickAction(CardService.newAction().setFunctionName('createSmenarnaSpreadSheet'));

  return installButton
}

function createSmenarnaSpreadSheet() {
  return confirm(replaceContent, "This operation will delete all sheets on this file. Are you sure you want to continue?");
}

const replaceContent = () => {
    const smenarnaSpreadSheet = SpreadsheetApp.openByUrl(getConfig("TEMPLATE_SHEET"));
    const currentSpreadSheet = SpreadsheetApp.getActiveSpreadsheet();

    if(currentSpreadSheet.getId() == smenarnaSpreadSheet.getId()) return;

    // Delete all sheets on the currentSpreadSheet
    let firstSheet;
    currentSpreadSheet.getSheets().forEach((sheet, index) => {
      if(index) return currentSpreadSheet.deleteSheet(sheet);
      firstSheet = sheet;
      firstSheet.setName("TO_BE_DELETED");
    });

    // Copy all sheets from smenarnaSpreadSheet into currentSpreadSheet
    const sheetMapping = {};
    const sourceSheets = smenarnaSpreadSheet.getSheets();
    
    sourceSheets.forEach(sheet => {
      const newSheet = sheet.copyTo(currentSpreadSheet);
      newSheet.setName(sheet.getName());
      sheetMapping[sheet.getName()] = newSheet;
    });

    // Now copy formulas again after all sheets exist with correct names
    sourceSheets.forEach(sheet => {
      const targetSheet = sheetMapping[sheet.getName()];
      const dataRange = sheet.getDataRange();
      const formulas = dataRange.getFormulas();
      
      // Copy formulas cell by cell to avoid table header issues
      for (let row = 0; row < formulas.length; row++) {
        for (let col = 0; col < formulas[row].length; col++) {
          if (formulas[row][col]) {
            targetSheet.getRange(row + 1, col + 1).setFormula(formulas[row][col]);
          }
        }
      }
    });

    // Update configuration with new sheet IDs
    if (sheetMapping['Rates']) setConfig('RATE_SHEET_ID', sheetMapping['Rates'].getSheetId());
    if (sheetMapping['Capital']) setConfig('CAPITAL_SHEET_ID', sheetMapping['Capital'].getSheetId());
    if (sheetMapping['Cash Flow']) setConfig('CASH_FLOW_SHEET_ID', sheetMapping['Cash Flow'].getSheetId());
    if (sheetMapping['Report']) setConfig('REPORT_SHEET_ID', sheetMapping['Report'].getSheetId());
    
    // Mark installation as complete
    setConfig("INSTALLED", true);
    
    // Force save changes
    SpreadsheetApp.flush();

    // Delete first sheet
    currentSpreadSheet.deleteSheet(firstSheet);

    const ui = SpreadsheetApp.getUi();
    ui.alert("All sheets installed successfully! 👌.\n\nGo to settings and set your capital.");

    // Navigate to home
    const homeCard = createNavigationCard(true);
    const navigation = CardService.newNavigation().updateCard(homeCard);
    return CardService.newActionResponseBuilder().setNavigation(navigation).build();

  };

function isFreshStartup() {
  return getConfig("INSTALLED") == 'false'
}

