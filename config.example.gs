var ORG_DOMAIN = 'example.com';
var ORG_IP_ADDRESS = '127.0.0.1'; //External IP of the mail relay.
var CYBERSECURITY_EMAIL = 'potential.phishing@example.com'; //Cybersecurity email that forwarded emails get sent to.
var PHISHING_HEADER = 'X-PHISH'; //Header key.
var PHISHING_VALUE = 'example.com-phish'; //Value to look for in header.
var WHITELISTED_SAFE_DOMAINS = [
	'event.eventbrite.com',
	'google.com',
	'service.govdelivery.com',
	'zoom.us'
]; //Array of whitelisted domains.
var CLEAN_TLD = [
	'com',
	'edu',
	'gov',
	'net',
	'org',
	'us'
]; //Array of Top Level Domains (TLD) that are considered safe.
var LOGO_URL = ''; //URL to the top left logo.
var COLOR = {
	black: '#000000',
	green: '#008000',
	red: '#FF0000',
	yellow: '#FFA500',
	white: '#FFFFFF',
	org_color: '#000000'
};
var VERDICTS = {
	orgPhishing: { //This is an internal phishing message
		header: '<font color="' + COLOR.org_color + '"><b>Internal Phishing</b></font>',
		text: 'This is an authorized internal phishing test from the your organization, great catch!',
	},
	orgAuth: { //This is a message sent from the organization and authenticated
		header: '<font color="' + COLOR.green + '"><b>Likely Safe - Internal and Authenticated</b></font>',
		text: 'This message is likely from an employee in your organization. It was sent from inside the organization and authenticated.',
	},
	org: { //This is a message sent from the organization, but not authenticated
		header: '<font color="' + COLOR.green + '"><b>Internal - Likely a system generated message</b></font>',
		text: 'This message was sent from inside the organization but can not be authenticated. This could mean it is a system message or scan from a printer.',
	},
	googleAuth: { //This is a message sent from a Google domain and authenticated
		header: '<font color="' + COLOR.green + '"><b>Google - Authenticated</b></font>',
		text: 'This message was sent from a Google domain and was authenticated. This could indicate that the email was sent to a Google group and Google relayed it to you.',
	},
	google: { //This is a message sent from a Google domain, but not authenticated
		header: '<font color="' + COLOR.yellow + '"><b>Google - Not Authenticated</b></font>',
		text: 'This message was sent from a Google domain but was not authenticated. Be very cautious. Report to your organization as needed.',
	},
	trustedDomainAuth: { //This is a message sent from a trusted domain and apart of our trusted TLD list, but not from the organization
		header: '<font color="' + COLOR.green + '"><b>Sender Address Verified</b></font>',
		text: 'This message has been authenticated but was not sent from an employee from your organization. Proceed with caution and report to your organization as needed.',
	},
	auth: { //This is a message sent from a trusted domain, but not from the organization
		header: '<font color="' + COLOR.red + '"><b>Sender Address Verified - Uncommon Domain</b></font>',
		text: 'This message has been authenticated but was not sent from a well known domain (com, gov, edu). Proceed with caution and report to your organization as needed.',
	},
	currentUser: { //This is a message sent from the current user
		header: '<font color="' + COLOR.org_color + '"><b>Likely Safe - Sent from your account</b></font>',
		text: 'This message was sent from your account. If this is unexpected, you may need to select the email message again or report to your organization as needed.',
	},
	listUnsubscribe: { //This is a list-unsubscribe message, likely spam
		header: '<font color="' + COLOR.yellow + '"><b>Likely Newsletter/Spam - Proceed with Caution</b></font>',
		text: 'This message was not sent from an employee from your organization. This could be a legitimate newsletter, phishing attempt, or scam; proceed with caution and report to your organization as needed.',
	},
	whitelistedDomain: { //This is a whitelisted domain, but not the organization domain
		header: '<font color="' + COLOR.green + '"><b>Likely Safe - Whitelisted Domain</b></font>',
		text: 'This message was sent from a whitelisted domain, but not from an employee from your organization. It is likely safe, but please report to your organization as needed.',
	},
	fallback: { //This is an external message.
		header: '<font color="' + COLOR.red + '"><b>External - Proceed with Caution</b></font>',
		text: 'This message was not sent from an employee from your organization. This could be a legitimate phishing attempt or scam, proceed with caution and report to your organization as needed.',
	},
};

//Logging (Splunk)
var HEC_LOG = false;
var HEC_ENDPOINT = "https://example.com/path/";
var HEC_TOKEN = "";