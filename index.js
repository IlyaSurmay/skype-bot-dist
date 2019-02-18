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
const botframework_config_1 = require("botframework-config");
const path = require("path");
const restify = require("restify");
const dotenv = require("dotenv");
const socketIo = require("socket.io");
const bot_1 = require("./bot");
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
const adapter = new botbuilder_1.BotFrameworkAdapter({
    appId: endpointConfig.appId || process.env.microsoftAppID,
    appPassword: endpointConfig.appPassword || process.env.microsoftAppPassword,
    channelService: process.env.ChannelService,
    openIdMetadata: process.env.BotOpenIdMetadata
});
adapter.onTurnError = (context, error) => __awaiter(this, void 0, void 0, function* () {
    console.error(`\n [onTurnError]: ${error}`);
    yield context.sendActivity(`Oops. Something went wrong!`);
    yield conversationState.clear(context);
    yield conversationState.saveChanges(context);
});
const memoryStorage = new botbuilder_1.MemoryStorage();
const conversationState = new botbuilder_1.ConversationState(memoryStorage);
const userState = new botbuilder_1.UserState(memoryStorage);
const bot = new bot_1.SkypeBot();
const references = [];
const server = restify.createServer();
const io = socketIo.listen(server.server);
server.use(restify.plugins.bodyParser({ mapParams: true }));
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log(`\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator`);
    console.log(`\nTo talk to your bot, open echoBot-with-counter.bot file in the Emulator`);
});
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, (context) => __awaiter(this, void 0, void 0, function* () {
        const reference = botbuilder_1.TurnContext.getConversationReference(context.activity);
        const isChatReferenceExist = references.map(r => r.conversation.id).includes(reference.conversation.id);
        console.log('isChatReferenceExist ', isChatReferenceExist);
        console.log(reference.conversation.id);
        if (!isChatReferenceExist) {
            references.push(reference);
        }
        io.emit('onTurn', context);
        yield bot.onTurn(context);
    }));
});
io.sockets.on('connection', (socket) => {
    console.log('WS connection established');
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', (data) => {
        console.log(data);
    });
    socket.on('disconnect', () => {
        console.log('WS connection closed');
    });
    socket.on('notification', (msg) => {
        console.log('BOT: notification event received');
        references.forEach((r) => __awaiter(this, void 0, void 0, function* () {
            yield adapter.continueConversation(r, (proactiveTurnContext) => __awaiter(this, void 0, void 0, function* () {
                yield proactiveTurnContext.sendActivity(msg);
            }));
        }));
    });
});
function findReferenceByConversationId(conversationId) {
    return references.find(r => r.conversation.id === conversationId) || undefined;
}
