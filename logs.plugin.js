const discord = require("discord.js")
const api = require("../core/api/api.js")
const {client,config,events,utils,actions} = api
const bot = require('../index')
/** @param {discord.TextBasedChannel} channel @returns {Promise<{type:String,ticketopener:String,ticketTime:String>}*/
const getHiddenInfo = (channel) => {
    return new Promise((promiseresolve, reject) => {
        var result = {
            ticketopener:"/",
            type:"/",
            ticketTime:"/"
        }
        channel.messages.fetchPinned().then(msglist =>{
            var firstmsg = msglist.last()
            if (firstmsg == undefined || firstmsg.author.id != client.user.id) return false
            const hiddendata = bot.hiddenData.readHiddenData(firstmsg.embeds[0].description)
            const ticketType = hiddendata.data.find(d => d.key == "type").value
            const id = hiddendata.data.find(d => d.key == "openerid").value
            const ticketTime = new Date(firstmsg.createdTimestamp)
            promiseresolve({ticketTime:ticketTime,type:ticketType,ticketopener:id})
        })
    })
}
const toTimestamp = (strDate) => {  
    const [dateValues, timeValues] = strDate.split(' ');
    const [month, day, year] = dateValues.split('/');
    const [hours, minutes, seconds] = timeValues.split(':');
    const date = new Date(+year, month, +day, +hours, +minutes, +seconds);
    const timestampInMs = date.getTime();
    const timestampInSeconds = Math.floor(date.getTime() / 1000);  
    return timestampInSeconds
  }  
module.exports = () => {
    
    const pluginConfig = require("./configs/logs.json")
    if(pluginConfig.enabled == false){return}
    if (pluginConfig.channel){
        if (pluginConfig.channel.length < 16 || pluginConfig.channel.length > 20 || !/^\d+$/.test(pluginConfig.channel)){
            createError("'logs/channel' | this channel id is invalid")
        }else{console.log("Loaded Logs")}
    }else{return}

    
    //Ticket Open Logs
    events.onTicketOpen((user,channel,guild,date,ticketdata) => {
        if (pluginConfig.openLogs.enabled){
            const openEmbed = new discord.EmbedBuilder()
                .setColor(config.main_color)
                .setTitle("📖 New Ticket Created")
                .setDescription("Ticket: <#"+channel.id+">")
                .setFooter({text:"Opened By: "+user.tag,iconURL:user.displayAvatarURL()})
            guild.channels.cache.find(c => c.id == pluginConfig.channel).send({
                embeds:[openEmbed]
            })
        }
    })
    //Ticket Reopen Logs
    events.onTicketReopen((user,channel,guild,date,ticketdata) => {
        if (pluginConfig.reopenLogs.enabled){
            const reopenEmbed = new discord.EmbedBuilder()
                .setColor(config.main_color)
                .setTitle("📖 Ticket Reopened")
                .setDescription("Ticket: <#"+channel.id+">")
                .setFooter({text:"Opened By: "+user.tag,iconURL:user.displayAvatarURL()})
            guild.channels.cache.find(c => c.id == pluginConfig.channel).send({
                embeds:[reopenEmbed]
            })
        }
    })
    //Ticket Remove Logs
    events.onTicketRemove((user,editeduser,channel,guild,date,ticketdata) => {
        if (pluginConfig.removeLogs.enabled){
            const removeEmbed = new discord.EmbedBuilder()
                .setColor(config.main_color)
                .setTitle("➖ User Removed")
                .setDescription("Ticket: <#"+channel.id+">\nUser: <@"+editeduser.id+">")
                .setFooter({text:"Removed by "+user.tag,iconURL:user.displayAvatarURL()})
            guild.channels.cache.find(c => c.id == pluginConfig.channel).send({
                embeds:[removeEmbed]
            })
        }
    })
    //Ticket Add Logs
    events.onTicketAdd((user,editeduser,channel,guild,date,ticketdata) => {
        if (pluginConfig.addLogs.enabled){
            const addEmbed = new discord.EmbedBuilder()
                .setColor(config.main_color)
                .setTitle("➕ User Added")
                .setDescription("Ticket: <#"+channel.id+">\nUser: <@"+editeduser.id+">")
                .setFooter({text:"Added by "+user.tag,iconURL:user.displayAvatarURL()})
            guild.channels.cache.find(c => c.id == pluginConfig.channel).send({
                embeds:[addEmbed]
            })
        }
    })
    //Ticket Delete Logs
    events.onTicketDelete(async(user,channel,guild,date,ticketdata) => {
        if (pluginConfig.deleteLogs.enabled){
            var getTicketInfo = await getHiddenInfo(channel)
            if (getTicketInfo.ticketTime.getSeconds().toString().length === 1){var secondslen = "0"} else {var secondslen = ""}
            var d = `${getTicketInfo.ticketTime.getMonth()}/${getTicketInfo.ticketTime.getDate()}/${getTicketInfo.ticketTime.getYear()+1900} ${getTicketInfo.ticketTime.getHours()}:${getTicketInfo.ticketTime.getMinutes()}:${secondslen}${getTicketInfo.ticketTime.getSeconds()} GMT`
            var openTime = toTimestamp(d)
            var deleteTime = toTimestamp(`${date.getMonth()}/${date.getDate()}/${date.getYear()+1900} ${date.getHours()}:${date.getMinutes()}:${secondslen}${date.getSeconds()} GMT`)
            const deleteEmbed = new discord.EmbedBuilder()
                .setColor(config.main_color)
                .setTitle('Ticket Deleted')
                .addFields(
                    { name: 'Ticket Name: ', value: `${channel.name}`, inline: true },
                    { name: 'Opened By', value: `<@${getTicketInfo.ticketopener}>`, inline: true },
                    { name: 'Deleted By', value: `<@${user.id}>`, inline: true },
                )
                .addFields(
                    { name: 'Open Time: ', value: `<t:${openTime}>`, inline: true },
                    { name: 'Delete Time: ', value: `<t:${deleteTime}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Open Ticket' });
            guild.channels.cache.find(c => c.id == pluginConfig.channel).send({
                embeds:[deleteEmbed]
            })
        }
    })
    //Ticket Close Logs
    events.onTicketClose(async(user,channel,guild,date,ticketdata, reason) => {
        if (pluginConfig.enabled){
            var getTicketInfo = await getHiddenInfo(channel)
            if (getTicketInfo.ticketTime.getSeconds().toString().length === 1){var secondslen = "0"} else {var secondslen = ""}
            var d = `${getTicketInfo.ticketTime.getMonth()}/${getTicketInfo.ticketTime.getDate()}/${getTicketInfo.ticketTime.getYear()+1900} ${getTicketInfo.ticketTime.getHours()}:${getTicketInfo.ticketTime.getMinutes()}:${secondslen}${getTicketInfo.ticketTime.getSeconds()} GMT`
            var openTime = toTimestamp(d)
            var closeTime = toTimestamp(`${date.getMonth()}/${date.getDate()}/${date.getYear()+1900} ${date.getHours()}:${date.getMinutes()}:${secondslen}${date.getSeconds()} GMT`)
            const closeEmbed = new discord.EmbedBuilder()
                .setColor(config.main_color)
                .setTitle('Ticket Closed')
                .addFields(
                    { name: 'Ticket Name: ', value: `${channel.name}`, inline: true },
                    { name: 'Opened By', value: `<@${getTicketInfo.ticketopener}>`, inline: true },
                    { name: 'Reason: ', value: `${reason}`, inline: true }
                )
                .addFields(
                    { name: 'Closed By', value: `<@${user.id}>`, inline: true },
                    { name: 'Open Time: ', value: `<t:${openTime}>`, inline: true },
                    { name: 'Close Time: ', value: `<t:${closeTime}>`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Open Ticket' });
                
            guild.channels.cache.find(c => c.id == pluginConfig.channel).send({
                embeds:[closeEmbed]
            })
        }
    })
}