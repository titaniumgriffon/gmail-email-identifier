/**
 * Returns the array of cards that should be rendered for the current
 * e-mail thread. The name of this function is specified in the
 * manifest 'onTriggerFunction' field, indicating that this function
 * runs every time the add-on is started.
 *
 * @param {Object} e The data provided by the Gmail UI.
 * @return {Card[]}
 */
function buildAddOn(e) {
	// Activate temporary Gmail add-on scopes.
	var accessToken = e.messageMetadata.accessToken;
	GmailApp.setCurrentMessageAccessToken(accessToken);

	var messageId = e.messageMetadata.messageId;
	var message = GmailApp.getMessageById(messageId);

	//Building out section
	verdictSection = sectionVerdict(message)
	checkSection = sectionCheck(message);
	linksFoundSection = sectionLinksFound(message);
	forwardEmailCybersecuritySection = sectionForwardEmailCybersecurity(message);

	// Build the main card with the email information section.
	var card = CardService.newCardBuilder()
		.setHeader(CardService.newCardHeader()
			.setTitle('Email Information')
			.setImageUrl(LOGO_URL))
		.addSection(forwardEmailCybersecuritySection)
		.addSection(verdictSection)
		.addSection(checkSection)
		.addSection(linksFoundSection)
		.build();

	return [card];
}

/**
 * Returns a CardSection containing information about the links found in the given email message.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {CardSection}
 */
function sectionLinksFound(message) {
	var domainList = extractDomainsFromGmailMessage(message.getBody());

	// Create a section and add the key-value pairs to it
	var section = CardService.newCardSection().setHeader('Domains Found');

	if (domainList.length === 0) {
		section.addWidget(CardService.newTextParagraph().setText('No links found in the message.'));
	} else {
		for (var i = 0; i < domainList.length; ++i) {
			if (domainList[i] !== undefined) {
				section.addWidget(CardService.newKeyValue().setContent(domainList[i]));
			}
		}
	}

	return section;
}

/**
 * Returns a CardSection containing a link that forwards the email to cybersecurity.
 *
 * @return {CardSection}
 */
function sectionForwardEmailCybersecurity() {
	var forwardButton = CardService.newTextButton()
		.setText('Forward Email to Cybersecurity')
		.setOnClickAction(CardService.newAction().setFunctionName('forwardEmailCybersecurity'));

	var section = CardService.newCardSection().setHeader('Report');
	section.addWidget(forwardButton);
	return section;
}

/**
 * Forwards the current email to cybersecurity, and then delete it from the inbox.
 *
 * @return {CardSection}
 */
function forwardEmailCybersecurity(e) {
	//Getting the message and attachments.
	var message = GmailApp.getMessageById(e.gmail.messageId);
	var attachmentsArray = message.getAttachments();
	var internalPhishingFlag = isEmailInternalPhishing(message);

	if (internalPhishingFlag !== true) {
		//Adding the current raw message to the attachments list.
		attachmentsArray.push(Utilities.newBlob(message.getRawContent(), "message/rfc822", "phish_message.eml"));

		// Forwarding the message to Cybersecurity
		var forwardedMessage = message.forward(CYBERSECURITY_EMAIL, {
			attachments: attachmentsArray,
			subject: "[Phishing Report] " + message.getSubject()
		});
	}

	//Moving message to trash.
	message.moveToTrash();

	// Log forwarded message ID
	// Logger.log("Forwarded message ID: " + forwardedMessage.getId());
}


/**
 * Returns a CardSection containing information about the links found in the given email message.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {CardSection}
 */
function sectionCheck(message) {
	var replyTo = message.getReplyTo();
	var fromCurrentUser = isFromCurrentUser(message);
	var toCurrentUser = isToCurrentUser(message) ? 'Yes' : 'No: ' + message.getHeader('Delivered-To');
	if (fromCurrentUser === true) {
		var fromOrg = 'From you!';
	}
	else {
		var fromOrg = (isEmailFromOrg(message) || isFromOrgDomain(message)) ? 'Yes' : 'No';
	}
	// Create a section and add the key-value pairs to it
	var section = CardService.newCardSection().setHeader('Checks');

	if (isEmailInternalPhishing(message) === true) {
		section.addWidget(CardService.newKeyValue().setContent('Internal Phishing').setBottomLabel('Yes, good job! :)'));
	}

	section.addWidget(CardService.newKeyValue().setContent('From').setBottomLabel(message.getFrom()));
	if (replyTo !== undefined && replyTo !== '') {
		section.addWidget(CardService.newKeyValue().setContent('Reply').setBottomLabel(message.getReplyTo()));
	}

	section.addWidget(CardService.newKeyValue().setContent('From our Organization?').setBottomLabel(fromOrg));

	if (message.getHeader('Delivered-To') !== undefined && message.getHeader('Delivered-To') !== '') {
		section.addWidget(CardService.newKeyValue().setContent('Sent to you?').setBottomLabel(toCurrentUser));
	}

	return section;
}

/**
 * Returns a CardSection containing information about the links found in the given email message.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isEmailInternalPhishing(message) {
	if (message.getHeader(PHISHING_HEADER) === PHISHING_VALUE) {
		return true;
	}
	else {
		return false;
	}
}

/**
 * Checks the Authentication-Results for the organization IP being present.
 * This will only show emails sent FROM the organization, not through the web Gmail client.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isEmailFromOrg(message) {
	return message.getHeader('Authentication-Results').indexOf(ORG_IP_ADDRESS) !== -1;
}

/**
 * Checks if DMARC, DKIM, SPF, **and** that the email is from the organization domain.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isEmailSenderAuthenticated(message) {
	return isEmailSenderAuthenticatedDMARC(message) && isEmailSenderAuthenticatedDKIM(message) && isEmailSenderAuthenticatedSPF(message);
}

/**
 * Checks if DMARC passes.
 * This does not validate the domain.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isEmailSenderAuthenticatedDMARC(message) {
	return message.getHeader('Authentication-Results').indexOf('dmarc=pass') !== -1;
}

/**
 * Checks if DKIM passes.
 * This does not validate the domain.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isEmailSenderAuthenticatedDKIM(message) {
	return message.getHeader('Authentication-Results').indexOf('dkim=pass') !== -1 || message.getHeader('Authentication-Results').indexOf('arc=pass') !== -1;
}

/**
 * Checks if SPF passes.
 * This does not validate the domain.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isEmailSenderAuthenticatedSPF(message) {
	return message.getHeader('Authentication-Results').indexOf('spf=pass') !== -1;
}

/**
 * Validates that the email is from the organization domain.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isFromOrgDomain(message) {
	return message.getHeader('Received-SPF').indexOf('@' + ORG_DOMAIN) !== -1;
}

/**
 * Validates that the email is from the Google domain.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isEmailFromGoogleDomain(message) {
	return message.getHeader('From').indexOf('google.com') !== -1;
}

/**
 * Validates if an email is found within a hard-coded list of whitelisted domains.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isFromWhitelistedSafeDomain(message) {
	//Iterate through whitelisted domains
	for (var i = 0; i < WHITELISTED_SAFE_DOMAINS.length; ++i) {
		if (message.getHeader('Received-SPF').indexOf('@' + WHITELISTED_SAFE_DOMAINS[i]) !== -1) {
			return true;
		}
	}
	return false;
}


/**
 * Validates if an email is found within a hard-coded list of whitelisted domains.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isTLDClean(message) {
	//Iterate through whitelisted domains
	for (var i = 0; i < CLEAN_TLD.length; ++i) {
		if (message.getHeader('From').indexOf('.' + CLEAN_TLD[i] + '>') !== -1) {
			return true;
		}
	}
	return false;
}

/**
 * Checks if the email is from the current user.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isFromCurrentUser(message) {
	return message.getHeader('From').indexOf(Session.getActiveUser().getEmail()) !== -1;
}

/**
 * Checks if the email is to the current user.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function isToCurrentUser(message) {
	return message.getHeader('Delivered-To').indexOf(Session.getActiveUser().getEmail()) !== -1;
}

/**
 * Checks if the email has a List-Unsubscribe header. Likely indicating it is spam.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {boolean}
 */
function hasListUnsubscribe(message) {
	return message.getHeader('List-Unsubscribe') !== '';
}

/**
 * Returns a CardSection containing information about the links found in the given email message.
 *
 * @param {GmailMessage} message The Gmail message.
 * @return {CardSection}
 */
function sectionVerdict(message) {
	var internalPhishingFlag = isEmailInternalPhishing(message);
	var fromOrgFlag = isEmailFromOrg(message) || isFromOrgDomain(message);
	var fromGoogle = isEmailFromGoogleDomain(message);
	var emailSenderAuthenticatedFlag = isEmailSenderAuthenticated(message);
	var sentFromCurrentUser = isFromCurrentUser(message);
	var listUnsubscribeFlag = hasListUnsubscribe(message);
	var whitelistedSafeFlag = isFromWhitelistedSafeDomain(message);
	var isTLDCleanFlag = isTLDClean(message);

	var verdict = {};

	if (internalPhishingFlag === true) { //This is an internal phishing message
		verdict = VERDICTS.orgPhishing;
	}
	else if (fromOrgFlag === true && emailSenderAuthenticatedFlag === true) { //This is a message sent from the organization and authenticated
		verdict = VERDICTS.orgAuth;
	}
	else if (fromOrgFlag === true) { //This is a message sent from the organization, but not authenticated
		verdict = VERDICTS.org;
	}
	else if (fromGoogle === true && emailSenderAuthenticatedFlag === true) { //This is a message sent from a Google domain and authenticated
		verdict = VERDICTS.googleAuth;
	}
	else if (fromGoogle === true) { //This is a message sent from a Google domain, but not authenticated
		verdict = VERDICTS.google;
	}
	else if (isTLDCleanFlag === true && emailSenderAuthenticatedFlag === true) { //This is a message sent from a trusted domain and apart of our trusted TLD list, but not from the organization
		verdict = VERDICTS.trustedDomainAuth;
	}
	else if (emailSenderAuthenticatedFlag === true) { //This is a message sent from a trusted domain, but not from the organization
		verdict = VERDICTS.auth;
	}
	else if (sentFromCurrentUser === true) { //This is a message sent from the current user
		verdict = VERDICTS.currentUser;
	}
	else if (listUnsubscribeFlag === true) { //This is a list-unsubscribe message, likely spam
		verdict = VERDICTS.listUnsubscribe;
	}
	else if (whitelistedSafeFlag === true) { //This is a whitelisted domain, but not the organization domain
		verdict = VERDICTS.whitelistedDomain;
	}
	else { //This is an external message.
		verdict = VERDICTS.fallback;
	}

	// Create a section and add the key-value pairs to it
	var section = CardService.newCardSection().setHeader(verdict.header);
	section.addWidget(
		CardService.newDecoratedText()
			.setText(verdict.text)
			.setWrapText(true)
	);
	return section;
}

/**
 * Helper function to extract href values from the given email message body.
 * Returns a unique array.
 *
 * @param {string} messageBody
 * @return {array}
 */
function extractDomainsFromGmailMessage(messageBody) {
	var domains = [];

	// Regular expression pattern to match href values
	var pattern = /.*:\/\/([^"\/?]*).*/gi;

	// Match all href values using the pattern
	var match;
	while ((match = pattern.exec(messageBody)) !== null) {
		domains.push(match[1].toLowerCase()); // Add matched href value to the array
	}

	return removeDuplicates(domains).sort();
}

/**
 * Removes duplicate values from an array.
 * Returns a unique array.
 *
 * @param {array} array
 * @return {array}
 */
function removeDuplicates(array) {
	var uniqueArray = [];
	for (var i = 0; i < array.length; ++i) {
		if (uniqueArray.indexOf(array[i]) === -1) {
			uniqueArray.push(array[i]);
		}
	}
	return uniqueArray;
}
