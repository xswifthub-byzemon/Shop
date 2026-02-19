require('dotenv').config();
const express = require('express');
const { 
    Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    StringSelectMenuBuilder, ChannelType, PermissionFlagsBits 
} = require('discord.js');

// ==========================================
// 🌐 1. ระบบปลุกบอท 24 ชั่วโมง (Express Server)
// ==========================================
const app = express();
app.get('/', (req, res) => res.send('Swift Hub Shop Bot is running 24/7! 🚀'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Web Server ทำงานแล้วค่ะ!'));

// ==========================================
// 🤖 2. ตั้งค่าบอท Discord
// ==========================================
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ==========================================
// 📝 3. สร้างชุดคำสั่ง Slash Commands
// ==========================================
const commands = [
    new SlashCommandBuilder()
        .setName('setup_verify')
        .setDescription('🛡️ สร้างแผงรับยศเข้าดิส (เฉพาะซีม่อน)')
        .addRoleOption(option => 
            option.setName('role')
            .setDescription('เลือกยศที่จะให้สมาชิกเมื่อกดปุ่มรับยศ')
            .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('shop_status')
        .setDescription('🏪 เปลี่ยนสถานะร้าน เปิด/ปิด (เฉพาะซีม่อน)')
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`✅ บอท ${client.user.tag} พร้อมทำงานแล้วค่ะ!`);
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✨ ลงทะเบียนคำสั่งสำเร็จแล้ว!');
    } catch (error) {
        console.error(error);
    }
});

// ==========================================
// ⚙️ 4. ระบบจัดการคำสั่งและการกดปุ่ม
// ==========================================
client.on('interactionCreate', async interaction => {
    
    // ------------------------------------------------
    // 💬 เมื่อมีคนพิมพ์คำสั่ง Slash Commands
    // ------------------------------------------------
    if (interaction.isChatInputCommand()) {
        
        // 🔒 ล็อคให้เฉพาะซีม่อน (เช็คจาก OWNER_ID ใน Railway)
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '🚫 งื้อออ คำสั่งนี้ใช้ได้เฉพาะเถ้าแก่ซีม่อนเท่านั้นนะคะ!', ephemeral: true });
        }

        // 🛡️ คำสั่งที่ 1: /setup_verify
        if (interaction.commandName === 'setup_verify') {
            const role = interaction.options.getRole('role');

            // ออกแบบ Panel รับยศใหม่ให้สวยปิ๊ง!
            const verifyEmbed = new EmbedBuilder()
                .setTitle('✨ 𝐕𝐄𝐑𝐈𝐅𝐘 & 𝐆𝐄𝐓 𝐑𝐎𝐋𝐄𝐒 ✨')
                .setDescription(`ยินดีต้อนรับสู่ **Swift Hub Shop** ค้าบ! 🎉\n\nเพื่อความปลอดภัยและเปิดการมองเห็นห้องแชททั้งหมดในเซิร์ฟเวอร์\nรบกวนสมาชิกกดปุ่มด้านล่างนี้เพื่อยืนยันตัวตนนะครับ 👇\n\n╭・┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈・╮\n   🔰 **ยศที่คุณจะได้รับ :** <@&${role.id}>\n╰・┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈・╯\n\n*( เมื่อกดรับยศแล้ว สามารถเข้าไปพูดคุยที่ห้องทั่วไปได้เลยครับผม! 🚀 )*`)
                .setColor(role.color || '#2b2d31') // 🎨 สี Panel เปลี่ยนตามสียศที่เลือก!
                .setThumbnail(interaction.guild.iconURL({ dynamic: true })) // ดึงรูปโปรไฟล์เซิร์ฟเวอร์มาโชว์มุมขวา
                .setFooter({ text: 'Swift Hub Shop Auto-System', iconURL: client.user.displayAvatarURL() });

            // สร้างปุ่มกดที่แสดงชื่อยศ
            const verifyButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`verify_${role.id}`)
                    .setLabel(`คลิกเพื่อรับยศ ${role.name}`)
                    .setEmoji('🔓')
                    .setStyle(ButtonStyle.Success)
            );

            await interaction.channel.send({ embeds: [verifyEmbed], components: [verifyButton] });
            await interaction.reply({ content: '✅ ปายสร้างแผงรับยศให้สวยปิ๊งแล้วค่ะ ซีม่อนลองดูในห้องได้เลย!', ephemeral: true });
        }

        // 🏪 คำสั่งที่ 2: /shop_status
        if (interaction.commandName === 'shop_status') {
            const statusMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('status_select')
                    .setPlaceholder('👉 เลือกสถานะร้านของซีม่อนเลยค่ะ!')
                    .addOptions([
                        { label: 'สถานะร้าน : OPEN', description: 'เปิดร้านรับลูกค้าแล้วจ้า!', value: 'open', emoji: '🟢' },
                        { label: 'สถานะร้าน : CLOSED', description: 'ปิดร้านพักผ่อนค้าบ', value: 'closed', emoji: '🔴' }
                    ])
            );

            await interaction.reply({ content: '🏪 **แผงควบคุมสถานะร้าน Swift Hub Shop**\nเลือกสถานะจากเมนูด้านล่างได้เลยนะคะ!', components: [statusMenu], ephemeral: true });
        }
    }

    // ------------------------------------------------
    // 👆 เมื่อลูกค้ากดปุ่มรับยศ (Button)
    // ------------------------------------------------
    if (interaction.isButton() && interaction.customId.startsWith('verify_')) {
        const roleId = interaction.customId.split('_')[1];
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) return interaction.reply({ content: '❌ หายศนี้ไม่เจอค่ะ', ephemeral: true });

        try {
            await interaction.member.roles.add(role);
            await interaction.reply({ content: `🎉 เย้! คุณได้รับยศ **${role.name}** เรียบร้อยแล้วค่ะ ยินดีต้อนรับน้าา!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ ปายให้ยศไม่ได้ค่ะ! ซีม่อนต้องเลื่อนยศบอทให้อยู่เหนือยศที่จะแจกในตั้งค่าเซิร์ฟเวอร์นะคะ', ephemeral: true });
        }
    }

    // ------------------------------------------------
    // 🔽 เมื่อซีม่อนเลือกเปิด/ปิดร้าน (Select Menu)
    // ------------------------------------------------
    if (interaction.isStringSelectMenu() && interaction.customId === 'status_select') {
        
        // 🔒 ล็อคเมนูนี้ให้ซีม่อนกดได้คนเดียวเหมือนกัน
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ content: '🚫 เฉพาะซีม่อนเท่านั้นที่ปรับสถานะร้านได้ค่ะ!', ephemeral: true });
        }

        const selectedStatus = interaction.values[0];
        const guild = interaction.guild;
        const categoryName = '🟢 [ STATUS & INFO ] 🔴';
        const openName = '🔊 🟢・𝐒𝐭𝐚𝐭𝐮𝐬 : 𝐎𝐏𝐄𝐍';
        const closedName = '🔊 🔴・𝐒𝐭𝐚𝐭𝐮𝐬 : 𝐂𝐋𝐎𝐒𝐄𝐃';

        await interaction.deferUpdate(); // ให้บอทโหลดรอแป๊บนึง

        let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === categoryName);
        if (!category) {
            category = await guild.channels.create({ name: categoryName, type: ChannelType.GuildCategory });
        }

        // ลบห้องสถานะเก่า
        const oldStatusChannels = guild.channels.cache.filter(c => c.parentId === category.id && (c.name === openName || c.name === closedName));
        for (const [id, channel] of oldStatusChannels) {
            await channel.delete().catch(() => {});
        }

        // สร้างห้องสถานะใหม่
        const newChannelName = selectedStatus === 'open' ? openName : closedName;
        await guild.channels.create({
            name: newChannelName,
            type: ChannelType.GuildVoice,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.Connect], // ห้ามเชื่อมต่อ
                    allow: [PermissionFlagsBits.ViewChannel] // แต่ให้มองเห็น
                }
            ]
        });

        await interaction.followUp({ content: `✅ อัปเดตห้องเป็น **${newChannelName}** เรียบร้อยแล้วค่ะ!`, ephemeral: true });
    }
});

client.login(process.env.TOKEN);
