"use client";
import Image from 'next/image';

import * as S from './styles';

import { SmartIcon } from '@/components/globals/SmartIcon';
import BodyContainer from '@/components/views/random-chat/component/BodyContainer';
import { BodyTextContainer } from '@/components/views/random-chat/component/BodyTextContainer';
import { FooterContainer } from '@/components/views/random-chat/component/FooterContainer';

import AdlerIcon from '#/static/imgs/random-chat-images/adlerIcon.png';
import VTuberImage from '#/static/imgs/random-chat-images/vTuberImage.png';

const RandomChat: React.FC = () => {
  return (
    <S.Container>
      <S.InnerContainer>
        <S.HeaderIcon>
            <SmartIcon
                src={AdlerIcon}
                width={190}
                height={50}
                />
        </S.HeaderIcon>
        <BodyContainer>
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
          <BodyTextContainer />
        </BodyContainer>
        <FooterContainer />
      </S.InnerContainer>
    </S.Container>
  )
}

export default RandomChat;