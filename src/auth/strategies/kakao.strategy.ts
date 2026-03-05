import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { AuthService } from '../auth.service';

// 카카오 OAuth
@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID!,
      callbackURL: process.env.KAKAO_CALLBACK_URL!,
    });
  }

  // 카카오 서버에서 유저 정보를 받아온 뒤 실행되는 함수
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void, // done 콜백
  ) {
    try {
      const kakaoId = String(profile.id);
      const name = profile.displayName || '사용자';
      const user = await this.authService.validateKakaoUser(kakaoId, name);
      done(null, user); // 👈 성공 시 done(null, user)
    } catch (error) {
      done(error); // 👈 실패 시 done(error)
    }
  }
}
