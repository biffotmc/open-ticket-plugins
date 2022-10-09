const discord = require("discord.js")
const api = require("../core/api/api.js")
const discordTranscripts = require('discord-html-transcripts');

module.exports = () => {
    const bot = require('../index')
    l = bot.language
    const {client,config,events,utils,actions} = api
    const pluginConfig = require("./configs/html-transcripts.json")
    console.log("Loaded html transcripts")
    events.onTicketClose(async(user,channel,guild,date,ticketdata,reason) => {
        const transcript = await discordTranscripts.createTranscript(channel, {
            limit: -1, // Max amount of messages to fetch.
            returnType: 'buffer', // Valid options: 'buffer' | 'string' | 'attachment' Default: 'attachment'
            fileName: ``, // Only valid with returnBuffer false. Name of attachment. 
            minify: false, // Minify the result? Uses html-minifier
            saveImages: false, // Download all images and include the image data in the HTML (allows viewing the image even after it has been deleted) (! WILL INCREASE FILE SIZE !)
            useCDN: true // Uses a CDN to serve discord styles rather than bundling it in HTML (saves ~8kb when minified)
        });
        if (transcript == null){log("system","internal error: transcript is not created!");return}
        fileattachment = new discord.AttachmentBuilder(transcript,{name:"transcript_"+user.username+".html",description:"HTML Transcript"})
        if (pluginConfig.enabled && pluginConfig.channel != ""){
            const transcriptEmbed = new discord.EmbedBuilder()
                .setColor(config.main_color)
                .setTitle("📄 "+l.messages.newTranscriptTitle)
                .setDescription(reason)
                .setFooter({text:l.messages.closedby+": "+user.tag+" | ticket: "+channel.name,iconURL:user.displayAvatarURL()})
            
            guild.channels.cache.find(c => c.id == pluginConfig.channel).send({
                embeds:[transcriptEmbed],
                files:[fileattachment]
            })
        }
        
        
    })
    

    
}