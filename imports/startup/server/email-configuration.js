import { Meteor } from 'meteor/meteor';
import { SEND_APP, CONFIRM_APP, isAppType } from './type-configuration.js';
import Hashids from 'hashids';
import {logConfirm} from "./log-configuration";
import { getSettings} from "meteor/doichain:settings";
export const HashIds = new Hashids('0xugmLe7Nyee6vk1iF88(6CmwpqoG4hQ*-T74tjYw^O2vOO(Xl-91wA8*nCg_lX$');

var doiMailFetchUrl = undefined;

if(isAppType(SEND_APP))
  doiMailFetchUrl =  getSettings('send.doiMailFetchUrl','http://localhost:3000/api/v1/debug/mail');

export const DOI_MAIL_FETCH_URL = doiMailFetchUrl;

var defaultFrom = undefined;
if(isAppType(CONFIRM_APP)) {

  defaultFrom =  getSettings('confirm.smtp.defaultFrom','doichain@localhost');
  logConfirm('sending with defaultFrom:',defaultFrom);

  Meteor.startup(() => {

    const smtpUsername = getSettings('confirm.smtp.username');
    const smtpPassword = getSettings('confirm.smtp.password');
    const smtpServer = getSettings('confirm.smtp.server','localhost');
    const smtpPort = getSettings('confirm.smtp.port',25);
    const smtps = getSettings('confirm.smtp.smtps',false);
    const smtp_NODE_TLS_REJECT_UNAUTHORIZED = getSettings('confirm.smtp.NODE_TLS_REJECT_UNAUTHORIZED');

    if(smtpUsername === undefined){
       process.env.MAIL_URL = (smtps?'smtps://':'smtp://')+encodeURIComponent(smtpServer) +':' +smtpPort;
   }else{
       process.env.MAIL_URL = (smtps?'smtps://':'smtp://') +
           encodeURIComponent(smtpUsername) +
           ':' + encodeURIComponent(smtpPassword) +
           '@' + encodeURIComponent(smtpServer) +
           ':' + smtpPort;
   }
   logConfirm('using MAIL_URL:',process.env.MAIL_URL);

   if(smtp_NODE_TLS_REJECT_UNAUTHORIZED!==undefined)
       process.env.NODE_TLS_REJECT_UNAUTHORIZED = smtp_NODE_TLS_REJECT_UNAUTHORIZED; //0
  });
}
//export const DOI_MAIL_DEFAULT_EMAIL_FROM = defaultFrom;
