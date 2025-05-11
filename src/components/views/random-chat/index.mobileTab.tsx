"use client";
import Image from 'next/image';

import * as S from './styles';

import { SmartIcon } from '@/components/globals/SmartIcon';
import { BodyTextContainer } from '@/components/views/random-chat/component/BodyTextContainer';
import { FooterContainer } from '@/components/views/random-chat/component/FooterContainer';

import AdlerIconMobile from '#/static/imgs/random-chat-images/adlerIconMobile.png';
import VTuberImage from '#/static/imgs/random-chat-images/vTuberImage.png';

const RandomChat: React.FC = () => {
  return (
    <S.Container>
      <S.InnerContainer>
        <S.FirstFiletrContainer />
        <S.SecondFiletrContainer />
        <S.HeaderIcon>
            <SmartIcon
                src={AdlerIconMobile}
                width={87}
                height={23}
                />
        </S.HeaderIcon>
        <BodyTextContainer />
        <S.VTuberImageContainer>
            <S.VTuberImage>
              <Image
                src={VTuberImage}
                alt="VTuber"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                />
            </S.VTuberImage>
          </S.VTuberImageContainer>
        <FooterContainer />
      </S.InnerContainer>
    </S.Container>
  )
}

export default RandomChat;