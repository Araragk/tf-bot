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

    if (!member) return message.channel.send(`${message.author}***, Você precisa passar um usuário como parâmetro!***`)
    if (member.id == message.client.user.id) return message.channel.send(`${message.author}***, Você não pode me registrar!***`)
    if (member.id == message.author.id) return message.channel.send(`${message.author}***, Você não pode registrar a si mesmo!***`)

    function buildPage(index) {
      const section = registerConfig[index]
      let descriptionText = ''
      section.options.forEach(option => {
        descriptionText += `${option.emoji} <@&${option.role}>\n`
      })
  
      const embed = new Discord.MessageEmbed()
        .setTitle(section.text)
        .setDescription(descriptionText)
        .setColor(0xff8ae2)

      return embed
    }

    const roles = []
    let index = 0
    let section = registerConfig[index]

    const embed = buildPage(index)
    
    message.channel.send(embed).then(newMessage => {
      section.options.forEach(async option => {
        await newMessage.react(option.emoji)
      })

      const emojis = []

      registerConfig.forEach(section => {
        section.options.forEach(option => {
          emojis.push(option.emoji)
        })
      })

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
        const role = section.options.filter(option => option.emoji == reaction.emoji.name)[0].role
        roles.push(role)
        await newMessage.reactions.removeAll()
        if (index + 1 == registerConfig.length) {
          newMessage.delete()
          message.channel.send(roles.map(role => `<@&${role}>`).join(' '))
          for (const selectedRole of roles) {
            await member.roles.add(selectedRole)
          }
          // message.guild.roles.cache.get(roles)
          return
        }
        index++
        section = registerConfig[index]
        const embed = buildPage(index)
        newMessage.edit(embed)
        section.options.forEach(async option => {
          await newMessage.react(option.emoji)
        })
      })

      reactionCollector.on('end', () => {
        if (!newMessage.deleted) newMessage.delete()
      })
    })
  }
}