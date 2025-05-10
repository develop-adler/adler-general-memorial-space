
import * as S from './styles';

import Discord from '#/static/icons/random-chat-icons/newAdlerDiscord.svg';
import DiscordHover from '#/static/icons/random-chat-icons/newAdlerDiscordHover.svg';
import LinkedIn from '#/static/icons/random-chat-icons/newAdlerLinkedin.svg';
import LinkedInHover from '#/static/icons/random-chat-icons/newAdlerLinkedinHover.svg';
import Telegram from '#/static/icons/random-chat-icons/newAdlerTelegram.svg';
import TelegramHover from '#/static/icons/random-chat-icons/newAdlerTelegramHover.svg';
import Web from '#/static/icons/random-chat-icons/newAdlerWeb.svg';
import WebHover from '#/static/icons/random-chat-icons/newAdlerWebHover.svg';
import { SmartIcon } from '@/components/globals/SmartIcon';

const FooterContainer: React.FC = () => {

    const socialIcons = [
        { src: Discord, hoverSrc: DiscordHover, alt: 'Discord', link: 'https://discord.gg/KrmQeG25n2' },
        { src: Telegram, hoverSrc: TelegramHover, alt: 'Telegram', link: 'https://t.me/adler3drandomchat' },
        { src: LinkedIn, hoverSrc: LinkedInHover, alt: 'LinkedIn', link: 'https://www.linkedin.com/in/sejin-han-8aba44187/' },
        { src: Web, hoverSrc: WebHover, alt: 'Web', link: 'https://adler.cx' },
    ];

    return (
        <S.Container>
            <S.FooterTextContainer>
                © 2025 Adler Inc. | All rights reserved
            </S.FooterTextContainer>
            <S.FooterSocialContainer>
                {socialIcons.map((icon, index) => (
                    <S.FooterSocialIconContainer 
                        href={icon.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                            e.preventDefault();
                            window.open(icon.link, '_blank');
                        }}
                        key={index}
                    >
                        <SmartIcon
                            src={icon.src}
                            hoverSrc={icon.hoverSrc}
                            alt={icon.alt}
                            width={15}
                            height={15}
                        />
                    </S.FooterSocialIconContainer>
                ))}
            </S.FooterSocialContainer>
        </S.Container>
    )
}

export default FooterContainer