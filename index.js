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
const botbuilder_azure_1 = require("botbuilder-azure");
const botframework_config_1 = require("botframework-config");
const botframework_connector_1 = require("botframework-connector");
const bot_1 = require("./bot");
const path = require("path");
const restify = require("restify");
const dotenv = require("dotenv");
const socketIo = require("socket.io");
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });
const BOT_FILE = path.join(__dirname, (process.env.botFilePath || ''));
let botConfig;
try {
    botConfig = botframework_config_1.BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
}
catch (err) {
    console.error(`\nError reading bot file.  Please ensure you have valid botFilePath and botFileSecret set for your environment.`);
    console.error(`\n - You can find the botFilePath and botFileSecret in the Azure App Service application settings.`);
    console.error(`\n - If you are running this bot locally, consider adding a .env file with botFilePath and botFileSecret.`);
    console.error(`\n - See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.\n\n`);
    process.exit();
}
const DEV_ENVIRONMENT = 'development';
const BOT_CONFIGURATION = (process.env.NODE_ENV || DEV_ENVIRONMENT);
const endpointConfig = botConfig.findServiceByNameOrId(BOT_CONFIGURATION);
botframework_connector_1.MicrosoftAppCredentials.trustServiceUrl('https://smba.trafficmanager.net/apis/', new Date(8640000000000000));
const adapter = new botbuilder_1.BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword,
    channelService: process.env.ChannelService,
    openIdMetadata: process.env.BotOpenIdMetadata
});
adapter.onTurnError = (context, error) => __awaiter(this, void 0, void 0, function* () {
    console.error(`\n [onTurnError]: ${error}`);
    if (context.activity.type !== botbuilder_1.ActivityTypes.ContactRelationUpdate) {
        yield context.sendActivity(`Oops. Something went wrong!`);
    }
});
const dbStorage = new botbuilder_azure_1.CosmosDbStorage({
    serviceEndpoint: process.env.AZURE_SERVICE_ENDPOINT,
    authKey: process.env.AZURE_AUTH_KEY,
    databaseId: process.env.AZURE_DATABASE,
    collectionId: process.env.AZURE_COLLECTION,
    databaseCreationRequestOptions: {},
    documentCollectionRequestOptions: {}
});
const userState = new botbuilder_1.UserState(dbStorage);
const server = restify.createServer();
const io = socketIo.listen(server.server);
const bot = new bot_1.SkypeBot(userState, io);
server.use(restify.plugins.bodyParser({ mapParams: true }));
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nTo talk to your bot, open .bot file in the Emulator`);
});
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, (context) => __awaiter(this, void 0, void 0, function* () {
        const reference = botbuilder_1.TurnContext.getConversationReference(context.activity);
        const isAuthorized = yield bot.isAuthorizedProperty.get(context, false);
        console.log('isAuthorized = ', isAuthorized);
        if (context.activity.type === 'message' && !isAuthorized) {
            io.emit('verification_attempt', { body: context.activity.text, reference });
        }
        if (context.activity.type === botbuilder_1.ActivityTypes.ContactRelationUpdate) {
            console.log('REMOVING REFERENCE AND USER STORAGE');
            console.log(context.activity);
            yield bot.isWelcomeMessageSent.set(context, false);
            yield bot.isAuthorizedProperty.set(context, false);
            io.emit('remove_reference', { reference });
        }
        yield bot.onTurn(context, reference);
    }));
});
io.sockets.on('connection', (socket) => {
    console.log('WS connection established');
    socket.on('disconnect', () => {
        console.log('WS connection closed');
    });
    socket.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
        console.log('BOT: message event received');
        yield adapter.continueConversation(msg.reference, (turnContext) => __awaiter(this, void 0, void 0, function* () {
            if (msg.callbackId && msg.callbackId === 'verification-success') {
                console.log('BOT: verification success event received');
                yield bot.isAuthorizedProperty.set(turnContext, true);
                yield bot.userState.saveChanges(turnContext);
            }
            yield turnContext.sendActivity(msg.text);
        }));
    }));
});
