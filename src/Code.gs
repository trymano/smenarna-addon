/**
 * Handles the homepage event.
 * @param {Object} e - The event object.
 * @return {CardService.Card} The home card.
 */
function onHomepage(e) {
  try {
    return createNavigationCard();
  } catch (err) {
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle('Error'))
      .addSection(CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText('An error occurred: ' + err)
      ))
      .build();
  }
}