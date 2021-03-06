import {SequelizeContentMapper as contentMapper} from './SequelizeContentMapper'
import messages from '../../../../common/messages/message'

export default class SequelizeContentRepository {
  constructor ({content, report, member}) {
    this.contentModel = content
    this.reportModel = report
    this.memberModel = member
  }

  async createContent (content) {
    const {valid, errors} = content.validate()

    if (!valid) {
      const error = new Error('ValidationError')
      error.details = errors

      throw error
    }

    const newContent = await this.contentModel.create(contentMapper.toDatabase(content))
    return contentMapper.toEntity(newContent)
  }

  async countContent (articleId) {
    return this.contentModel.count({where: {articleId}})
  }

  async deleteContentByArticleId (articleId, options = {}) {
    const contents = await this.contentModel.findAll({where: {articleId}})
    if (contents.length > 0) {
      await contents.map(content => content.destroy({...options}))
    }
    return null
  }

  async findContentById (id) {
    try {
      const content = await this._getContent(id)

      return contentMapper.toEntity(content)
    } catch (error) {
      throw error
    }
  }

  reportContent (memberId, articleId, contentId, text) {
    try {
      return this.reportModel.create({memberId, articleId, contentId, text})
    } catch (error) {
      throw error
    }
  }

  async findContents (articleId, parentContentId, start, count) {
    try {
      const {count: total, rows} = await this.contentModel.findAndCountAll({
        where: {articleId, parentContentId},
        include: [{
          model: this.memberModel,
        }],
        offset: start,
        limit: count,
        order: [['updatedAt', 'DESC']],
      })

      return {
        items: rows.map(row => row.toJSON()),
        total,
        start,
        count
      }
    } catch (error) {
      throw error
    }
  }

  async _getContent (id) {
    try {
      return await this.contentModel.findByPk(id, {rejectOnEmpty: true})
    } catch (error) {
      if (error.name === 'SequelizeEmptyResultError') {
        const notFoundError = new Error('NotFoundError')
        notFoundError.code = messages.E006.code
        notFoundError.details = messages.E006.detail

        throw notFoundError
      }

      throw error
    }
  }

  async updateContent (contentId, contentReqData) {
    try {
      const content = await this._getContent(contentId)

      const updatedContent = await content.update(contentMapper.toDatabase(contentReqData))
      const contentEntity = contentMapper.toEntity(updatedContent)

      const {valid, errors} = contentEntity.validate()

      if (!valid) {
        const error = new Error('ValidationError')
        error.details = errors

        throw error
      }

      return contentEntity
    } catch (error) {
      throw error
    }
  }

  async deleteContent (contentId) {
    try {
      const content = await this._getContent(contentId)
      await content.destroy()

      return null
    } catch (error) {
      throw error
    }
  }
}
