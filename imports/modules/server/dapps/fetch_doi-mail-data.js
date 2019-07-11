import {Meteor} from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import {DOI_FETCH_ROUTE, DOI_CONFIRMATION_ROUTE, API_PATH, VERSION} from '../../../../server/api/rest/rest.js';
import {getUrl} from '../../../startup/server/dapp-configuration.js';
import {CONFIRM_CLIENT, CONFIRM_ADDRESS} from '../../../startup/server/doichain-configuration.js';
import {getHttpGET} from '../../../../server/api/http.js';
import {signMessage} from '../../../../server/api/doichain.js';
import {OptIns} from '../../../../imports/api/opt-ins/opt-ins.js';
import parseTemplate from '../emails/parse_template.js';
import generateDoiToken from '../opt-ins/generate_doi-token.js';
import generateDoiHash from '../emails/generate_doi-hash.js';
import addOptIn from '../opt-ins/add.js';
import addSendMailJob from '../jobs/add_send_mail.js';
import {logConfirm, logError} from "../../../startup/server/log-configuration";
import updateDoichainEntry from "../opt-ins/update_doichain_entry";

const FetchDoiMailDataSchema = new SimpleSchema({
    name: {
        type: String
    },
    domain: {
        type: String
    }
});

/**
 * Is called when a doichain doi transaction hits the dApp in confirmation mode. (Bob)
 *  - requests the template from the dApp in send mode (Alice) (getHttpGet)
 *
 * @param data
 */
const fetchDoiMailData = (data) => {
    try {
        const ourData = data;
        FetchDoiMailDataSchema.validate(ourData);
        const url = ourData.domain + API_PATH + VERSION + "/" + DOI_FETCH_ROUTE;
        const signature = signMessage(CONFIRM_CLIENT, CONFIRM_ADDRESS, ourData.name);
        const query = "name_id=" + encodeURIComponent(ourData.name) + "&signature=" + encodeURIComponent(signature);
        logConfirm('calling for doi-email-template:' + url + ' query:', query);

        /**
         TODO when running Send-dApp in Testnet behind NAT this URL will not be accessible from the internet
         but even when we use the URL from localhost verify and others will fails.
         */
        const response = getHttpGET(url, query);
        if (response === undefined || response.data === undefined) throw "Bad response";
        const responseData = response.data;
        logConfirm('response while getting getting email template from URL:', response.data.status);

        if (responseData.status !== "success") {
            if (responseData.error === undefined){
                const error = "Bad response"
                OptIns.update({nameId: ourData.name},{$push:{status:'error', error:error}})

                throw error;
            }
            if (responseData.error.includes("Opt-In not found")) {
                //Do nothing and don't throw error so job is done
                const error = 'bad response from send dApp:'
                OptIns.update({nameId: ourData.name},{$push:{status:'error', error:error+"\n"+responseData.error}})
                logError('bad response from send dApp', responseData.error);
                return;
            }
            OptIns.update({nameId: ourData.name},{$push:{status:'error', error:responseData.error}})
            throw responseData.error;
        }
        OptIns.update({nameId: ourData.name},{$push:{status:'mail data fetched'}});
        logConfirm('DOI Mail data fetched - for recipient:', responseData.data.recipient);

        if (responseData.data.verifyLocalHash) //don't safe anything on fallback servers (nothing should arrive here)
            updateDoichainEntry({name: ourData.name, verifyLocalHash: responseData.data.verifyLocalHash});

        logConfirm('verifyLocalHash stored:', responseData.data.verifyLocalHash);

        const optInId = addOptIn({name: ourData.name});
        const optIn = OptIns.findOne({_id: optInId});
        logConfirm('opt-in found:', optIn);
        if (optIn.confirmationToken !== undefined) return;

        const token = generateDoiToken({id: optIn._id});
        logConfirm('generated confirmationToken:', token);
        const confirmationHash = generateDoiHash({id: optIn._id, token: token, redirect: responseData.data.redirect});
        logConfirm('generated confirmationHash:', confirmationHash);
        const confirmationUrl = getUrl() + API_PATH + VERSION + "/" + DOI_CONFIRMATION_ROUTE + "/" + encodeURIComponent(confirmationHash);
        logConfirm('confirmationUrl:' + confirmationUrl);
        let template = null;
        //Encoding needs to be considered before parsing
        if (responseData.data.contentType == "json") {
            let jsonContent = JSON.parse(responseData.data.content);
            const templateText = parseTemplate({
                template: jsonContent.text, data: {
                    confirmation_url: confirmationUrl
                }
            });
            const templateHtml = parseTemplate({
                template: jsonContent.html,
                data: {
                    confirmation_url: confirmationUrl
                }
            });
            template = JSON.stringify({"text": templateText, "html": templateHtml});
        } else {
            template = parseTemplate({
                template: responseData.data.content,
                data: {
                    confirmation_url: confirmationUrl
                }
            });
        }

        //logConfirm('we are using this template:',template);

        logConfirm('sending email to peter for confirmation over bobs dApp');
        addSendMailJob({
            to: responseData.data.recipient,
            subject: responseData.data.subject,
            message: template,
            contentType: responseData.data.contentType,
            returnPath: responseData.data.returnPath,
            nameId: ourData.name
        });
        OptIns.update({nameId: ourData.name},{$push:{status:'added to email queue'}});
    } catch (exception) {
        throw new Meteor.Error('dapps.fetchDoiMailData.exception', exception);
    }
};

export default fetchDoiMailData;
