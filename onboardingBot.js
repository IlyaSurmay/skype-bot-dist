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
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const botbuilder_1 = require("botbuilder");
const DIALOG_STATE_PROPERTY = 'dialogState';
const USER_PROFILE_PROPERTY = 'user';
const START_ONBOARDING = 'start_onboarding';
const DISPLAY_ONBOARDING_RESULTS = 'disaplay_onboarding_results';
const SELECT_DEPARTMENT_PROMPT = 'select_department';
const JOB_TITLE_PROMPT = 'job_title_prompt';
const JOB_DESCRIPTION_PROMPT = 'job_description_prompt';
const SELECT_TEAM_PROMPT = 'select_team_prompt';
const TEAM_STRATEGY_DIALOG = 'team_strategy_dialog';
const TEAM_STRATEGY_PROMPT = 'team_strategy_prompt';
const CREATE_TEAM_DIALOG = 'create_team_dialog';
const CREATE_TEAM_PROMPT = 'create_team_prompt';
const OTHER_TEAM_PARTICIPATION_PROMPT = 'other_team_participation_prompt';
const SELECT_TEAM_DIALOG = 'select_team_dialog';
class OnboardingBot {
    constructor(conversationState, userState, adapter) {
        this.conversationState = conversationState;
        this.userState = userState;
        this.adapter = adapter;
        this.dialogState = this.conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userProfile = this.userState.createProperty(USER_PROFILE_PROPERTY);
        this.dialogs = new botbuilder_dialogs_1.DialogSet(this.dialogState);
        this.dialogs.add(new botbuilder_dialogs_1.ChoicePrompt(SELECT_DEPARTMENT_PROMPT));
        this.dialogs.add(new botbuilder_dialogs_1.TextPrompt(JOB_TITLE_PROMPT));
        this.dialogs.add(new botbuilder_dialogs_1.TextPrompt(JOB_DESCRIPTION_PROMPT));
        this.dialogs.add(new botbuilder_dialogs_1.ChoicePrompt(TEAM_STRATEGY_PROMPT));
        this.dialogs.add(new botbuilder_dialogs_1.ChoicePrompt(SELECT_TEAM_PROMPT));
        this.dialogs.add(new botbuilder_dialogs_1.TextPrompt(CREATE_TEAM_PROMPT));
        this.dialogs.add(new botbuilder_dialogs_1.ChoicePrompt(OTHER_TEAM_PARTICIPATION_PROMPT));
        this.dialogs.add(new botbuilder_dialogs_1.WaterfallDialog(START_ONBOARDING, [
            this.selectDepartment.bind(this),
            this.promptForJobTitle.bind(this),
            this.promptForJobDescription.bind(this),
            this.startTeamPrompts.bind(this)
        ]));
        this.dialogs.add(new botbuilder_dialogs_1.WaterfallDialog(DISPLAY_ONBOARDING_RESULTS, [
            this.finishOnboarding.bind(this)
        ]));
        this.dialogs.add(new botbuilder_dialogs_1.WaterfallDialog(TEAM_STRATEGY_DIALOG, [
            this.promptForTeamStrategy.bind(this),
            this.chooseTeamStrategy.bind(this)
        ]));
        this.dialogs.add(new botbuilder_dialogs_1.WaterfallDialog(SELECT_TEAM_DIALOG, [
            this.selectTeam.bind(this),
            this.processTeamPrompt.bind(this),
            this.finishOrLoopTeamPrompt.bind(this)
        ]));
        this.dialogs.add(new botbuilder_dialogs_1.WaterfallDialog(CREATE_TEAM_DIALOG, [
            this.createTeamPrompt.bind(this),
            this.processTeamPrompt.bind(this),
            this.finishOrLoopTeamPrompt.bind(this)
        ]));
    }
    selectDepartment(step) {
        return __awaiter(this, void 0, void 0, function* () {
            yield step.prompt(SELECT_DEPARTMENT_PROMPT, 'Please select your department?', ['DEVS', 'QA', 'DEVOPS', 'SALES', 'HR']);
        });
    }
    promptForJobTitle(step) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userProfile.get(step.context, {});
            user.department = step.result;
            yield this.userProfile.set(step.context, user);
            return yield step.prompt(JOB_TITLE_PROMPT, `What is your job title?`);
        });
    }
    promptForJobDescription(step) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userProfile.get(step.context, {});
            user.jobTitle = step.result;
            yield this.userProfile.set(step.context, user);
            return yield step.prompt(JOB_DESCRIPTION_PROMPT, `What is your job description?`);
        });
    }
    promptForTeamStrategy(step) {
        return __awaiter(this, void 0, void 0, function* () {
            yield step.prompt(TEAM_STRATEGY_PROMPT, 'Please select a team you\'re in or create a new one', ['Select a team', 'Add new one']);
        });
    }
    chooseTeamStrategy(step) {
        return __awaiter(this, void 0, void 0, function* () {
            if (step.result && step.result.value === 'Select a team') {
                return yield step.beginDialog(SELECT_TEAM_DIALOG);
            }
            else {
                return yield step.beginDialog(CREATE_TEAM_DIALOG);
            }
        });
    }
    startTeamPrompts(step) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userProfile.get(step.context, {});
            user.jobDescription = step.result;
            yield this.userProfile.set(step.context, user);
            return yield step.replaceDialog(TEAM_STRATEGY_DIALOG);
        });
    }
    selectTeam(step) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userProfile.get(step.context, {});
            yield this.userProfile.set(step.context, user);
            return yield step.prompt(SELECT_TEAM_PROMPT, `Please select your team`, ['renaizant', 'ngx-bootstrap', 'cbdd']);
        });
    }
    createTeamPrompt(step) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield step.prompt(CREATE_TEAM_PROMPT, `Please enter your team's name`);
        });
    }
    processTeamPrompt(step) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userProfile.get(step.context, {});
            user.teams = Array.isArray(user.teams) ? [...user.teams, step.result] : [step.result];
            yield this.userProfile.set(step.context, user);
            return yield step.prompt(OTHER_TEAM_PARTICIPATION_PROMPT, `Do you participate in other teams?`, ['yes', 'no']);
        });
    }
    finishOrLoopTeamPrompt(step) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(step.result);
            if (step.result.value === 'yes') {
                console.log('replacing dialog');
                return yield step.replaceDialog(TEAM_STRATEGY_DIALOG);
            }
            else {
                console.log('ending dialog');
                return yield step.endDialog();
            }
        });
    }
    finishOnboarding(step) {
        return __awaiter(this, void 0, void 0, function* () {
            const reference = botbuilder_1.TurnContext.getConversationReference(step.context.activity);
            const user = yield this.userProfile.get(step.context, {});
            yield this.userProfile.set(step.context, user);
            yield step.context.sendActivity('You have successfully finished onboarding');
            yield step.context.sendActivity(`Department = ${user.department.value}. Job title = ${user.jobTitle}. Job description = ${user.jobDescription}. Teams = ${user.teams.toString()}`);
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                yield this.sendNotification(reference);
            }), 10000);
            return yield step.endDialog();
        });
    }
    sendNotification(reference, notification = `Here's your notification`) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.adapter.continueConversation(reference, (proactiveTurnContext) => __awaiter(this, void 0, void 0, function* () {
                yield proactiveTurnContext.sendActivity(notification);
            }));
        });
    }
    onTurn(turnContext) {
        return __awaiter(this, void 0, void 0, function* () {
            if (turnContext.activity.type === botbuilder_1.ActivityTypes.Message) {
                const dc = yield this.dialogs.createContext(turnContext);
                const utterance = (turnContext.activity.text || '').trim().toLowerCase();
                if (utterance === 'cancel') {
                    if (dc.activeDialog) {
                        yield dc.cancelAllDialogs();
                        yield dc.context.sendActivity(`Ok... canceled.`);
                    }
                    else {
                        yield dc.context.sendActivity(`Nothing to cancel.`);
                    }
                }
                const results = yield dc.continueDialog();
                console.log(results);
                if (!turnContext.responded) {
                    const user = yield this.userProfile.get(dc.context, {});
                    yield dc.beginDialog(user.jobTitle ? DISPLAY_ONBOARDING_RESULTS : START_ONBOARDING);
                }
            }
            else if (turnContext.activity.type === botbuilder_1.ActivityTypes.ConversationUpdate) {
                if (turnContext.activity.membersAdded.length) {
                    for (const idx in turnContext.activity.membersAdded) {
                        if (turnContext.activity.membersAdded[idx].id !== turnContext.activity.recipient.id) {
                            yield turnContext.sendActivity('Greetings from Onboarding Bot');
                        }
                    }
                }
            }
            yield this.userState.saveChanges(turnContext);
            yield this.conversationState.saveChanges(turnContext);
        });
    }
}
exports.OnboardingBot = OnboardingBot;
