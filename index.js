const { Client, GatewayIntentBits, Partials, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel],
});

const TOKEN = process.env.BOT_TOKEN;

const commands = [
  {
    name: 'startgame',
    description: 'ابدأ لعبة جديدة من "مين برا السالفة"',
    options: [
      {
        type: 1, // SUB_COMMAND
        name: 'food',
        description: 'ابدأ لعبة بموضوع الأكل',
      },
      {
        type: 1, // SUB_COMMAND
        name: 'animals',
        description: 'ابدأ لعبة بموضوع الحيوانات',
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

let game = {
  isActive: false,
  players: new Set(),
  topic: '',
  impostor: null,
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  if (interaction.isCommand()) {
    const { commandName, options } = interaction;

    if (commandName === 'startgame') {
      const subCommand = options.getSubcommand();

      if (game.isActive) {
        await interaction.reply({ content: 'اللعبة جارية بالفعل!', ephemeral: true });
      } else {
        game.isActive = true;
        switch (subCommand) {
          case 'food':
            game.topic = 'الأكل';
            break;
          case 'animals':
            game.topic = 'الحيوانات';
            break;
        }
game.players.clear();
        game.impostor = null;

        await interaction.reply({
          content: تم بدء لعبة جديدة بموضوع: **${game.topic}**. اضغط على الزر أدناه للانضمام للعبة.,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('joingame')
                .setLabel('انضم للعبة')
                .setStyle(ButtonStyle.PRIMARY)
            ),
          ],
        });
      }
    }
  } else if (interaction.isButton()) {
    const userId = interaction.user.id;

    if (interaction.customId === 'join_game') {
      if (game.players.has(userId)) {
        await interaction.reply({ content: 'أنت بالفعل في اللعبة!', ephemeral: true });
      } else {
        game.players.add(userId);
        await interaction.reply({ content: ${interaction.user.username} انضم للعبة!, ephemeral: true });
        await interaction.followUp({ content: ${interaction.user.username} انضم للعبة!, components: [] });

        // اختيار لاعب مشوّش عشوائي
        if (game.players.size > 2 && !game.impostor) {
          game.impostor = Array.from(game.players)[Math.floor(Math.random() * game.players.size)];
          await interaction.followUp({ content: تم اختيار لاعب مشوش. اللعبة تحتوي على ${game.players.size} لاعبين., components: [] });
          await promptForGuess(interaction.channel);
        }
      }
    }
  }
});

async function promptForGuess(channel) {
  const buttons = Array.from(game.players).map(playerId =>
    new ButtonBuilder()
      .setCustomId(`guess${playerId})
      .setLabel(خمن ${playerId}`)
      .setStyle(ButtonStyle.SECONDARY)
  );

  await channel.send({
    content: 'من تعتقد أنه خارج الموضوع؟ قم بتحديد اللاعب من خلال الأزرار التالية:',
    components: [new ActionRowBuilder().addComponents(buttons)],
  });
}

client.login(TOKEN);
