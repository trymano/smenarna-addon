/**
 * Prompts the user with a confirmation dialog before resetting the entire inventory.
 * If confirmed, calls resetAllInventory to perform the actual deletion.
 */
function resetInventory() {
  confirm(resetAllInventory, "This will wipe out your entire inventory. Do you really want to continue?")
}


/**
 * Deletes all inventory records from the cash flow sheet and clears all document properties.
 * This function removes all rows except the header row and resets all stored properties.
 * Displays a confirmation alert when complete.
 */
function resetAllInventory() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetById(getConfig("CASH_FLOW_SHEET_ID"));
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) return;

  const numRowsToDelete = lastRow - 1;
  sheet.deleteRows(2, numRowsToDelete);

  PropertiesService.getDocumentProperties().deleteAllProperties();

  ui.alert('All records in the inventory were removed')
}
