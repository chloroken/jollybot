// Slash command interfacing
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, time } = require('discord.js');
const { token } = require('./config.json');
const client = new Client({
    fetchAllMembers: true,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// Role IDs
const adminRole = "1041743581746044938";
const botRole = "1087284983435100300";
// Channel IDs
const imgChannel = "1007706705347494019";
const zkChannel = "1089095090473029643";
const botChannel = "1089092588532924447";
// Commands
const rolesCommand = "!jollyRoles";

/* Events */
client.login(token);
client.on("messageCreate", message => {
    console.log("EVENT: messageCreate");
    let m = message, channel = m.channel.id;
    if ((channel === botChannel) && (isAdmin(m)) && (m.content === rolesCommand)) updateRoles(m);
    else if ((channel === imgChannel)  && (m.attachments.size === 0)) moderateMessage(message);
    else if ((channel === zkChannel)  && (!m.content.startsWith("https://zk"))) moderateMessage(message);
})

/* Slash command event */
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

/* Functions */
function isAdmin(message)
{
    console.log("isSteward()");
    if (message.member.roles.cache.some(role => role.id === adminRole)) return(true);
    return(false);
}
function updateRoles(message)
{
    console.log("updateRoles() start");
    // Update roster from cache
    let guild = client.guilds.cache.get("990386455169867806");
    guild.members.fetch();
    guild.members.cache.forEach(member =>
    {
        let id = fetchRoleID(member);
        // Validate operation
        if (member.roles.cache.has(id)) return;
        if (isBot(member)) return;
        // Adjust role
        member.roles.add(id).catch(console.error);
        console.log("updateRoles(): applied new role")
        // Alert media
        let rolePointer = guild.roles.cache.get(id);
        message.reply(member.displayName + " has earned the " + rolePointer.name + " role.");
    })
    message.reply("Roles updated.");
    console.log("updateRoles() end");
}
function fetchRoleID(member)
{
    console.log("fetchRoleID()");
    let day = 1, week = 7, month = 30, year = 365;
    let currentDate = new Date(), joinDate = calculateDayDelta(member.joinedAt, currentDate);
    if      (joinDate < day)        { return("1061606890209026108"); } // Probe
    else if (joinDate < week)       { return("1061607110481281044"); } // Venture
    else if (joinDate < week * 2)   { return("1061607139711385600"); } // Helios
    else if (joinDate < month)      { return("1061607152734715974"); } // Crane
    else if (joinDate < month * 2)  { return("1062237806438654042"); } // Loki
    else if (joinDate < month * 3)  { return("1061607216601370644"); } // Porpoise
    else if (joinDate < month * 6)  { return("1062238101235314719"); } // Praxis
    else if (joinDate < year)       { return("1061607223903649812"); } // Orca
    else if (joinDate < year * 3)   { return("1062238111674925167"); } // Vargur
    else                            { return("1058272269996142592"); } // Rorqual
}
function calculateDayDelta(a, b)
{
    console.log("calculateDayDelta()");
    const msPerDay = 1000 * 60 * 60 * 24;
    const time1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const time2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((time2 - time1) / msPerDay);
}
function isBot(member)
{
    console.log("isBot()");
    if (member.roles.cache.has(botRole)) return(true);
    return(false);
}
function moderateMessage(message)
{
    console.log("moderateMessage()");
    message.delete();
}