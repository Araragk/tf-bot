const Discord = require('discord.js')
const registerConfig = require('../registerConfig.json')

module.exports = {
  name: 'registrar',
  description: 'Registra o usuário mencionado.',
  usage: '@usuário',
  guildOnly: true,
  permissions: ['MANAGE_ROLES'],
  arguments: true,
  execute(message) {
    message.delete()
    const member = message.mentions.members.first()

    if (!member.user) return message.channel.send(`${message.author}***, Você precisa passar um usuário como parâmetro!***`)
    if (member.user.id == message.client.user.id) return message.channel.send(`${message.author}***, Você não pode me registrar!***`)
    if (member.user.id == message.author.id) return message.channel.send(`${message.author}***, Você não pode registrar a si mesmo!***`)

    function buildPage(section) {
      let descriptionText = ''
      registerConfig[section].options.forEach(option => {
        descriptionText += `${option.emoji} ${option.role}\n`
      })
  
      const embed = new Discord.MessageEmbed()
        .setTitle(registerConfig[section].text)
        .setDescription(descriptionText)
        .setColor(0xff8ae2)

      return embed
    }

    const roles = []
    let section = 0

    const embed = buildPage(section)
    
    message.channel.send(embed).then(newMessage => {
      registerConfig[section].options.forEach(async option => {
        await newMessage.react(option.emoji)
      })

      const emojis = []

      registerConfig.forEach(section => {
        section.options.forEach(option => {
          emojis.push(option.emoji)
        })
      })

      console.log(emojis)
      const filter = (reaction, user) => emojis.includes(reaction.emoji.name) && user.id == message.author.id

      const reactionCollector = newMessage.createReactionCollector(
        filter,
        {
          time: '30000',
          errors: ['time']
        }
      )

      reactionCollector.on('collect', async reaction => {
        reaction.users.remove(message.author)
        const role = registerConfig[section].options.filter(option => option.emoji == reaction.emoji.name)[0].role
        console.log(role)
        roles.push(role)
        await newMessage.reactions.removeAll()
        if (section + 1 == registerConfig.length) {
          newMessage.delete()
          return message.channel.send(roles.join(', ')) 
        }
        section++
        const embed = buildPage(section)
        newMessage.edit(embed)
        registerConfig[section].options.forEach(async option => {
          await newMessage.react(option.emoji)
        })
      })

      reactionCollector.on('end', () => {
        if (!newMessage.deleted) newMessage.delete()
      })
    })
  }
}