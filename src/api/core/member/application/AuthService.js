import Moment from 'moment'
import {sign} from '../../../common/jwt'
import {MemberToken} from '../domain/MemberToken'

export default class AuthService {
  constructor ({sequelizeMemberRepository, sequelizeMemberTokenRepository}) {
    this.memberRepository = sequelizeMemberRepository
    this.memberTokenRepository = sequelizeMemberTokenRepository
  }

  async login (loginId) {
    try {
      const member = await this.memberRepository.findMemberByLoginId(loginId)
      const expireAt = Moment(new Date()).add(1, 'year')

      if (member) {
        let newMemberToken = {}
        const memberToken = await this.memberTokenRepository.findMemberToken(member.memberId)

        if (memberToken) {
          newMemberToken = await this.memberTokenRepository.updateMemberTokenExpire(memberToken, expireAt)
        } else {
          newMemberToken = await this._createNewMemberToken(member.memberId, expireAt)
        }

        return newMemberToken.accessToken
      }

      const newMember = await this.memberRepository.createMember(loginId)
      const newMemberToken = await this._createNewMemberToken(newMember.memberId, expireAt)

      return newMemberToken.accessToken
    } catch (error) {
      throw error
    }
  }

  async _createNewMemberToken (memberId, expireAt) {
    const newToken = await sign(memberId)

    const memberToken = new MemberToken({
      memberId: memberId,
      accessToken: newToken,
      expireAt
    })
    const newMemberToken = await this.memberTokenRepository.createMemberToken(memberToken)

    return newMemberToken
  }
}
