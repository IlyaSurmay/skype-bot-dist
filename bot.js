"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const IS_AUTHORIZED = 'isAuthorizedProperty';
class SkypeBot {
    constructor(userState) {
        this.userState = userState;
        this.isAuthorizedProperty = userState.createProperty(IS_AUTHORIZED);
    }
    onTurn(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (turnContext.activity.type === botbuilder_1.ActivityTypes.Message) {
                yield this.userState.saveChanges(turnContext);
            }
            else if (turnContext.activity.type === botbuilder_1.ActivityTypes.ConversationUpdate || turnContext.activity.type === botbuilder_1.ActivityTypes.ContactRelationUpdate) {
                yield this.sendWelcomeMessage(turnContext);
            }
        });
    }
    sendWelcomeMessage(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (turnContext.activity.membersAdded && turnContext.activity.membersAdded.length) {
                for (const i in turnContext.activity.membersAdded) {
                    if (turnContext.activity.membersAdded[i].id !== turnContext.activity.recipient.id) {
                        yield turnContext.sendActivity(`Welcome! 
          Please enter your email and a verification code in the following format: "your@email.com XXXXXXXX", where XXXXXXXX is your verification code. 
          You can get you verification code in your user profile in Renaizant.`);
                    }
                }
            }
        });
    }
}
exports.SkypeBot = SkypeBot;
